'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';
import { AnalysisResponse } from '@/lib/types';
import { AnalysisHistoryItem } from '@/lib/storage';

interface HistoryCompareProps {
  /** The currently displayed analysis. */
  current: AnalysisResponse;
  /** Client-side analysis history (newest first). */
  history: AnalysisHistoryItem[];
}

/**
 * Compares the current analysis against the most recent previous one and shows
 * the health-score delta. Purely client-side — uses existing localStorage
 * history. Renders nothing when there is no earlier analysis to compare to.
 */
export default function HistoryCompare({ current, history }: HistoryCompareProps) {
  // The most recent *previous* analysis (history[0] may be the current one).
  const previous =
    history.find((item) => item.analysis.timestamp !== current.timestamp)?.analysis ??
    history[1]?.analysis;

  if (!previous) return null;

  const currentScore = current.skinAnalysis.healthScore;
  const previousScore = previous.skinAnalysis.healthScore;
  const delta = currentScore - previousScore;

  if (delta === 0) {
    return (
      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
        <span className="font-medium text-slate-900">No change</span>
        <span>vs your previous analysis ({previousScore}/100).</span>
      </div>
    );
  }

  const improved = delta > 0;
  const Icon = improved ? TrendingUp : TrendingDown;

  return (
    <div
      className={`mb-6 flex items-center gap-3 rounded-2xl border p-4 text-sm shadow-sm ${
        improved
          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
          : 'border-amber-200 bg-amber-50 text-amber-900'
      }`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${improved ? 'text-emerald-600' : 'text-amber-600'}`} aria-hidden="true" />
      <p>
        <span className="font-semibold">
          {improved ? 'Up' : 'Down'} {Math.abs(delta)} point{Math.abs(delta) === 1 ? '' : 's'}
        </span>{' '}
        vs your previous analysis ({previousScore}/100 → {currentScore}/100).
      </p>
    </div>
  );
}
