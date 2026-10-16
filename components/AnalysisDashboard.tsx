'use client';

import ImageOverlay from './ImageOverlay';
import { AnalysisResponse } from '@/lib/types';
import { AlertTriangle, CheckCircle, Leaf, Palette, Shield, ArrowLeft } from 'lucide-react';
import { ANALYSIS_KEY } from '@/lib/storage';

interface AnalysisDashboardProps {
  analysis: AnalysisResponse;
  imageData: string; // Add imageData prop for ImageOverlay
  onBack: () => void;
  /** Optional callback to surface a confirmation message (e.g. a toast). */
  onSaved?: () => void;
}

export default function AnalysisDashboard({ analysis, imageData, onBack, onSaved }: AnalysisDashboardProps) {
  const { skinAnalysis, vto } = analysis;

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

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 pb-12">
      {/* Header */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Skin Health Score Card */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 mb-6 shadow-lg dark:from-slate-800 dark:to-slate-900">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Skin Health & Safety Score</h2>

        {/* Image Overlay with Skin Condition Markers */}
        <div className="mb-6">
          <ImageOverlay 
            analysis={analysis} 
            imageData={imageData} 
            className="w-full"
          />
        </div>

        <div className="flex items-center justify-between mb-8">
          <div className="flex-1">
            <div
              className={`w-32 h-32 rounded-full flex items-center justify-center ${getScoreBg(skinAnalysis.healthScore)} mx-auto mb-4`}
            >
              <div className="text-center">
                <div className={`text-5xl font-bold ${getScoreColor(skinAnalysis.healthScore)}`}>
                  {skinAnalysis.healthScore}
                </div>
                <div className="text-sm text-slate-600">Health Score</div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Spots */}
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-600" />
              Spots
            </h4>
            <p className="text-2xl font-bold text-slate-900">
              {/* The live API reports pigmentation as a score, not a spot count —
                  show "—" rather than a misleading zero. */}
              {skinAnalysis.spots.count > 0 ? skinAnalysis.spots.count : '—'}
            </p>
            <p className="text-sm text-slate-600 capitalize">{skinAnalysis.spots.severity}</p>
            <p className="text-xs text-slate-500 mt-2">{skinAnalysis.spots.description}</p>
          </div>

          {/* Texture */}
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Texture
            </h4>
            <div className="space-y-2 mb-2">
              <div>
                <p className="text-xs text-slate-600">Smoothness</p>
                <p className="text-sm font-bold text-slate-900">{skinAnalysis.texture.smoothness}%</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Roughness</p>
                <p className="text-sm font-bold text-slate-900">{skinAnalysis.texture.roughness}%</p>
              </div>
            </div>
          </div>

          {/* Redness */}
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              Redness
            </h4>
            <p className="text-2xl font-bold text-slate-900">{skinAnalysis.redness.level}%</p>
            <p className="text-xs text-slate-500 mt-2">{skinAnalysis.redness.description}</p>
          </div>
        </div>
      </div>

      {/* Safety Flags */}
      {skinAnalysis.safetyFlags.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Safety Flags
          </h3>

          <div className="space-y-3">
            {skinAnalysis.safetyFlags.map((flag) => (
              <div
                key={flag.id}
                className={`rounded-lg p-4 border-l-4 ${
                  flag.severity === 'critical'
                    ? 'bg-red-50 border-red-400'
                    : 'bg-amber-50 border-amber-400'
                }`}
              >
                <h4 className="font-semibold text-slate-900 mb-2">{flag.title}</h4>
                <p className="text-sm text-slate-700 mb-2">{flag.description}</p>
                <div className="flex items-start gap-2">
                  <Leaf className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-emerald-800">{flag.recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barrier Repair Regimen */}
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-8 mb-6 shadow-lg border-2 border-emerald-200 dark:from-emerald-950/60 dark:to-slate-900 dark:border-emerald-900">
        <h3 className="text-xl font-bold text-emerald-900 mb-4 flex items-center gap-2">
          <Leaf className="w-5 h-5" />
          Barrier Repair Regimen (Local & Safe)
        </h3>

        <div className="space-y-4">
          {skinAnalysis.barrierRepairRegimen.map((product) => (
            <div key={product.id} className="bg-white rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-emerald-900">{product.name}</h4>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-medium">
                  {product.frequency}
                </span>
              </div>

              <div className="mb-3">
                <p className="text-xs text-slate-600 font-semibold mb-1">Active Ingredients:</p>
                <div className="flex flex-wrap gap-2">
                  {product.activeIngredients.map((ingredient, i) => (
                    <span
                      key={i}
                      className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded border border-emerald-200"
                    >
                      {ingredient}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-sm text-slate-600">{product.notes}</p>
            </div>
          ))}
        </div>
      </div>

      {/* VTO Harmonized Look */}
      <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-8 mb-6 shadow-lg border-2 border-amber-200 dark:from-amber-950/50 dark:to-slate-900 dark:border-amber-900">
        <h3 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Your Harmonized Look
        </h3>

        <p className="text-amber-900 mb-6">{vto.description}</p>

        {/* Live look-vto result — the actual rendered virtual try-on image. */}
        {vto.tryOnImageUrl && (
          <div className="mb-6">
            <p className="text-sm font-semibold text-amber-900 mb-3">Live Virtual Try-On</p>
            <img
              src={vto.tryOnImageUrl}
              alt="Your virtual try-on result"
              className="w-full max-w-sm rounded-xl border-2 border-amber-300 shadow-md"
              onError={(e) => {
                // The presigned result URL expires ~2h after the task completes.
                (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Color Palette */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-amber-900 mb-3">Color Palette</p>
          {vto.outfitPalette.primary ? (
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-lg shadow-md mx-auto mb-2 border-2 border-amber-300"
                style={{ backgroundColor: vto.outfitPalette.primary }}
              />
              <p className="text-xs font-medium text-slate-700">Primary</p>
              <p className="text-xs text-slate-500">{vto.outfitPalette.primary}</p>
            </div>
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-lg shadow-md mx-auto mb-2 border-2 border-amber-300"
                style={{ backgroundColor: vto.outfitPalette.secondary }}
              />
              <p className="text-xs font-medium text-slate-700">Secondary</p>
              <p className="text-xs text-slate-500">{vto.outfitPalette.secondary}</p>
            </div>
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-lg shadow-md mx-auto mb-2 border-2 border-amber-300"
                style={{ backgroundColor: vto.outfitPalette.accent }}
              />
              <p className="text-xs font-medium text-slate-700">Accent</p>
              <p className="text-xs text-slate-500">{vto.outfitPalette.accent}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-lg shadow-md mx-auto mb-2 border-2 border-amber-300 flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
                <span className="text-xs font-bold">+</span>
              </div>
              <p className="text-xs font-medium text-slate-700">{vto.outfitPalette.inspiration}</p>
            </div>
          </div>
          ) : (
            <p className="text-sm text-amber-800">No color palette was saved with this result.</p>
          )}
        </div>

        {/* Recommended Lip Shades */}
        <div>
          <p className="text-sm font-semibold text-amber-900 mb-3">Recommended Lip Shades</p>
          {vto.recommendedLipShades.length > 0 ? (
          <div className="space-y-2">
            {vto.recommendedLipShades.map((shade, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 bg-white rounded-lg border border-amber-200">
                <div
                  className="w-8 h-8 rounded-lg border-2 border-white shadow-md"
                  style={{ backgroundColor: shade.hexColor }}
                />
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{shade.name}</p>
                  <p className="text-xs text-slate-600">{shade.description}</p>
                </div>
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded capitalize font-medium">
                  {shade.undertone}
                </span>
              </div>
            ))}
          </div>
          ) : (
            <p className="text-sm text-amber-800">No shade recommendations were saved with this result.</p>
          )}
        </div>
      </div>

      {/* Save Results */}
      <div className="flex gap-4">
        <button
          onClick={() => {
            localStorage.setItem(ANALYSIS_KEY, JSON.stringify(analysis));
            onSaved?.();
          }}
          className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
        >
          Save Results
        </button>
        <button
          onClick={onBack}
          className="flex-1 py-3 px-4 bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold rounded-lg transition-colors dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
        >
          New Analysis
        </button>
      </div>
    </div>
  );
}
