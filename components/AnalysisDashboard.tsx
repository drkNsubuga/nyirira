'use client';

import CommunitySafetyWatch from './CommunitySafetyWatch';
import ReportCounterfeitModal from './ReportCounterfeitModal';
import ImageOverlay from './ImageOverlay';
import { AnalysisResponse } from '@/lib/types';
import { applyMakeupVTO, getLastFileId, shouldUseRealApi } from '@/lib/youcamClient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  AlertTriangle,
  CheckCircle,
  Leaf,
  Palette,
  Shield,
  ArrowLeft,
  Users,
  ShieldAlert,
  Microscope,
  Loader2,
  WandSparkles,
  Pencil,
  Check,
  X,
  Layers,
  MapPin,
} from 'lucide-react';
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

function Tabs({
  children,
  defaultValue,
  className,
}: {
  children: React.ReactNode;
  defaultValue: string;
  className?: string;
}) {
  const [value, setValue] = React.useState(defaultValue);
  const triggers = React.Children.toArray(children).filter(
    (c): c is TabItem => React.isValidElement(c) && c.type === TabTrigger
  );
  const contents = React.Children.toArray(children).filter(
    (c): c is TabItem => React.isValidElement(c) && c.type === TabContent
  );

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

function TabTrigger(_: { children: React.ReactNode; value: string }) {
  return null;
}
function TabContent(_: { children: React.ReactNode; value: string }) {
  return null;
}

function shouldPromptCounterfeit(analysis: AnalysisResponse): boolean {
  const { skinAnalysis } = analysis;
  return (
    skinAnalysis.redness.level >= 40 ||
    skinAnalysis.spots.severity === 'severe' ||
    skinAnalysis.spots.severity === 'moderate' ||
    skinAnalysis.safetyFlags.some((f) => f.severity === 'critical')
  );
}

const CONCERN_LABELS: Record<string, string> = {
  redness: 'Redness',
  age_spot: 'Age Spots',
  texture: 'Texture',
  radiance: 'Radiance',
  acne: 'Acne',
  pore: 'Pores',
  wrinkle: 'Wrinkles',
  moisture: 'Moisture',
  oiliness: 'Oiliness',
  firmness: 'Firmness',
};

const CONCERN_COLORS: Record<string, string> = {
  redness: '#ef4444',
  age_spot: '#f59e0b',
  texture: '#8b5cf6',
  radiance: '#f97316',
  acne: '#ec4899',
  pore: '#06b6d4',
  wrinkle: '#64748b',
  moisture: '#3b82f6',
  oiliness: '#84cc16',
  firmness: '#14b8a6',
};

/**
 * Colour swatch with an embedded colour-picker wheel.
 * Clicking the swatch opens the native colour picker immediately.
 * The hex input below stays in sync. Committing (blur / Enter) fires onChange + onApplyVTO.
 */
function EditableSwatch({
  label,
  color,
  onChange,
  onApplyVTO,
}: {
  label: string;
  color: string;
  onChange: (hex: string) => void;
  onApplyVTO?: (hex: string) => void;
}) {
  const pickerRef = useRef<HTMLInputElement>(null);
  const [hex, setHex] = useState(color);
  const hasSynced = useRef(false);

  // Sync when parent resets — run after render to avoid accessing refs during render.
  useEffect(() => {
    if (!hasSynced.current && hex !== color && document.activeElement !== pickerRef.current) {
      setHex(color);
      hasSynced.current = true;
    }
    if (hex === color) hasSynced.current = false;
  }, [hex, color]);

  const commit = (value: string) => {
    const h = value.startsWith('#') ? value : `#${value}`;
    if (/^#[0-9a-fA-F]{6}$/.test(h)) {
      onChange(h);
      onApplyVTO?.(h);
    }
  };

  return (
    <div className="text-center">
      {/* Swatch = clickable wrapper around the hidden colour picker */}
      <div
        className="relative mx-auto mb-2 w-16 h-16 rounded-xl shadow-md border-2 border-amber-300 cursor-pointer hover:border-amber-500 transition-colors group"
        style={{ backgroundColor: hex }}
        title={`Click to pick ${label} colour`}
        onClick={() => pickerRef.current?.click()}
      >
        {/* Overlay pencil icon */}
        <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-xl">
          <Pencil className="w-5 h-5 text-white drop-shadow" />
        </span>
        {/* Hidden native colour picker — covers the swatch so click lands on it */}
        <input
          ref={pickerRef}
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(hex) ? hex : color}
          onChange={(e) => setHex(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          className="sr-only"
          aria-label={`${label} colour picker`}
        />
      </div>

      {/* Hex text input */}
      <input
        type="text"
        value={hex}
        onChange={(e) => setHex(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(hex); }}
        maxLength={7}
        className="w-full text-center text-xs font-mono rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-amber-400"
        aria-label={`${label} hex value`}
      />
      <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

export default function AnalysisDashboard({ analysis, imageData, onBack, onSaved }: AnalysisDashboardProps) {
  const { skinAnalysis, vto } = analysis;
  const [reportOpen, setReportOpen] = useState(false);
  const [palette, setPalette] = useState(vto.outfitPalette);
  const [activeShadeIdx, setActiveShadeIdx] = useState<number | null>(null);
  const [shadeVtoLoading, setShadeVtoLoading] = useState(false);
  const [shadeVtoUrls, setShadeVtoUrls] = useState<Record<string, string>>({});
  const [activeMaskIdx, setActiveMaskIdx] = useState<number | null>(null);
  /** Palette colour most recently committed for VTO (null = not triggered). */
  const [paletteVtoHex, setPaletteVtoHex] = useState<string | null>(null);
  /** Toggle between anatomical marker view and YouCam mask-overlay view. */
  const [viewMode, setViewMode] = useState<'markers' | 'masks'>('markers');

  const handleShadeSelect = useCallback(
    async (idx: number) => {
      const shade = vto.recommendedLipShades[idx];
      if (!shade) return;
      setActiveShadeIdx(idx);
      if (shadeVtoUrls[shade.hexColor]) return;
      if (!shouldUseRealApi()) return;
      const fileId = getLastFileId();
      if (!fileId) return;
      setShadeVtoLoading(true);
      try {
        const url = await applyMakeupVTO(fileId, shade.hexColor);
        if (url) setShadeVtoUrls((prev) => ({ ...prev, [shade.hexColor]: url }));
      } finally {
        setShadeVtoLoading(false);
      }
    },
    [vto.recommendedLipShades, shadeVtoUrls]
  );

  // Apply a committed palette colour through the same makeup-VTO pipeline as
  // a lip shade. Results land in shadeVtoUrls keyed by the hex so the Harmonized
  // Look try-on pane can display them. Only runs on the live-API path.
  const handlePaletteVTO = useCallback(
    async (hex: string) => {
      if (!shouldUseRealApi()) return;
      const fileId = getLastFileId();
      if (!fileId) return;
      if (shadeVtoUrls[hex]) return;
      setShadeVtoLoading(true);
      try {
        const url = await applyMakeupVTO(fileId, hex);
        if (url) setShadeVtoUrls((prev) => ({ ...prev, [hex]: url }));
      } finally {
        setShadeVtoLoading(false);
      }
    },
    [shadeVtoUrls]
  );

  const getScoreColor = (score: number) =>
    score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-orange-600';
  const getScoreBg = (score: number) =>
    score >= 80 ? 'bg-emerald-100' : score >= 60 ? 'bg-amber-100' : 'bg-orange-100';

  const concernMasks = skinAnalysis.concernMasks ?? [];
  const activeMask = activeMaskIdx !== null ? concernMasks[activeMaskIdx] : null;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 pb-12">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 font-medium">
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <Tabs defaultValue="results" className="mb-2">
        <TabTrigger value="results">
          <span className="flex items-center gap-1.5">
            <Microscope className="w-3.5 h-3.5" />
            Analysis Results
          </span>
        </TabTrigger>
        <TabTrigger value="safety">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Safety &amp; Regimen
          </span>
        </TabTrigger>
        <TabTrigger value="look">
          <span className="flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5" />
            Harmonized Look
          </span>
        </TabTrigger>
        <TabTrigger value="community">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Community Watch
          </span>
        </TabTrigger>

        {/* ===== Tab 1: Analysis Results ===== */}
        <TabContent value="results">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 mb-6 shadow-lg dark:from-slate-800 dark:to-slate-900">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
              Skin Health &amp; Safety Score
            </h2>

            {/* Skin image with anatomical markers or YouCam mask overlay */}
            <div className="mb-6">
              {/* Toggle between marker view (default) and mask-overlay view */}
              <div className="mb-3 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setViewMode((prev) => (prev === 'markers' ? 'masks' : 'markers'))}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-slate-400 transition-colors"
                >
                  {viewMode === 'markers' ? (
                    <>
                      <Layers className="w-3.5 h-3.5" />
                      Show Mask Overlays
                    </>
                  ) : (
                    <>
                      <MapPin className="w-3.5 h-3.5" />
                      Show Markers
                    </>
                  )}
                </button>
              </div>

              {viewMode === 'markers' ? (
                <ImageOverlay analysis={analysis} imageData={imageData} />
              ) : (
                <>
                  <div className="relative rounded-xl overflow-hidden">
                    <Image
                      src={imageData}
                      alt="Scanned skin photo"
                      width={600}
                      height={750}
                      className="w-full rounded-xl object-cover"
                      sizes="(max-width: 640px) 100vw, 600px"
                      unoptimized
                    />
                    {activeMask && activeMask.maskUrls[0] && (
                      <Image
                        src={activeMask.maskUrls[0]}
                        alt={`${CONCERN_LABELS[activeMask.type] ?? activeMask.type} mask overlay`}
                        fill
                        className="object-cover mix-blend-multiply opacity-70 rounded-xl"
                        unoptimized
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    {activeMask && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                        <Layers className="w-3 h-3" />
                        {CONCERN_LABELS[activeMask.type] ?? activeMask.type} overlay
                        <button
                          type="button"
                          aria-label="Clear overlay"
                          onClick={() => setActiveMaskIdx(null)}
                          className="ml-1 text-white/70 hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Concern mask selector (live API only) */}
                  {concernMasks.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        Show affected areas:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {concernMasks.map((mask, i) => {
                          const label = CONCERN_LABELS[mask.type] ?? mask.type;
                          const color = CONCERN_COLORS[mask.type] ?? '#64748b';
                          const active = activeMaskIdx === i;
                          return (
                            <button
                              key={mask.type}
                              type="button"
                              onClick={() => setActiveMaskIdx(active ? null : i)}
                              aria-pressed={active}
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-all ${
                                active
                                  ? 'text-white border-transparent'
                                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                              }`}
                              style={active ? { backgroundColor: color, borderColor: color } : {}}
                            >
                              <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: active ? 'rgba(255,255,255,0.7)' : color }}
                              />
                              {label}
                              <span className="opacity-70">{mask.ui_score}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Health score gauge */}
            <div className="flex justify-center mb-6">
              <div
                className={`w-32 h-32 rounded-full flex items-center justify-center ${getScoreBg(
                  skinAnalysis.healthScore
                )}`}
              >
                <div className="text-center">
                  <div className={`text-5xl font-bold ${getScoreColor(skinAnalysis.healthScore)}`}>
                    {skinAnalysis.healthScore}
                  </div>
                  <div className="text-sm text-slate-600">Health Score</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-slate-600" />
                  Spots
                </h4>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {skinAnalysis.spots.count > 0 ? skinAnalysis.spots.count : '—'}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 capitalize">
                  {skinAnalysis.spots.severity}
                </p>
                <p className="text-xs text-slate-500 mt-2">{skinAnalysis.spots.description}</p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Texture
                </h4>
                <div className="space-y-2 mb-2">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Smoothness</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {skinAnalysis.texture.smoothness}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Roughness</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {skinAnalysis.texture.roughness}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  Redness
                </h4>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {skinAnalysis.redness.level}%
                </p>
                <p className="text-xs text-slate-500 mt-2">{skinAnalysis.redness.description}</p>
              </div>
            </div>

            {shouldPromptCounterfeit(analysis) && (
              <div className="mt-6 rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/40 dark:border-red-900 p-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-red-900 dark:text-red-100 mb-1">
                      Did this barrier damage start after using a recent product?
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                      Your skin shows signs of chemical irritation. Reporting suspected counterfeit or harmful
                      products helps protect others in your community.
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
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Safety Flags
              </h3>
              <div className="space-y-3">
                {skinAnalysis.safetyFlags.map((flag) => (
                  <div
                    key={flag.id}
                    className={`rounded-lg p-4 border-l-4 ${
                      flag.severity === 'critical' ? 'bg-red-50 border-red-400' : 'bg-amber-50 border-amber-400'
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
            <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-100 mb-4 flex items-center gap-2">
              <Leaf className="w-5 h-5" />
              Barrier Repair Regimen (Local &amp; Safe)
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
        </TabContent>

        {/* ===== Tab 3: Harmonized Look ===== */}
        <TabContent value="look">
          <div className="mb-5">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <Palette className="w-5 h-5 text-amber-600" />
              Harmonized Look
            </h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{harmonizedLookLead(skinAnalysis)}</p>
          </div>

          {/* VTO result — palette colour and per-shade take priority over look-vto */}
          {(() => {
            const activeShade = activeShadeIdx !== null ? vto.recommendedLipShades[activeShadeIdx] : null;
            const shadeUrl = activeShade ? shadeVtoUrls[activeShade.hexColor] : undefined;
            const paletteUrl = paletteVtoHex ? shadeVtoUrls[paletteVtoHex] : undefined;
            const displayUrl = paletteUrl ?? shadeUrl ?? vto.tryOnImageUrl;
            const title = paletteUrl
              ? 'Palette Colour Try-On'
              : shadeUrl
                ? `Virtual Try-On — ${activeShade?.name}`
                : 'Live Virtual Try-On';
            return (
              <div className="mb-6">
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-3 flex items-center gap-2">
                  <WandSparkles className="w-4 h-4" />
                  {title}
                </p>
                {shadeVtoLoading ? (
                  <div className="flex items-center justify-center h-48 rounded-xl border-2 border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 text-amber-600 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        Applying {paletteVtoHex ?? activeShade?.name ?? 'shade'} via YouCam…
                      </p>
                    </div>
                  </div>
                ) : displayUrl ? (
                  <Image
                    src={displayUrl}
                    alt={
                      paletteUrl
                        ? 'Virtual try-on with palette colour'
                        : shadeUrl
                          ? `Virtual try-on with ${activeShade?.name}`
                          : 'Your virtual try-on result'
                    }
                    width={400}
                    height={500}
                    className="w-full max-w-sm rounded-xl border-2 border-amber-300 shadow-md"
                    sizes="(max-width: 640px) 100vw, 400px"
                    unoptimized
                    onError={(e) => {
                      (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : shouldUseRealApi() ? (
                  <p className="text-sm text-amber-700 dark:text-amber-400 italic">
                    Select a lip shade below to generate your virtual try-on.
                  </p>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                    Enable live API in Settings to see virtual try-on results.
                  </p>
                )}
              </div>
            );
          })()}

          {/* Lip shade selector with per-shade VTO trigger */}
          <div className="mb-7">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-3">
              Recommended Lip Shades
              {shouldUseRealApi() && (
                <span className="ml-2 text-xs font-normal text-amber-600 dark:text-amber-400">
                  — tap a shade to try it on
                </span>
              )}
            </p>
            {vto.recommendedLipShades.length > 0 ? (
              <div className="space-y-2">
                {vto.recommendedLipShades.map((shade, idx) => {
                  const isActive = activeShadeIdx === idx;
                  const hasResult = !!shadeVtoUrls[shade.hexColor];
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleShadeSelect(idx)}
                      aria-pressed={isActive}
                      className={`w-full flex items-center gap-4 p-3 rounded-lg border text-left transition-all ${
                        isActive
                          ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30 shadow-sm'
                          : 'border-amber-200 bg-white dark:bg-slate-800 hover:border-amber-300 hover:bg-amber-50/50'
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-lg border-2 border-white shadow-md flex-shrink-0"
                        style={{ backgroundColor: shade.hexColor }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 dark:text-slate-100">{shade.name}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{shade.description}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 px-2 py-1 rounded capitalize font-medium">
                          {shade.undertone}
                        </span>
                        {shouldUseRealApi() &&
                          (hasResult ? (
                            <span className="text-xs text-emerald-600 font-medium flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> done
                            </span>
                          ) : isActive && shadeVtoLoading ? (
                            <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                          ) : (
                            <WandSparkles className="w-4 h-4 text-amber-400" />
                          ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-amber-800">No shade recommendations were saved with this result.</p>
            )}
          </div>

          {/* Editable colour palette (offline, client-only state) */}
          <div className="mb-4">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1 flex items-center gap-1.5">
              <Pencil className="w-3.5 h-3.5" />
              Colour Palette
              <span className="text-xs font-normal text-amber-600 dark:text-amber-400">
                — click a swatch to edit
              </span>
            </p>
            {palette.primary ? (
              <div className="grid grid-cols-4 gap-3 mt-3">
                {(
                  [
                    { key: 'primary', label: 'Primary' },
                    { key: 'secondary', label: 'Secondary' },
                    { key: 'accent', label: 'Accent' },
                  ] as { key: 'primary' | 'secondary' | 'accent'; label: string }[]
                ).map(({ key, label }) => (
                  <EditableSwatch
                    key={key}
                    label={label}
                    color={palette[key]}
                    onChange={(hex) => setPalette((p) => ({ ...p, [key]: hex }))}
                    onApplyVTO={(hex) => {
                      setPaletteVtoHex(hex);
                      void handlePaletteVTO(hex);
                    }}
                  />
                ))}
                <div className="text-center">
                  <div className="w-16 h-16 rounded-lg shadow-md mx-auto mb-2 border-2 border-amber-300 flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800">
                    <span className="text-xs font-bold text-slate-500">✦</span>
                  </div>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{palette.inspiration}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-amber-800">No colour palette was saved with this result.</p>
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
