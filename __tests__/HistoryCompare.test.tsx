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
    expect(screen.getByText(/Up 8 points/i)).toBeInTheDocument();
    expect(screen.getByText(/72\/100 → 80\/100/)).toBeInTheDocument();
  });

  it('reports no change when the score is unchanged', () => {
    render(<HistoryCompare current={current} history={history} currentImageData="test-image-data" />);
    const same = makeAnalysis(80, '2026-10-12T10:00:00.000Z');
    render(<HistoryCompare current={same} history={[{ ...history[0], analysis: makeAnalysis(80, '2026-10-11T10:00:00.000Z') }]} currentImageData="test-image-data" />);
    expect(screen.getAllByText(/no change/i).length).toBeGreaterThan(0);
  });

  it('renders nothing when there is no previous analysis to compare', () => {
    const { container } = render(<HistoryCompare current={current} history={[]} currentImageData="test-image-data" />);
    expect(container).toBeEmptyDOMElement();
  });
});
