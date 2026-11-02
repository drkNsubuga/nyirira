'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Info, X } from 'lucide-react';
import { AnalysisResponse } from '@/lib/types';

interface FaceMarker {
  id: string;
  label: string;
  type: 'pih_spot' | 'redness' | 'texture' | 'ochronosis' | 'barrier';
  /** Percentage position within the image */
  x: number;
  y: number;
  severity: 'mild' | 'moderate' | 'severe';
  detail: string;
}

interface ImageOverlayProps {
  analysis: AnalysisResponse;
  imageData: string;
  className?: string;
}

// Fixed anatomical zones on a front-facing portrait face (% of image width/height).
// Derived from standard facial thirds: forehead 20-35%, mid-face 35-65%, lower 65-85%.
const FACE_ZONES = {
  forehead_center:  { x: 50, y: 22 },
  forehead_left:    { x: 34, y: 25 },
  forehead_right:   { x: 66, y: 25 },
  left_cheek:       { x: 28, y: 55 },
  right_cheek:      { x: 72, y: 55 },
  left_cheek_high:  { x: 32, y: 47 },
  right_cheek_high: { x: 68, y: 47 },
  nose_bridge:      { x: 50, y: 40 },
  nose_tip:         { x: 50, y: 52 },
  left_nasolabial:  { x: 37, y: 60 },
  right_nasolabial: { x: 63, y: 60 },
  chin:             { x: 50, y: 76 },
  left_jaw:         { x: 34, y: 72 },
  right_jaw:        { x: 66, y: 72 },
  left_temple:      { x: 20, y: 35 },
  right_temple:     { x: 80, y: 35 },
  left_undereye:    { x: 36, y: 44 },
  right_undereye:   { x: 64, y: 44 },
};

const MARKER_STYLES: Record<FaceMarker['type'], { bg: string; ring: string; label: string }> = {
  pih_spot:  { bg: 'bg-amber-700',   ring: 'ring-amber-400',   label: 'PIH Spot'       },
  redness:   { bg: 'bg-red-500',     ring: 'ring-red-300',     label: 'Inflammation'   },
  texture:   { bg: 'bg-violet-500',  ring: 'ring-violet-300',  label: 'Texture'        },
  ochronosis:{ bg: 'bg-slate-800',   ring: 'ring-slate-400',   label: 'Ochronosis'     },
  barrier:   { bg: 'bg-orange-500',  ring: 'ring-orange-300',  label: 'Barrier Damage' },
};

const SIZE_BY_SEVERITY = { mild: 10, moderate: 14, severe: 18 };

function buildMarkers(analysis: AnalysisResponse): FaceMarker[] {
  const { skinAnalysis } = analysis;
  const markers: FaceMarker[] = [];
  const { spots, redness, texture, safetyFlags } = skinAnalysis;

  // PIH / Age spots — appear on cheeks, forehead, temples (most common sites for Fitzpatrick V-VI)
  if (spots.severity !== 'mild' || spots.count > 0) {
    const pihZones = [
      FACE_ZONES.left_cheek_high,
      FACE_ZONES.right_cheek_high,
      FACE_ZONES.forehead_left,
      FACE_ZONES.forehead_right,
      FACE_ZONES.left_temple,
      FACE_ZONES.right_temple,
    ];
    const count = spots.severity === 'severe' ? 4 : spots.severity === 'moderate' ? 3 : 2;
    for (let i = 0; i < count && i < pihZones.length; i++) {
      markers.push({
        id: `pih-${i}`,
        label: `PIH Spot ${i + 1}`,
        type: 'pih_spot',
        x: pihZones[i].x,
        y: pihZones[i].y,
        severity: spots.severity,
        detail: `Post-inflammatory hyperpigmentation detected — ${spots.description || spots.severity + ' severity'}`,
      });
    }
  }

  // Redness / Inflammation — nasolabial folds, cheeks, nose (classic rosacea/irritation zones)
  if (redness.level >= 20) {
    const rednessZones = redness.level >= 50
      ? [FACE_ZONES.left_cheek, FACE_ZONES.right_cheek, FACE_ZONES.nose_tip, FACE_ZONES.left_nasolabial]
      : redness.level >= 35
      ? [FACE_ZONES.left_cheek, FACE_ZONES.right_cheek, FACE_ZONES.nose_bridge]
      : [FACE_ZONES.nose_bridge, FACE_ZONES.left_nasolabial];

    rednessZones.forEach((zone, i) => {
      markers.push({
        id: `redness-${i}`,
        label: `Inflammation Zone`,
        type: 'redness',
        x: zone.x,
        y: zone.y,
        severity: redness.level >= 60 ? 'severe' : redness.level >= 35 ? 'moderate' : 'mild',
        detail: redness.description || `Redness level ${redness.level}% — inflammatory response detected`,
      });
    });
  }

  // Texture irregularity — forehead, nose, chin (T-zone typical)
  if (texture.roughness >= 30) {
    const textureZones = texture.roughness >= 60
      ? [FACE_ZONES.forehead_center, FACE_ZONES.nose_tip, FACE_ZONES.chin]
      : [FACE_ZONES.forehead_center, FACE_ZONES.nose_tip];

    textureZones.forEach((zone, i) => {
      markers.push({
        id: `texture-${i}`,
        label: 'Texture Irregularity',
        type: 'texture',
        x: zone.x,
        y: zone.y,
        severity: texture.roughness >= 60 ? 'severe' : texture.roughness >= 40 ? 'moderate' : 'mild',
        detail: `Roughness ${texture.roughness}%, smoothness ${texture.smoothness}% — ${texture.description || 'uneven skin texture detected'}`,
      });
    });
  }

  // Ochronosis / Critical barrier damage — jaw and chin area (common ochronosis site)
  const hasCritical = safetyFlags.some((f) => f.severity === 'critical' && f.id !== 'toxic-bleaching' && f.id !== 'equatorial-uv');
  if (hasCritical && skinAnalysis.healthScore < 60) {
    [FACE_ZONES.left_jaw, FACE_ZONES.right_jaw, FACE_ZONES.chin].forEach((zone, i) => {
      markers.push({
        id: `barrier-${i}`,
        label: 'Barrier Damage',
        type: 'barrier',
        x: zone.x,
        y: zone.y,
        severity: skinAnalysis.healthScore < 50 ? 'severe' : 'moderate',
        detail: 'Epidermal barrier compromise detected — skin may be thin, reactive, or show rebound darkening',
      });
    });
  }

  return markers;
}

