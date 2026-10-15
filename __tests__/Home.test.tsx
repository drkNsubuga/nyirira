import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Home from '@/app/page';
import { saveAnalysis, saveAnalysisHistory, getAnalysisHistory } from '@/lib/storage';
import { AnalysisResponse } from '@/lib/types';
import { analyzeImage } from '@/lib/youcamClient';
import { compressImage } from '@/lib/image';
import { validateImageResolution } from '@/lib/imageValidation';
import { runFullImageValidation } from '@/lib/advancedValidation';

jest.mock('@/lib/youcamClient', () => ({
  analyzeImage: jest.fn(),
}));

jest.mock('@/lib/image', () => ({
  compressImage: jest.fn((dataUri: string) => Promise.resolve(dataUri)),
}));

jest.mock('@/lib/imageValidation', () => ({
  validateImageResolution: jest.fn().mockResolvedValue({ valid: true }),
  validateImageFile: jest.fn().mockReturnValue({ valid: true }),
}));

jest.mock('@/lib/advancedValidation', () => ({
  runFullImageValidation: jest.fn().mockResolvedValue({ valid: true }),
}));

function makeAnalysis(score = 72, ts = '2026-10-12T10:00:00.000Z'): AnalysisResponse {
  return {
    skinAnalysis: {
      healthScore: score,
      spots: { count: 3, severity: 'mild', description: 'spots' },
      texture: { smoothness: 68, roughness: 32, description: 'texture' },
      redness: { level: 35, description: 'redness' },
      safetyFlags: [
        {
          id: 'bleaching-warning',
          severity: 'critical',
          title: 'Avoid Bleaching Agents',
          description: 'desc',
          recommendation: 'rec',
        },
      ],
      barrierRepairRegimen: [],
    },
    vto: {
      recommendedLipShades: [
        { name: 'Terracotta', hexColor: '#8B4513', undertone: 'warm', description: 'warm' },
      ],
      outfitPalette: { primary: '#C1440E', secondary: '#1F4E5F', accent: '#E1A95F', inspiration: 'Kitenge' },
      description: 'palette',
    },
    timestamp: ts,
    imageWidth: 720,
    imageHeight: 960,
  };
}

