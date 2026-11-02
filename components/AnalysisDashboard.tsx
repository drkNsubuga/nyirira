'use client';

import ImageOverlay from './ImageOverlay';
import CommunitySafetyWatch from './CommunitySafetyWatch';
import ReportCounterfeitModal from './ReportCounterfeitModal';
import { AnalysisResponse } from '@/lib/types';
import React, { useState } from 'react';
import Image from 'next/image';
import { AlertTriangle, CheckCircle, Leaf, Palette, Shield, ArrowLeft, Users, ShieldAlert } from 'lucide-react';
import { ANALYSIS_KEY } from '@/lib/storage';
import { harmonizedLookLead } from '@/lib/recommendations';

interface AnalysisDashboardProps {
  analysis: AnalysisResponse;
  imageData: string;
  onBack: () => void;
  onSaved?: () => void;
}

// ---------- Lightweight Tabs ----------
type TabItem = React.ReactElement<{ value: string; children?: React.ReactNode }>;

function Tabs({ children, defaultValue, className }: { children: React.ReactNode; defaultValue: string; className?: string }) {
  const [value, setValue] = React.useState(defaultValue);
  const triggers = React.Children.toArray(children).filter((c): c is TabItem => React.isValidElement(c) && c.type === TabTrigger);
  const contents = React.Children.toArray(children).filter((c): c is TabItem => React.isValidElement(c) && c.type === TabContent);

  return (
    <div className={className}>
      <div role="tablist" className="flex overflow-x-auto border-b border-slate-200 mb-8 scrollbar-none">
        {triggers.map((trigger) => {
          const id = trigger.props.value;
          const active = value === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={active}
              id={`tab-${id}`}
              onClick={() => setValue(id)}
              className={`-mb-px whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                active
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {trigger.props.children}
            </button>
          );
        })}
      </div>
      <div className="space-y-6">
        {contents.map((content) => {
          const id = content.props.value;
          return value === id ? (
            <div key={id} role="tabpanel" aria-labelledby={`tab-${id}`} tabIndex={0} className="tab-panel">
              {content.props.children}
            </div>
          ) : null;
        })}
      </div>
    </div>
  );
}

function TabTrigger({ }: { children: React.ReactNode; value: string }) { return null; }
function TabContent({ }: { children: React.ReactNode; value: string }) { return null; }

/** Returns true when the analysis flags redness, inflammation, or dark spots severity that warrants the counterfeit prompt. */
function shouldPromptCounterfeit(analysis: AnalysisResponse): boolean {
  const { skinAnalysis } = analysis;
  return (
    skinAnalysis.redness.level >= 40 ||
    skinAnalysis.spots.severity === 'severe' ||
    skinAnalysis.spots.severity === 'moderate' ||
    skinAnalysis.safetyFlags.some((f) => f.severity === 'critical')
  );
}

export default function AnalysisDashboard({ analysis, imageData, onBack, onSaved }: AnalysisDashboardProps) {
  const { skinAnalysis, vto } = analysis;
  const [reportOpen, setReportOpen] = useState(false);

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
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <Tabs defaultValue="results" className="mb-2">
        <TabTrigger value="results">Analysis Results</TabTrigger>
        <TabTrigger value="safety">Safety &amp; Regimen</TabTrigger>
        <TabTrigger value="look">Harmonized Look</TabTrigger>
        <TabTrigger value="community">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Community Watch
          </span>
        </TabTrigger>

        {/* ===== Tab 1: Analysis Results ===== */}
        <TabContent value="results">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 mb-8 shadow-lg dark:from-slate-800 dark:to-slate-900">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Skin Health & Safety Score</h2>

            <div className="mb-6">
              <ImageOverlay analysis={analysis} imageData={imageData} className="w-full" />
            </div>

            <div className="flex items-center justify-between mb-8">
              <div className="flex-1">
                <div className={`w-32 h-32 rounded-full flex items-center justify-center ${getScoreBg(skinAnalysis.healthScore)} mx-auto mb-4`}>
                  <div className="text-center">
                    <div className={`text-5xl font-bold ${getScoreColor(skinAnalysis.healthScore)}`}>
                      {skinAnalysis.healthScore}
                    </div>
                    <div className="text-sm text-slate-600">Health Score</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-slate-600" />
                  Spots
                </h4>
                <p className="text-2xl font-bold text-slate-900">
                  {skinAnalysis.spots.count > 0 ? skinAnalysis.spots.count : '—'}
                </p>
                <p className="text-sm text-slate-600 capitalize">{skinAnalysis.spots.severity}</p>
                <p className="text-xs text-slate-500 mt-2">{skinAnalysis.spots.description}</p>
              </div>

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

              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  Redness
                </h4>
                <p className="text-2xl font-bold text-slate-900">{skinAnalysis.redness.level}%</p>
                <p className="text-xs text-slate-500 mt-2">{skinAnalysis.redness.description}</p>
              </div>
            </div>

            {/* Counterfeit diagnostic prompt */}
            {shouldPromptCounterfeit(analysis) && (
              <div className="mt-6 rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/40 dark:border-red-900 p-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-red-900 dark:text-red-100 mb-1">
                      Did this barrier damage start after using a recent product?
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                      Your skin shows signs of chemical irritation. Reporting suspected counterfeit
                      or harmful products helps protect others in your community.
                    </p>
                    <button
                      type="button"
                      onClick={() => setReportOpen(true)}
                      className="rounded-full bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-semibold text-white transition-colors"
                    >
                      Report a Product
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabContent>

        {/* ===== Tab 2: Safety & Regimen ===== */}
        <TabContent value="safety">
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
                        <span key={i} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded border border-emerald-200">
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
        </TabContent>

        {/* ===== Tab 3: Harmonized Look ===== */}
        <TabContent value="look">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Palette className="w-5 h-5 text-amber-600" />
              Harmonized Look
            </h3>
            <p className="text-slate-700 leading-relaxed">{harmonizedLookLead(skinAnalysis)}</p>
          </div>

          {vto.tryOnImageUrl && (
            <div className="mb-6">
              <p className="text-sm font-semibold text-amber-900 mb-3">Live Virtual Try-On</p>
              <Image
                src={vto.tryOnImageUrl}
                alt="Your virtual try-on result"
                width={400}
                height={500}
                className="w-full max-w-sm rounded-xl border-2 border-amber-300 shadow-md"
                sizes="(max-width: 640px) 100vw, 400px"
                onError={(e) => {
                  (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          )}

          <div className="mb-6">
            <p className="text-sm font-semibold text-amber-900 mb-3">Color Palette</p>
            {vto.outfitPalette.primary ? (
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Primary', color: vto.outfitPalette.primary },
                  { label: 'Secondary', color: vto.outfitPalette.secondary },
                  { label: 'Accent', color: vto.outfitPalette.accent },
                ].map(({ label, color }) => (
                  <div key={label} className="text-center">
                    <div className="w-16 h-16 rounded-lg shadow-md mx-auto mb-2 border-2 border-amber-300" style={{ backgroundColor: color }} />
                    <p className="text-xs font-medium text-slate-700">{label}</p>
                    <p className="text-xs text-slate-500">{color}</p>
                  </div>
                ))}
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

          <div>
            <p className="text-sm font-semibold text-amber-900 mb-3">Recommended Lip Shades</p>
            {vto.recommendedLipShades.length > 0 ? (
              <div className="space-y-2">
                {vto.recommendedLipShades.map((shade, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 bg-white rounded-lg border border-amber-200">
                    <div className="w-8 h-8 rounded-lg border-2 border-white shadow-md" style={{ backgroundColor: shade.hexColor }} />
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
        </TabContent>

        {/* ===== Tab 4: Community Safety Watch ===== */}
        <TabContent value="community">
          <div className="mb-5">
            <div className="flex items-center justify-between gap-3 mb-1">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-red-600" />
                Community Safety Watch
              </h3>
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="rounded-full bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Report Product
              </button>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Products flagged by Ugandan users — sorted by risk level.
            </p>
          </div>
          <CommunitySafetyWatch />
        </TabContent>
      </Tabs>

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

      <ReportCounterfeitModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        healthScore={skinAnalysis.healthScore}
      />
    </div>
  );
}
