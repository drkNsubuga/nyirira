'use client';

import { useState } from 'react';
import { TrendingUp, Eye, Calendar } from 'lucide-react';
import { AnalysisResponse } from '@/lib/types';
import Image from 'next/image';
import { AnalysisHistoryItem } from '@/lib/storage';

interface HistoryCompareProps {
  /** The currently displayed analysis. */
  current: AnalysisResponse;
  /** Client-side analysis history (newest first). */
  history: AnalysisHistoryItem[];
  /** The image data for the current analysis */
  currentImageData: string;
}

/**
 * Enhanced history comparison with side-by-side images and overlay markers
 * showing condition changes over time.
 */
export default function HistoryCompare({ current, history, currentImageData }: HistoryCompareProps) {
  const [showComparison, setShowComparison] = useState(false);

  // The most recent *previous* analysis (history[0] may be the current one).
  const previous = history.find((item) => item.analysis.timestamp !== current.timestamp)?.analysis ?? history[1]?.analysis;

  if (!previous) return null;

  const currentScore = current.skinAnalysis.healthScore;
  const previousScore = previous.skinAnalysis.healthScore;
  const delta = currentScore - previousScore;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-orange-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-100';
    if (score >= 60) return 'bg-amber-100';
    return 'bg-orange-100';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' · ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="mb-6">
      {/* Comparison toggle */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">Skin Health Comparison</h3>
        <button
          onClick={() => setShowComparison(!showComparison)}
          className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
        >
          <Eye className="w-4 h-4" />
          {showComparison ? 'Hide Comparison' : 'Show Comparison'}
        </button>
      </div>

{/* Score summary */}
      <div className={`mb-4 flex items-center gap-3 rounded-2xl border p-4 text-sm shadow-sm ${
        delta === 0
          ? 'border-slate-200 bg-white text-slate-600'
          : delta > 0
          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
          : 'border-amber-200 bg-amber-50 text-amber-900'
      }`}>
        {delta === 0 ? (
          <>
            <span className="font-medium text-slate-900">No change</span>
            <span>vs your previous analysis ({previousScore}/100).</span>
          </>
        ) : (
          <>
            <TrendingUp className={`w-5 h-5 flex-shrink-0 ${delta > 0 ? 'text-emerald-600' : 'text-amber-600'}`} aria-hidden="true" />
            <p>
              <span className="font-semibold">
                {delta > 0 ? 'Up' : 'Down'} {Math.abs(delta)} point{Math.abs(delta) === 1 ? '' : 's'}
              </span>{' '}
              vs your previous analysis ({previousScore}/100 → {currentScore}/100).
            </p>
          </>
        )}
      </div>

      {/* Side-by-side comparison */}
      {showComparison && (
        <div className="space-y-4">
          {/* Previous analysis */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-900">Previous Analysis</span>
              <span className="text-xs text-slate-500">{formatDate(previous.timestamp)}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Image preview */}
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                <Image
                  fill
                  src={history.find(item => item.analysis.timestamp === previous.timestamp)?.imageData || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2ZmZmZmZiIvPjx0ZXh0IHg9IjQwMCIgeT0iMzAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuMiI+UGVyZmVjdDwvdGV4dD48L3N2Zz4='}
                  alt="Previous analysis"
                  className="w-full h-full object-cover"
                  sizes="300px"
                />
              </div>
              
              {/* Metrics */}
              <div className="space-y-3">
                <div className={`p-3 rounded-lg text-center ${getScoreBg(previousScore)}`}>
                  <div className={`text-2xl font-bold ${getScoreColor(previousScore)}`}>
                    {previousScore}
                  </div>
                  <div className="text-sm text-slate-600">Health Score</div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-slate-50 p-2 rounded text-center">
                    <div className="font-medium">{previous.skinAnalysis.spots.count}</div>
                    <div className="text-slate-500">Spots</div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded text-center">
                    <div className="font-medium">{previous.skinAnalysis.redness.level}</div>
                    <div className="text-slate-500">Redness</div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded text-center">
                    <div className="font-medium">{previous.skinAnalysis.texture.smoothness}</div>
                    <div className="text-slate-500">Texture</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Current analysis */}
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-emerald-900">Current Analysis</span>
              <span className="text-xs text-emerald-700">{formatDate(current.timestamp)}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Image preview */}
              <div className="aspect-square rounded-lg overflow-hidden bg-emerald-100">
                <Image
                  fill
                  src={currentImageData}
                  alt="Current analysis"
                  className="w-full h-full object-cover"
                  sizes="300px"
                />
              </div>
              
              {/* Metrics */}
              <div className="space-y-3">
                <div className={`p-3 rounded-lg text-center bg-gradient-to-r from-emerald-500 to-green-600 text-white`}>
                  <div className="text-2xl font-bold text-white">
                    {currentScore}
                  </div>
                  <div className="text-sm opacity-90">Health Score</div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-emerald-50 p-2 rounded text-center">
                    <div className="font-medium text-emerald-700">{current.skinAnalysis.spots.count}</div>
                    <div className="text-emerald-600">Spots</div>
                  </div>
                  <div className="bg-emerald-50 p-2 rounded text-center">
                    <div className="font-medium text-emerald-700">{current.skinAnalysis.redness.level}</div>
                    <div className="text-emerald-600">Redness</div>
                  </div>
                  <div className="bg-emerald-50 p-2 rounded text-center">
                    <div className="font-medium text-emerald-700">{current.skinAnalysis.texture.smoothness}</div>
                    <div className="text-emerald-600">Texture</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
