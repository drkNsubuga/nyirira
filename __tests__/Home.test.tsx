import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from '@/app/page';
import { saveAnalysis, saveAnalysisHistory } from '@/lib/storage';
import { AnalysisResponse } from '@/lib/types';
import { analyzeImage } from '@/lib/youcamClient';
import { compressImage } from '@/lib/image';
import { validateImageResolution } from '@/lib/imageValidation';

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

  it('restores saved results when an analysis exists in storage', () => {
    saveAnalysis(makeAnalysis(81));
    render(<Home />);
    // Dashboard renders the stored health score in the main score card.
    expect(screen.getByText(/Health Score/i)).toBeInTheDocument();
    // Use getAllByText and check the first one (main score card)
    expect(screen.getAllByText('81')[0]).toBeInTheDocument();
    // Export + Share actions are available on the results view.
    expect(screen.getByText('Export image')).toBeInTheDocument();
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
    expect(await screen.findByText(/turned or tilted too far/i)).toBeInTheDocument();
    // The failed photo is shown back to the user.
    expect(screen.getByAltText('Photo that failed analysis')).toBeInTheDocument();
    // Retry and take-new-photo options are available.
    expect(screen.getByText('Try again')).toBeInTheDocument();
    expect(screen.getByText('Take new photo')).toBeInTheDocument();
    // CameraCapture is hidden while the error alert is shown.
    expect(screen.queryByText('Upload')).not.toBeInTheDocument();
  });

  it('shows the validation error and skips analysis when the image fails pre-flight checks', async () => {
    (analyzeImage as jest.Mock).mockClear();
    (validateImageResolution as jest.Mock).mockResolvedValueOnce({
      valid: false,
      message: 'Image resolution too low (320×240px). The short side must be at least 480px.',
    });

    render(<Home />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['bytes'], 'tiny.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.click(await screen.findByText('Analyze'));

    expect(await screen.findByText(/resolution too low/i)).toBeInTheDocument();
    expect(screen.getByAltText('Photo that failed analysis')).toBeInTheDocument();
    // Analysis must never be attempted for an invalid image.
    expect(analyzeImage).not.toHaveBeenCalled();
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
    await screen.findByText(/too low-resolution/i);

    fireEvent.click(screen.getByText('Take new photo'));

    // Back to the fresh camera/upload flow with no error alert.
    await waitFor(() => expect(screen.getByText('Take Photo')).toBeInTheDocument());
    expect(screen.queryByText(/Analysis Error/i)).not.toBeInTheDocument();
  });
});
