import '@testing-library/jest-dom';
import { render, screen, act } from '@testing-library/react';
import ScanOverlay from '@/components/ScanOverlay';

const PHOTO = 'data:image/png;base64,AAAA';

describe('ScanOverlay', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the user photo with the mesh overlay', () => {
    render(<ScanOverlay imageData={PHOTO} progress={50} />);
    expect(screen.getByTestId('scan-overlay')).toBeInTheDocument();
    expect(screen.getByAltText(/your photo/i)).toHaveAttribute('src', PHOTO);
    // Mesh edges + nodes + beam are rendered as SVG.
    expect(document.querySelectorAll('svg line').length).toBeGreaterThan(0);
    expect(document.querySelectorAll('svg circle').length).toBeGreaterThan(0);
  });

  it('shows the phase and progress matching the progress prop', () => {
    render(<ScanOverlay imageData={PHOTO} progress={40} />);
    expect(screen.getByTestId('scan-phase')).toHaveTextContent('Skin Analysis');
    expect(screen.getByTestId('scan-progress-label')).toHaveTextContent('40%');
    expect(screen.getByTestId('scan-progress-fill')).toHaveStyle({ width: '40%' });
  });

  it('shows the preparing phase at the start of the scan', () => {
    render(<ScanOverlay imageData={PHOTO} progress={5} />);
    expect(screen.getByTestId('scan-phase')).toHaveTextContent('Preparing');
    expect(screen.getByTestId('scan-progress-label')).toHaveTextContent('5%');
  });

  it('shows the finalizing phase near the end of the scan', () => {
    render(<ScanOverlay imageData={PHOTO} progress={95} />);
    expect(screen.getByTestId('scan-phase')).toHaveTextContent('Finalizing');
    expect(screen.getByTestId('scan-progress-label')).toHaveTextContent('95%');
  });

  it('rotates the status micro-copy as time passes', () => {
    render(<ScanOverlay imageData={PHOTO} progress={40} />);
    // First message of the Skin Analysis phase.
    expect(screen.getByTestId('scan-message')).toHaveTextContent(/Scanning melanin levels/i);

    act(() => {
      jest.advanceTimersByTime(2800);
    });

    expect(screen.getByTestId('scan-message')).toHaveTextContent(/Checking barrier health/i);

    act(() => {
      jest.advanceTimersByTime(2800);
    });

    expect(screen.getByTestId('scan-message')).toHaveTextContent(/Evaluating skin texture/i);
  });

  it('clamps progress outside 0-100', () => {
    render(<ScanOverlay imageData={PHOTO} progress={150} />);
    expect(screen.getByTestId('scan-progress-label')).toHaveTextContent('100%');
  });
});
