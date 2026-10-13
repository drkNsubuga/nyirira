import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import AnalysisDashboard from '@/components/AnalysisDashboard';
import { AnalysisResponse } from '@/lib/types';

const sampleAnalysis: AnalysisResponse = {
  skinAnalysis: {
    healthScore: 72,
    spots: { count: 8, severity: 'mild', description: 'Minor hyperpigmented spots.' },
    texture: { smoothness: 68, roughness: 32, description: 'Generally smooth.' },
    redness: { level: 35, description: 'Mild localized redness.' },
    safetyFlags: [
      {
        id: 'bleaching-warning',
        severity: 'critical',
        title: 'Avoid Bleaching Agents',
        description: 'Hydroquinone and mercury can harm melanin-rich skin.',
        recommendation: 'Use niacinamide and daily sunscreen instead.',
      },
    ],
    barrierRepairRegimen: [
      {
        id: 'niacinamide',
        name: 'Niacinamide Serum',
        activeIngredients: ['Niacinamide', 'Zinc'],
        frequency: 'Morning & night',
        notes: 'Widely available in East African pharmacies.',
      },
    ],
  },
  vto: {
    recommendedLipShades: [
      { name: 'Terracotta', hexColor: '#8B4513', undertone: 'warm', description: 'Warm earthy tone.' },
      { name: 'Plum', hexColor: '#5C4033', undertone: 'cool', description: 'Deep cool berry.' },
    ],
    outfitPalette: {
      primary: '#C1440E',
      secondary: '#1F4E5F',
      accent: '#E1A95F',
      inspiration: 'Kitenge-inspired',
    },
    description: 'Warm, harmonious palette.',
  },
  timestamp: new Date('2026-10-12T10:00:00.000Z').toISOString(),
  imageWidth: 720,
  imageHeight: 960,
};

describe('AnalysisDashboard', () => {
  it('renders the health score', () => {
    render(<AnalysisDashboard analysis={sampleAnalysis} onBack={() => {}} imageData="test-image-data" />);
    expect(screen.getByText('72')).toBeInTheDocument();
  });

  it('renders safety flags and recommendations', () => {
    render(<AnalysisDashboard analysis={sampleAnalysis} onBack={() => {}} imageData="test-image-data" />);
    expect(screen.getByText('Avoid Bleaching Agents')).toBeInTheDocument();
    expect(screen.getByText(/niacinamide and daily sunscreen/i)).toBeInTheDocument();
  });

  it('renders the barrier repair regimen with East African availability notes', () => {
    render(<AnalysisDashboard analysis={sampleAnalysis} onBack={() => {}} imageData="test-image-data" />);
    expect(screen.getByText('Niacinamide Serum')).toBeInTheDocument();
    expect(screen.getByText(/East African pharmacies/i)).toBeInTheDocument();
  });

  it('renders recommended lip shades and the color palette', () => {
    render(<AnalysisDashboard analysis={sampleAnalysis} onBack={() => {}} imageData="test-image-data" />);
    expect(screen.getByText('Terracotta')).toBeInTheDocument();
    expect(screen.getByText('Plum')).toBeInTheDocument();
    expect(screen.getByText('Kitenge-inspired')).toBeInTheDocument();
  });

  it('persists to localStorage and calls onSaved when Save is clicked', () => {
    const onSaved = jest.fn();
    render(<AnalysisDashboard analysis={sampleAnalysis} onBack={() => {}} onSaved={onSaved} imageData="test-image-data" />);

    fireEvent.click(screen.getByText('Save Results'));

    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem('nyirira_analysis')).not.toBeNull();
  });
});
