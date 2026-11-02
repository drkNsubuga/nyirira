'use client';

import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  EyeOff,
  Calendar,
  Activity,
  Droplets,
  ScanLine,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { AnalysisResponse } from '@/lib/types';
import Image from 'next/image';
import { AnalysisHistoryItem } from '@/lib/storage';

interface HistoryCompareProps {
  current: AnalysisResponse;
  history: AnalysisHistoryItem[];
  currentImageData: string;
}

function MetricBar({
  label,
  icon: Icon,
  prev,
  curr,
  unit = '%',
  higherIsBetter = true,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  prev: number;
  curr: number;
  unit?: string;
  higherIsBetter?: boolean;
}) {
  const delta = curr - prev;
  const improved = higherIsBetter ? delta > 0 : delta < 0;
  const worsened = higherIsBetter ? delta < 0 : delta > 0;
  const max = Math.max(prev, curr, 100);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 font-medium">
          <Icon className="w-3 h-3" />
          {label}
        </span>
        <span
          className={`flex items-center gap-0.5 font-semibold ${
            improved ? 'text-emerald-600' : worsened ? 'text-red-500' : 'text-slate-500'
          }`}
        >
          {delta > 0 ? <ArrowUp className="w-3 h-3" /> : delta < 0 ? <ArrowDown className="w-3 h-3" /> : null}
          {delta !== 0 ? `${Math.abs(delta)}${unit}` : `—`}
        </span>
      </div>

      {/* Stacked progress bars */}
      <div className="relative h-4 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        {/* Previous (ghost) */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-slate-300 dark:bg-slate-600 opacity-60 transition-all duration-500"
          style={{ width: `${(prev / max) * 100}%` }}
        />
        {/* Current */}
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
            improved ? 'bg-emerald-500' : worsened ? 'bg-red-400' : 'bg-slate-400'
          }`}
          style={{ width: `${(curr / max) * 100}%` }}
        />
        {/* Labels */}
        <div className="absolute inset-0 flex items-center justify-between px-2 text-[10px] font-bold text-white mix-blend-difference">
          <span>{prev}{unit}</span>
          <span>{curr}{unit}</span>
        </div>
      </div>
    </div>
  );
}

function ScoreRing({ score, prev, size = 80 }: { score: number; prev: number; size?: number }) {
  const delta = score - prev;
  const r = (size / 2) * 0.8;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 85 ? '#10b981' : score >= 70 ? '#f59e0b' : score >= 50 ? '#f97316' : '#ef4444';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth="6" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={`${fill} ${circ - fill}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-xl font-bold" style={{ color }}>{score}</div>
        <div className="text-[9px] text-slate-500 dark:text-slate-400">/ 100</div>
      </div>
      {delta !== 0 && (
        <div
          className={`absolute -bottom-1 -right-1 flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white ${
            delta > 0 ? 'bg-emerald-500' : 'bg-red-500'
          }`}
        >
          {delta > 0 ? <ArrowUp className="w-2 h-2" /> : <ArrowDown className="w-2 h-2" />}
          {Math.abs(delta)}
        </div>
      )}
    </div>
  );
}

function formatDate(ts: string) {
  const d = new Date(ts);
  return (
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
}

export default function HistoryCompare({ current, history, currentImageData }: HistoryCompareProps) {
  const [open, setOpen] = useState(false);

  const prevItem = history.find((item) => item.analysis.timestamp !== current.timestamp) ?? history[1];
  if (!prevItem) return null;

  const prev = prevItem.analysis;
  const cs = current.skinAnalysis;
  const ps = prev.skinAnalysis;
  const delta = cs.healthScore - ps.healthScore;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      {/* Summary bar — always visible */}
      <div className="flex items-center justify-between px-4 py-3 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {delta > 0 ? (
            <TrendingUp className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : delta < 0 ? (
            <TrendingDown className="w-5 h-5 text-red-500 flex-shrink-0" />
          ) : (
            <Minus className="w-5 h-5 text-slate-400 flex-shrink-0" />
          )}
          <p className="text-sm text-slate-700 dark:text-slate-300 truncate">
            {delta === 0 ? (
              <span className="font-medium">No change</span>
            ) : (
              <>
                <span className={`font-bold ${delta > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {delta > 0 ? '+' : ''}{delta} pts
                </span>{' '}
                vs previous ({ps.healthScore}/100 → {cs.healthScore}/100)
              </>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 flex-shrink-0"
        >
          {open ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {open ? 'Hide' : 'Show Comparison'}
        </button>
      </div>

      {/* Expanded comparison */}
      {open && (
        <div className="border-t border-slate-100 dark:border-slate-800 px-4 pb-5 pt-4 space-y-5">
          {/* Side-by-side photos + score rings */}
          <div className="grid grid-cols-2 gap-3">
            {/* Previous */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Calendar className="w-3 h-3" />
                {formatDate(prev.timestamp)}
              </div>
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                {prevItem.imageData ? (
                  <Image
                    src={prevItem.imageData}
                    alt="Previous scan"
                    fill
                    className="object-cover"
                    sizes="200px"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs">No image</div>
                )}
                <div className="absolute bottom-2 right-2">
                  <ScoreRing score={ps.healthScore} prev={ps.healthScore} size={56} />
                </div>
              </div>
              <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 font-medium">Previous</p>
            </div>

            {/* Current */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                {formatDate(current.timestamp)}
              </div>
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-emerald-50 dark:bg-slate-800 ring-2 ring-emerald-300 dark:ring-emerald-700">
                <Image
                  src={currentImageData}
                  alt="Current scan"
                  fill
                  className="object-cover"
                  sizes="200px"
                  unoptimized
                />
                <div className="absolute bottom-2 right-2">
                  <ScoreRing score={cs.healthScore} prev={ps.healthScore} size={56} />
                </div>
              </div>
              <p className="text-[11px] text-center text-emerald-600 font-semibold">Current</p>
            </div>
          </div>

          {/* Metric bars */}
          <div className="space-y-3 pt-1">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Metric Changes
            </p>
            <MetricBar
              label="Redness"
              icon={Droplets}
              prev={ps.redness.level}
              curr={cs.redness.level}
              unit="%"
              higherIsBetter={false}
            />
            <MetricBar
              label="Smoothness"
              icon={ScanLine}
              prev={ps.texture.smoothness}
              curr={cs.texture.smoothness}
              unit="%"
              higherIsBetter={true}
            />
            <MetricBar
              label="Roughness"
              icon={Activity}
              prev={ps.texture.roughness}
              curr={cs.texture.roughness}
              unit="%"
              higherIsBetter={false}
            />
          </div>

          {/* Spots summary */}
          <div className="flex gap-3 text-xs">
            {[
              { label: 'Spots', prev: ps.spots.severity, curr: cs.spots.severity },
            ].map(({ label, prev: pv, curr: cv }) => (
              <div
                key={label}
                className="flex-1 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-center"
              >
                <p className="text-slate-500 dark:text-slate-400 mb-1">{label}</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{pv} → {cv}</p>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
            Grey bar = previous · Coloured bar = current
          </p>
        </div>
      )}
    </div>
  );
}