export default function ImageOverlay({ analysis, imageData, className = '' }: ImageOverlayProps) {
  const [selected, setSelected] = useState<FaceMarker | null>(null);
  const markers = buildMarkers(analysis);

  const toggle = (marker: FaceMarker) =>
    setSelected((prev) => (prev?.id === marker.id ? null : marker));

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Image with markers */}
      <div className="relative overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
        <Image
          src={imageData}
          alt="Skin analysis photo"
          width={600}
          height={750}
          className="block h-auto w-full object-cover rounded-xl"
          sizes="(max-width: 640px) 100vw, 600px"
          unoptimized
        />

        {/* Anatomical markers */}
        {markers.map((marker) => {
          const style = MARKER_STYLES[marker.type];
          const size = SIZE_BY_SEVERITY[marker.severity];
          const isSelected = selected?.id === marker.id;
          return (
            <button
              key={marker.id}
              type="button"
              aria-label={`${marker.label} — ${marker.severity}`}
              onClick={() => toggle(marker)}
              className={`absolute rounded-full transition-all duration-150 ${style.bg} ring-2 ${style.ring} opacity-80 hover:opacity-100 hover:scale-125 focus:outline-none ${isSelected ? 'scale-125 ring-4 opacity-100' : ''}`}
              style={{
                left: `${marker.x}%`,
                top: `${marker.y}%`,
                width: `${size}px`,
                height: `${size}px`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* Pulse animation on severe markers */}
              {marker.severity === 'severe' && (
                <span
                  className={`absolute inset-0 rounded-full ${style.bg} animate-ping opacity-50`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected marker detail */}
      {selected && (
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 shadow-sm">
          <div
            className={`mt-0.5 w-3 h-3 rounded-full flex-shrink-0 ${MARKER_STYLES[selected.type].bg}`}
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{selected.label}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{selected.detail}</p>
            <p className="text-xs font-medium mt-1 capitalize">
              Severity:{' '}
              <span
                className={
                  selected.severity === 'severe'
                    ? 'text-red-600'
                    : selected.severity === 'moderate'
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }
              >
                {selected.severity}
              </span>
            </p>
          </div>
          <button
            type="button"
            aria-label="Close detail"
            onClick={() => setSelected(null)}
            className="text-slate-400 hover:text-slate-600 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Legend */}
      {markers.length > 0 && (
        <div className="flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-400">
          {(Object.keys(MARKER_STYLES) as FaceMarker['type'][])
            .filter((type) => markers.some((m) => m.type === type))
            .map((type) => (
              <span key={type} className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded-full flex-shrink-0 ${MARKER_STYLES[type].bg}`} />
                {MARKER_STYLES[type].label}
              </span>
            ))}
          <span className="flex items-center gap-1 ml-auto">
            <Info className="w-3 h-3" />
            Tap marker for detail
          </span>
        </div>
      )}

      {markers.length === 0 && (
        <p className="text-xs text-emerald-600 font-medium">No significant skin concerns detected in this scan.</p>
      )}
    </div>
  );
}
