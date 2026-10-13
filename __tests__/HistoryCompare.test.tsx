import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import HistoryCompare from '@/components/HistoryCompare';
import { AnalysisResponse } from '@/lib/types';
import { AnalysisHistoryItem } from '@/lib/storage';

function makeAnalysis(score: number, timestamp: string): AnalysisResponse {
  return {
    skinAnalysis: {
      healthScore: score,
      spots: { count: 1, severity: 'mild', description: '' },
      texture: { smoothness: 70, roughness: 30, description: '' },
      redness: { level: 10, description: '' },
      safetyFlags: [],
      barrierRepairRegimen: [],
    },
    vto: {
      recommendedLipShades: [],
      outfitPalette: { primary: '#000000', secondary: '#000000', accent: '#000000', inspiration: '' },
      description: '',
    },
    timestamp,
    imageWidth: 0,
    imageHeight: 0,
  };
}

const current = makeAnalysis(80, '2026-10-12T10:00:00.000Z');
const previous = makeAnalysis(72, '2026-10-11T10:00:00.000Z');

const history: AnalysisHistoryItem[] = [
  { id: '2', createdAt: previous.timestamp, summary: 'Skin score 72/100', imageData: '', analysis: previous },
];

describe('HistoryCompare', () => {
  it('shows the score delta versus the previous analysis', () => {
    render(<HistoryCompare current={current} history={history} currentImageData="test-image-data" />);
    // Click the toggle button to show the comparison
    fireEvent.click(screen.getByText(/Show Comparison/i));
    // Use a flexible matcher since text may be split across elements
    expect(screen.getByText((content) => content.includes('Up 8 points'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('72/100 → 80/100'))).toBeInTheDocument();
  });

  it('reports no change when the score is unchanged', () => {
    const same = makeAnalysis(80, '2026-10-12T10:00:00.000Z');
    render(<HistoryCompare current={same} history={[{ ...history[0], analysis: makeAnalysis(80, '2026-10-11T10:00:00.000Z') }]} currentImageData="test-image-data" />);
    // Click the toggle button to show the comparison
    fireEvent.click(screen.getByText(/Show Comparison/i));
    // Use flexible matcher - text is "No change" (capital N) and may be split across elements
    expect(screen.getByText((content) => content.toLowerCase().includes('no change'))).toBeInTheDocument();
  });

  it('renders nothing when there is no previous analysis to compare', () => {
    const { container } = render(<HistoryCompare current={current} history={[]} currentImageData="test-image-data" />);
    expect(container).toBeEmptyDOMElement();
  });
});