describe('Home page', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders the capture screen by default', () => {
    render(<Home />);
    expect(screen.getByText('Nyirira')).toBeInTheDocument();
    expect(screen.getByText('Take Photo')).toBeInTheDocument();
    expect(screen.getByText('Upload')).toBeInTheDocument();
  });

  it('stays on the capture screen after reload even when a saved analysis exists in storage', () => {
    // Simulates a page refresh: interactive state is gone, only localStorage
    // remains. The app must boot to the original capture screen, NOT results.
    saveAnalysis(makeAnalysis(81));
    render(<Home />);
    expect(screen.getByText('Take Photo')).toBeInTheDocument();
    expect(screen.getByText('Upload')).toBeInTheDocument();
    expect(screen.queryByText(/Health Score/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Export image')).not.toBeInTheDocument();
  });

  it('shows recent history on the capture screen', () => {
    saveAnalysisHistory([
      {
        id: 'h1',
        createdAt: '2026-10-12T10:00:00.000Z',
        summary: 'Skin score 72/100',
        imageData: 'data:image/png;base64,AAAA',
        analysis: makeAnalysis(72),
      },
    ]);
    render(<Home />);
    expect(screen.getByText('Recent History')).toBeInTheDocument();
    expect(screen.getByText('Skin score 72/100')).toBeInTheDocument();
  });

  it('clears the history when the Clear history button is clicked', () => {
    saveAnalysisHistory([
      {
        id: 'h1',
        createdAt: '2026-10-12T10:00:00.000Z',
        summary: 'Skin score 72/100',
        imageData: 'data:image/png;base64,AAAA',
        analysis: makeAnalysis(72),
      },
    ]);
    render(<Home />);

    fireEvent.click(screen.getByRole('button', { name: /clear history/i }));

    expect(screen.queryByText('Recent History')).not.toBeInTheDocument();
    expect(getAnalysisHistory()).toEqual([]);
    expect(screen.getByText(/history cleared/i)).toBeInTheDocument();
  });

  it('removes a single history item without affecting the others', () => {
    saveAnalysisHistory([
      {
        id: 'h1',
        createdAt: '2026-10-12T10:00:00.000Z',
        summary: 'Skin score 72/100',
        imageData: 'data:image/png;base64,AAAA',
        analysis: makeAnalysis(72),
      },
      {
        id: 'h2',
        createdAt: '2026-10-11T10:00:00.000Z',
        summary: 'Skin score 60/100',
        imageData: 'data:image/png;base64,BBBB',
        analysis: makeAnalysis(60),
      },
    ]);
    render(<Home />);

    // Remove only the first item via its per-item delete button.
    fireEvent.click(screen.getByRole('button', { name: /remove skin score 72\/100/i }));

    expect(screen.queryByText('Skin score 72/100')).not.toBeInTheDocument();
    expect(screen.getByText('Skin score 60/100')).toBeInTheDocument();
    expect(getAnalysisHistory().map((i) => i.id)).toEqual(['h2']);
    expect(screen.getByText(/history item removed/i)).toBeInTheDocument();
  });

  it('shows an error instead of empty results when the analysis response is incomplete', async () => {
    (analyzeImage as jest.Mock).mockResolvedValueOnce({
      // Missing vto + numeric fields — the "no usable results" guard must fire.
      skinAnalysis: { healthScore: undefined },
      timestamp: '2026-10-12T10:00:00.000Z',
      imageWidth: 720,
      imageHeight: 960,
    });

    render(<Home />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['bytes'], 'selfie.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.click(await screen.findByText('Analyze'));

    await screen.findByText('Analysis Error');
    expect(screen.getByText(/no usable results/i)).toBeInTheDocument();
    // The dashboard must NOT render for an empty response.
    expect(screen.queryByText(/Health Score/i)).not.toBeInTheDocument();
    // Nothing was persisted to history.
    expect(getAnalysisHistory()).toEqual([]);
  });

  it('shows the animated scan overlay while analysis is in progress', async () => {
    let resolveAnalyze: (value: AnalysisResponse) => void = () => {};
    (analyzeImage as jest.Mock).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveAnalyze = resolve;
      }),
    );

    render(<Home />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['bytes'], 'selfie.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.click(await screen.findByText('Analyze'));

    // The photo is shown with the scan overlay while the API call is in flight.
    await screen.findByTestId('scan-overlay');
    expect(screen.getByText(/Analyzing Your Skin/i)).toBeInTheDocument();

    // Finish the analysis → results render and the overlay is gone.
    await act(async () => {
      resolveAnalyze(makeAnalysis(72));
    });

    await screen.findByText(/Health Score/i);
    expect(screen.queryByTestId('scan-overlay')).not.toBeInTheDocument();
  });


  it('renders the footer disclaimer', () => {
    render(<Home />);
    expect(screen.getByText(/consult a dermatologist/i)).toBeInTheDocument();
  });

  it('shows a friendly error alert with the photo and retry options when analysis fails', async () => {
    (analyzeImage as jest.Mock).mockRejectedValueOnce(
      new Error('Task failed: {"error":"error_large_face_angle","error_message":"turned too far","task_status":"error"}')
    );

    render(<Home />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['bytes'], 'selfie.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const analyzeButton = await screen.findByText('Analyze');
    fireEvent.click(analyzeButton);

    // Alert with the friendly message replaces the raw API error.
    await screen.findByText('Analysis Error');
    expect(screen.getByText(/Your face is turned or tilted too far/i)).toBeInTheDocument();
    // The failed photo is shown back to the user.
    expect(screen.getByAltText('Photo that failed analysis')).toBeInTheDocument();
    // Retry and take-new-photo options are available.
    expect(screen.getByText('Try again')).toBeInTheDocument();
    expect(screen.getByText('Take new photo')).toBeInTheDocument();
    // CameraCapture is hidden while the error alert is shown.
    expect(screen.queryByText('Upload')).not.toBeInTheDocument();
  });

  it('shows a friendly message for nested JSON task errors (data envelope)', async () => {
    // The exact shape YouCam returns for task errors: {status, data:{error,...}}.
    (analyzeImage as jest.Mock).mockRejectedValueOnce(
      new Error(
        'Task failed: {"status":200,"data":{"error":"error_src_face_too_small","error_message":"The face in the input image is too small. It needs to take up more than 60% of the image width.","results":null,"task_status":"error"}}'
      )
    );

    render(<Home />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['bytes'], 'selfie.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.click(await screen.findByText('Analyze'));

    await screen.findByText('Analysis Error');
    // Mapped error_src_face_too_small → the "move closer / 60% width" guidance.
    expect(screen.getByText(/Move closer to the camera/i)).toBeInTheDocument();
    expect(screen.getByText(/60% of the width/i)).toBeInTheDocument();
    // Raw JSON / internal codes must never leak into the alert.
    expect(screen.queryByText(/task_status/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/error_src_face_too_small/i)).not.toBeInTheDocument();
  });

  it('shows a helpful error for low resolution API errors', async () => {
    // error_below_min_image_size is now mapped to a specific message instead of generic.
    (analyzeImage as jest.Mock).mockRejectedValueOnce(
      new Error('Task failed: {"status":200,"data":{"error":"error_below_min_image_size","error_message":"The input image is below the minimum required resolution.","results":null,"task_status":"error"}}')
    );

    render(<Home />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['bytes'], 'selfie.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.click(await screen.findByText('Analyze'));

    await screen.findByText('Analysis Error');
    // Should use the specific message, not "no usable results".
    expect(screen.getByText(/too low-resolution/i)).toBeInTheDocument();
    expect(screen.getByText(/move closer/i)).toBeInTheDocument();
    expect(screen.queryByText(/no usable results/i)).not.toBeInTheDocument();
  });

  it('shows a deployment guidance message when the build has no API credentials', async () => {
    // Cloudflare Pages misconfig: live mode on, NEXT_PUBLIC_* keys absent at build.
    (analyzeImage as jest.Mock).mockRejectedValueOnce(
      new Error(
        'YouCam API credentials missing: NEXT_PUBLIC_YOUCAM_API_KEY and NEXT_PUBLIC_YOUCAM_API_URL. ' +
          'NEXT_PUBLIC_* values are baked into the bundle at BUILD time. On Cloudflare Pages: set them under Settings → Environment variables ...'
      )
    );

    render(<Home />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['bytes'], 'selfie.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.click(await screen.findByText('Analyze'));

    await screen.findByText('Analysis Error');
    expect(screen.getByText(/API keys were not available when this build was made/i)).toBeInTheDocument();
    expect(screen.getByText(/redeploy/i)).toBeInTheDocument();
    // The technical error text (env var dump) must not leak raw into the alert.
    expect(screen.queryByText(/baked into the bundle at BUILD time/i)).not.toBeInTheDocument();
  });

  it('uses the API error_message verbatim for unmapped codes, never raw JSON', async () => {
    (analyzeImage as jest.Mock).mockRejectedValueOnce(
      new Error(
        'Task failed: {"status":200,"data":{"error":"error_99999","error_message":"Something unexpected happened on our side.","results":null,"task_status":"error"}}'
      )
    );

    render(<Home />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['bytes'], 'selfie.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.click(await screen.findByText('Analyze'));

    await screen.findByText('Analysis Error');
    expect(screen.getByText(/Something unexpected happened on our side/i)).toBeInTheDocument();
    expect(screen.queryByText(/task_status/i)).not.toBeInTheDocument();
  });


  it('shows the validation error and skips analysis when the image fails pre-flight checks', async () => {
    (analyzeImage as jest.Mock).mockClear();
    (runFullImageValidation as jest.Mock).mockResolvedValueOnce({
      valid: false,
      message:
        'Image resolution too low (320×240px). The short side must be at least 480px.',
    });

    render(<Home />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['bytes'], 'tiny.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.click(await screen.findByText('Analyze'));

    await screen.findByText('Analysis Error');
    expect(screen.getByText(/Image resolution too low/i)).toBeInTheDocument();
    expect(screen.getByAltText('Photo that failed analysis')).toBeInTheDocument();
    // Analysis must never be attempted for an invalid image.
    expect(analyzeImage).not.toHaveBeenCalled();
  });

  it('lists all validation errors at once when multiple checks fail', async () => {
    (analyzeImage as jest.Mock).mockClear();
    (runFullImageValidation as jest.Mock).mockResolvedValueOnce({
      valid: false,
      message: 'No face detected. Face is too blurry.',
      errors: ['No face detected.', 'Face is too blurry.'],
    });

    render(<Home />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['bytes'], 'bad.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.click(await screen.findByText('Analyze'));

    await screen.findByText('Analysis Error');
    // Both failures must be visible simultaneously.
    expect(screen.getByText('No face detected.')).toBeInTheDocument();
    expect(screen.getByText('Face is too blurry.')).toBeInTheDocument();
    expect(analyzeImage).not.toHaveBeenCalled();
  });

  it('returns to the home capture screen when the brand name is clicked', async () => {
    // Start from a completed analysis (results screen).
    render(<Home />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['bytes'], 'selfie.jpg', { type: 'image/jpeg' });
    (analyzeImage as jest.Mock).mockResolvedValueOnce(makeAnalysis(72));
    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.click(await screen.findByText('Analyze'));
    await screen.findByText(/Health Score/i);

    // Click the brand name → back on the original capture screen.
    fireEvent.click(screen.getByRole('button', { name: /go to home/i }));
    await screen.findByText('Take Photo');
    expect(screen.getByText('Upload')).toBeInTheDocument();
    expect(screen.queryByText(/Health Score/i)).not.toBeInTheDocument();
  });

  it('returns to the camera flow when Take new photo is clicked after an error', async () => {
    (analyzeImage as jest.Mock).mockRejectedValueOnce(
      new Error('Task failed: {"error":"error_below_min_image_size","task_status":"error"}')
    );

    render(<Home />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['bytes'], 'selfie.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.click(await screen.findByText('Analyze'));
    await screen.findByText('Analysis Error');
    expect(screen.getByText(/too low-resolution/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Take new photo'));

    // Back to the fresh camera/upload flow with no error alert.
    await waitFor(() => expect(screen.getByText('Take Photo')).toBeInTheDocument());
    expect(screen.queryByText(/Analysis Error/i)).not.toBeInTheDocument();
  });
});
