/**
 * Export utilities (SRS FR4.2 — result export/sharing)
 *
 * Renders an AnalysisResponse to a shareable PNG card entirely on the client
 * via canvas. No backend, no external dependencies.
 */

import { AnalysisResponse } from './types';

const WIDTH = 720;
const HEIGHT = 960;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Build a shareable results card as a canvas element. */
export function renderExportCanvas(analysis: AnalysisResponse): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const { skinAnalysis, vto } = analysis;

  // Background
  ctx.fillStyle = '#0f172a'; // slate-900
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Brand header
  ctx.fillStyle = '#10b981'; // emerald-500
  ctx.font = 'bold 40px Arial, sans-serif';
  ctx.fillText('Nyirira', 48, 80);

  ctx.fillStyle = '#94a3b8'; // slate-400
  ctx.font = '18px Arial, sans-serif';
  ctx.fillText('Safe skin insights for melanin-rich skin', 48, 110);

  // Health score block
  const scoreColor =
    skinAnalysis.healthScore >= 80
      ? '#10b981'
      : skinAnalysis.healthScore >= 60
        ? '#f59e0b'
        : '#f97316';

  ctx.fillStyle = '#1e293b'; // slate-800
  roundRect(ctx, 48, 150, WIDTH - 96, 150, 20);
  ctx.fill();

  ctx.fillStyle = scoreColor;
  ctx.font = 'bold 72px Arial, sans-serif';
  ctx.fillText(String(skinAnalysis.healthScore), 72, 250);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '18px Arial, sans-serif';
  ctx.fillText('Skin Health Score', 200, 235);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '16px Arial, sans-serif';
  ctx.fillText(`Spots: ${skinAnalysis.spots.count} (${skinAnalysis.spots.severity})`, 200, 262);
  ctx.fillText(`Redness: ${skinAnalysis.redness.level}%`, 200, 286);

  // Color palette swatches
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 22px Arial, sans-serif';
  ctx.fillText('Your Harmonized Look', 48, 360);

  const palette = [
    { label: 'Primary', hex: vto.outfitPalette.primary },
    { label: 'Secondary', hex: vto.outfitPalette.secondary },
    { label: 'Accent', hex: vto.outfitPalette.accent },
  ];

  let swatchX = 48;
  for (const swatch of palette) {
    ctx.fillStyle = swatch.hex;
    roundRect(ctx, swatchX, 380, 130, 130, 16);
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px Arial, sans-serif';
    ctx.fillText(swatch.label, swatchX, 535);
    swatchX += 150;
  }

  ctx.fillStyle = '#94a3b8';
  ctx.font = '16px Arial, sans-serif';
  ctx.fillText(vto.outfitPalette.inspiration, 48, 570);

  // Lip shades
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 22px Arial, sans-serif';
  ctx.fillText('Recommended Lip Shades', 48, 630);

  let shadeY = 660;
  for (const shade of vto.recommendedLipShades.slice(0, 3)) {
    ctx.fillStyle = shade.hexColor;
    roundRect(ctx, 48, shadeY, 44, 44, 10);
    ctx.fill();
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '16px Arial, sans-serif';
    ctx.fillText(shade.name, 108, shadeY + 30);
    shadeY += 60;
  }

  // Footer
  ctx.fillStyle = '#475569'; // slate-600
  ctx.font = '14px Arial, sans-serif';
  ctx.fillText(
    'Guidance only — always consult a dermatologist for medical concerns.',
    48,
    HEIGHT - 48
  );

  return canvas;
}

/** Trigger a PNG download of the results card. */
export function exportResultAsPng(analysis: AnalysisResponse): void {
  const canvas = renderExportCanvas(analysis);
  if (!canvas) return;

  const url = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = url;
  link.download = `nyirira-result-${analysis.skinAnalysis.healthScore}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
