'use client';

import { useEffect, useRef, useState } from 'react';
import { ScanFace } from 'lucide-react';
import {
  ScanPhase,
  getPhaseForProgress,
  getMessageIndex,
  MESSAGE_ROTATION_MS,
} from '@/lib/scanMessages';

interface ScanOverlayProps {
  /** Base64 data URI (or URL) of the user's captured photo. */
  imageData: string;
  /** Overall scan progress (0-100). */
  progress: number;
}

/**
 * Normalized (0-1) facial landmark positions for a front-facing portrait.
 * The overlay stretches to the photo via preserveAspectRatio="none", so the
 * mesh reads as a stylized face mask regardless of the photo's aspect ratio.
 */
const MESH_POINTS: ReadonlyArray<readonly [number, number]> = [
  // Forehead
  [0.5, 0.08],
  [0.35, 0.1],
  [0.65, 0.1],
  [0.22, 0.16],
  [0.78, 0.16],
  // Eyebrows
  [0.3, 0.24],
  [0.4, 0.22],
  [0.6, 0.22],
  [0.7, 0.24],
  // Eyes
  [0.35, 0.28],
  [0.42, 0.28],
  [0.58, 0.28],
  [0.65, 0.28],
  // Nose bridge
  [0.5, 0.32],
  [0.5, 0.38],
  [0.5, 0.44],
  // Nose
  [0.44, 0.48],
  [0.5, 0.5],
  [0.56, 0.48],
  // Cheeks
  [0.28, 0.38],
  [0.72, 0.38],
  [0.25, 0.48],
  [0.75, 0.48],
  [0.3, 0.55],
  [0.7, 0.55],
  // Mouth
  [0.38, 0.58],
  [0.44, 0.56],
  [0.5, 0.55],
  [0.56, 0.56],
  [0.62, 0.58],
  [0.5, 0.62],
  // Jaw
  [0.32, 0.65],
  [0.68, 0.65],
  [0.36, 0.72],
  [0.64, 0.72],
  [0.42, 0.78],
  [0.58, 0.78],
  [0.5, 0.82],
  // Chin
  [0.5, 0.88],
];

/** Index pairs connecting mesh landmarks (edges drawn between points). */
const MESH_EDGES: ReadonlyArray<readonly [number, number]> = [
  // Forehead arc
  [0, 1], [1, 2], [2, 0],
  [1, 3], [2, 4],
  // Brow line
  [3, 5], [5, 6], [6, 7], [7, 8], [8, 4],
  // Eyes
  [5, 9], [9, 10], [6, 10],
  [7, 11], [11, 12], [8, 12],
  // Nose bridge
  [10, 13], [13, 14], [14, 15],
  // Nose
  [15, 16], [16, 17], [17, 15],
  // Cheeks
  [9, 18], [18, 20], [20, 22],
  [12, 19], [19, 21], [21, 23],
  [16, 20], [16, 21],
  // Mouth
  [22, 24], [24, 25], [25, 26], [26, 27], [27, 28], [28, 22],
  [26, 29], [29, 24],
  // Jaw
  [20, 30], [30, 32], [32, 34], [34, 36], [36, 29],
  [21, 31], [31, 33], [33, 35], [35, 37], [37, 29],
  [23, 31],
  // Chin
  [36, 38], [37, 38],
];

