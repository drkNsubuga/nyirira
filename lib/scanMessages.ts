/**
 * Smart rotating scan messages for the ScanOverlay component.
 * Messages are grouped into phases based on overall scan progress (0-100).
 * Each phase has multiple messages that rotate to build credibility and
 * keep the user informed as the analysis progresses.
 */

export interface ScanPhase {
  /** Inclusive lower bound (0-100) */
  min: number;
  /** Exclusive upper bound (0-100) */
  max: number;
  /** Human-readable phase label shown above the message */
  label: string;
  /** Rotating messages for this phase */
  messages: string[];
}

export const SCAN_PHASES: ScanPhase[] = [
  {
    min: 0,
    max: 15,
    label: 'Preparing',
    messages: [
      'Securing your image locally...',
      'Preparing your photo for AI analysis...',
      'Initializing privacy-safe scan...',
    ],
  },
  {
    min: 15,
    max: 35,
    label: 'Face Detection',
    messages: [
      'Locating facial landmarks...',
      'Detecting skin boundaries & face contours...',
      'Mapping your unique features...',
    ],
  },
  {
    min: 35,
    max: 55,
    label: 'Skin Analysis',
    messages: [
      'Scanning melanin levels & undertones...',
      'Checking barrier health & hyperpigmentation...',
      'Evaluating skin texture & pore patterns...',
    ],
  },
  {
    min: 55,
    max: 80,
    label: 'Color Matching',
    messages: [
      'Matching Kitenge & lip shade palettes...',
      'Analyzing your warm, cool & neutral undertones...',
      'Curating shades that complement your melanin...',
    ],
  },
  {
    min: 80,
    max: 101,
    label: 'Finalizing',
    messages: [
      'Compiling your personalized skincare profile...',
      'Preparing safety-flag ingredient review...',
      'Almost there — building your results...',
    ],
  },
];

/** Rotation interval in milliseconds between messages within a phase. */
export const MESSAGE_ROTATION_MS = 2800;

/**
 * Return the scan phase for a given overall progress value (0-100).
 * Falls back to the last phase if progress exceeds all bounds.
 */
export function getPhaseForProgress(progress: number): ScanPhase {
  // Clamp below-range progress to the first phase.
  if (progress < SCAN_PHASES[0].min) return SCAN_PHASES[0];
  return (
    SCAN_PHASES.find((p) => progress >= p.min && progress < p.max) ??
    SCAN_PHASES[SCAN_PHASES.length - 1]
  );
}

/**
 * Return the index of the message to display for a phase, based on
 * elapsed time since the scan started.
 */
export function getMessageIndex(elapsedMs: number, messageCount: number): number {
  return Math.floor(elapsedMs / MESSAGE_ROTATION_MS) % messageCount;
}
