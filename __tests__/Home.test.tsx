import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import Home from '@/app/page';
import { saveAnalysis, saveAnalysisHistory } from '@/lib/storage';
import { AnalysisResponse } from '@/lib/types';

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
});
