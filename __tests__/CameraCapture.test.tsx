import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CameraCapture from '@/components/CameraCapture';

describe('CameraCapture', () => {
  const originalMedia = navigator.mediaDevices;

  afterEach(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: originalMedia,
      configurable: true,
    });
    jest.restoreAllMocks();
  });

  it('renders the Take Photo and Upload options initially', () => {
    render(<CameraCapture onImageCapture={() => {}} />);
    expect(screen.getByText('Take Photo')).toBeInTheDocument();
    expect(screen.getByText('Upload')).toBeInTheDocument();
  });

  it('shows a permission error and falls back to upload when camera access is denied', async () => {
    const fileInputClick = jest.fn();

    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: jest.fn().mockRejectedValue(Object.assign(new Error('denied'), { name: 'NotAllowedError' })),
      },
      configurable: true,
    });

    render(<CameraCapture onImageCapture={() => {}} />);

    // Spy on the hidden file input's click() to verify the auto-fallback.
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fileInput.click = fileInputClick;

    fireEvent.click(screen.getByText('Take Photo'));

    await waitFor(() => expect(fileInputClick).toHaveBeenCalled());
    expect(await screen.findByText(/camera permission denied/i)).toBeInTheDocument();
  });

  it('rejects files larger than 10MB with an error message', async () => {
    render(<CameraCapture onImageCapture={() => {}} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    // 11MB file
    const bigFile = new File([new Uint8Array(11 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' });

    fireEvent.change(fileInput, { target: { files: [bigFile] } });

    expect(await screen.findByText(/file too large/i)).toBeInTheDocument();
  });
});