export default function ScanOverlay({ imageData, progress }: ScanOverlayProps) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(0);
  const beamRef = useRef<SVGRectElement>(null);
  const glowRef = useRef<SVGRectElement>(null);
  const nodeRefs = useRef<Array<SVGCircleElement | null>>([]);

  // Message rotation — only the text changes, so a slow interval suffices.
  useEffect(() => {
    startRef.current = Date.now();
    const interval = setInterval(() => {
      setElapsed(Date.now() - startRef.current);
    }, MESSAGE_ROTATION_MS);
    return () => clearInterval(interval);
  }, []);

  // Silky 60fps beam sweep — cosine ping-pong (zero velocity at the ends, so
  // the beam never snaps at the reversal points). The position is written
  // imperatively via requestAnimationFrame instead of React state so each
  // frame costs no re-render. Nodes within a soft band around the beam get a
  // CSS "hot" class whose transition ramps the glow in and out smoothly.
  useEffect(() => {
    const CYCLE_MS = 3000;
    const HOT_BAND = 0.06;
    const start = performance.now();
    let raf = 0;
    let fallbackTimer: ReturnType<typeof setInterval> | null = null;

    const tick = (now: number) => {
      const t = ((now - start) % CYCLE_MS) / CYCLE_MS;
      const beamY = 0.5 - 0.5 * Math.cos(t * Math.PI * 2);

      beamRef.current?.style.setProperty('transform', `translateY(${beamY}px)`);
      glowRef.current?.style.setProperty('transform', `translateY(${beamY}px)`);

      for (let i = 0; i < MESH_POINTS.length; i++) {
        const el = nodeRefs.current[i];
        if (!el) continue;
        el.classList.toggle(
          'scan-node-hot',
          Math.abs(MESH_POINTS[i][1] - beamY) < HOT_BAND,
        );
      }
    };

    if (typeof requestAnimationFrame === 'function') {
      const loop = (now: number) => {
        tick(now);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    } else {
      // Safety net for environments without rAF (e.g. old jsdom configs).
      fallbackTimer = setInterval(() => tick(performance.now()), 16);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (fallbackTimer) clearInterval(fallbackTimer);
    };
  }, []);

  const phase: ScanPhase = getPhaseForProgress(progress);
  const msgIdx = getMessageIndex(elapsed, phase.messages.length);
  const currentMessage = phase.messages[msgIdx];

  const progressNorm = Math.min(Math.max(progress / 100, 0), 1);

  // Mesh reveal: landmarks above the current progress threshold are visible,
  // with a small lead so edges light up just before the beam reaches them.
  const revealThreshold = progressNorm + 0.08;

  return (
    <div
      className="relative w-full max-w-md mx-auto aspect-[3/4] rounded-2xl overflow-hidden bg-slate-900 shadow-2xl"
      data-testid="scan-overlay"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageData}
        alt="Your photo being analyzed"
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Glowing facial mesh + scanning beam */}
      <svg
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="beamGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(16,185,129,0)" />
            <stop offset="50%" stopColor="#34d399" />
            <stop offset="100%" stopColor="rgba(16,185,129,0)" />
          </linearGradient>
        </defs>

        {/* Mesh edges */}
        <g stroke="rgba(16,185,129,0.7)" strokeWidth="0.002" fill="none">
          {MESH_EDGES.map(([a, b], i) => {
            const [ax, ay] = MESH_POINTS[a];
            const [bx, by] = MESH_POINTS[b];
            const visible = Math.max(ay, by) <= revealThreshold;
            return (
              <line
                key={`e${i}`}
                x1={ax} y1={ay} x2={bx} y2={by}
                className="transition-opacity duration-700"
                style={{ opacity: visible ? 1 : 0 }}
              />
            );
          })}
        </g>

        {/* Mesh nodes — base + beam-highlighted styling lives in CSS
            (.scan-node / .scan-node-hot) so the glow ramps via transitions;
            the rAF loop toggles the hot class as the beam passes. */}
        <g>
          {MESH_POINTS.map(([x, y], i) => {
            const visible = y <= revealThreshold;
            return (
              <circle
                key={`n${i}`}
                ref={(el) => {
                  nodeRefs.current[i] = el;
                }}
                className="scan-node"
                cx={x} cy={y}
                r={0.005}
                style={{ opacity: visible ? 1 : 0 }}
              />
            );
          })}
        </g>

        {/* Scanning beam + afterglow trail — y is driven imperatively by the
            rAF loop above (CSS transform, 60fps); base position is the top. */}
        <rect
          ref={beamRef}
          x="0" y={-0.004} width="1" height="0.008"
          fill="url(#beamGradient)"
          style={{
            filter: 'drop-shadow(0 0 6px rgba(16,185,129,0.8))',
            willChange: 'transform',
          }}
        />
        <rect
          ref={glowRef}
          x="0" y={-0.03} width="1" height="0.06"
          fill="url(#beamGradient)" opacity="0.25"
          style={{ willChange: 'transform' }}
        />
      </svg>

      {/* Corner viewfinder brackets */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-emerald-400/80 rounded-tl-lg" />
        <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-emerald-400/80 rounded-tr-lg" />
        <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-emerald-400/80 rounded-bl-lg" />
        <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-emerald-400/80 rounded-br-lg" />
      </div>

      {/* Bottom overlay: phase label, rotating micro-copy, progress bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-5 pb-5 pt-12">
        <div className="flex items-center gap-2 mb-2">
          <ScanFace className="w-4 h-4 text-emerald-400" />
          <span
            className="text-xs font-semibold uppercase tracking-wider text-emerald-400"
            data-testid="scan-phase"
          >
            {phase.label}
          </span>
        </div>

        {/* Rotating micro-copy with fade transition — the key remounts the
            node so the CSS animation replays on every message change */}
        <p
          key={currentMessage}
          className="text-sm text-white/90 mb-3 min-h-[2.5rem] animate-fade-in"
          data-testid="scan-message"
        >
          {currentMessage}
        </p>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.round(progressNorm * 100)}%` }}
              data-testid="scan-progress-fill"
            />
          </div>
          <span
            className="text-xs font-medium text-emerald-300 tabular-nums w-10 text-right"
            data-testid="scan-progress-label"
          >
            {Math.round(progressNorm * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}

