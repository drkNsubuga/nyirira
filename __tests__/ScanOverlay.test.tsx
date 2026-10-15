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

  it('animates the beam via requestAnimationFrame with a bounded transform', () => {
    render(<ScanOverlay imageData={PHOTO} progress={50} />);
    const beam = document.querySelector(
      'svg rect[fill="url(#beamGradient)"]',
    ) as SVGRectElement;
    expect(beam.style.transform).toBe('');

    act(() => {
      // 1s into the 3s cosine cycle.
      jest.advanceTimersByTime(1000);
    });

    expect(beam.style.transform).toMatch(/translateY\(-?[\d.]+px\)/);
    // Cosine curve keeps the beam inside the frame (small overshoot tolerance
    // for the afterglow's half-height).
    const y = parseFloat(
      (beam.style.transform.match(/translateY\(([-\d.]+)px\)/) ?? ['', '0'])[1],
    );
    expect(y).toBeGreaterThanOrEqual(-0.03);
    expect(y).toBeLessThanOrEqual(1.03);
  });

  it('highlights only the nodes near the beam, never all or none mid-scan', () => {
    render(<ScanOverlay imageData={PHOTO} progress={50} />);

    act(() => {
      jest.advanceTimersByTime(500);
    });

    const hot = document.querySelectorAll('svg circle.scan-node-hot');
    const cold = document.querySelectorAll('svg circle.scan-node:not(.scan-node-hot)');
    // Every node keeps its base class; a subset is hot while the beam is mid-frame.
    expect(hot.length + cold.length).toBe(
      document.querySelectorAll('svg circle.scan-node').length,
    );
    expect(hot.length).toBeGreaterThan(0);
    expect(cold.length).toBeGreaterThan(0);
  });
});
