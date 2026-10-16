"use client";

import Link from 'next/link';
import { useState } from 'react';
import { AlertCircle, Camera, Clock3, Download, Loader2, RotateCcw, Share2, Settings, Sparkles, Trash2, X, HelpCircle } from 'lucide-react';
import CameraCapture from '@/components/CameraCapture';
import AnalysisDashboard from '@/components/AnalysisDashboard';
import ScanOverlay from '@/components/ScanOverlay';
import HistoryCompare from '@/components/HistoryCompare';
import Toast, { ToastMessage } from '@/components/Toast';
import { AppState, AnalysisResponse } from '@/lib/types';
import {
  HISTORY_KEY,
  SETTINGS_KEY,
  addAnalysisToHistory,
  clearAnalysisHistory,
  removeAnalysisFromHistory,
  parseHistory,
  parseSettings,
  saveAnalysis,
} from '@/lib/storage';
import { useLocalStorageValue } from '@/lib/useLocalStorage';
import { analyzeImage } from '@/lib/youcamClient';
import { compressImage } from '@/lib/image';
import { validateImageResolution } from '@/lib/imageValidation';
import { runFullImageValidation } from '@/lib/advancedValidation';
import { exportResultAsPng } from '@/lib/export';

const defaultState: AppState = {
  step: 'capture',
  imageData: null,
  analysis: null,
  error: null,
  errorList: null,
  isLoading: false,
  validationProgress: 0,
  validationMessage: '',
  scanProgress: 0,
};

/**
 * Map raw YouCam API error codes to user-friendly guidance.
 * See https://docs.perfectcorp.com (error codes).
 * All error handling is done offline for reliability.
 */

interface YouCamErrorPayload {
  error?: string;
  error_message?: string;
  data?: { error?: string; error_message?: string };
}

/**
 * Extract a JSON error payload from a message that mixes text + JSON.
 * Handles NESTED payloads like:
 *   Task failed: {"status":200,"data":{"error":"error_src_face_too_small",...}}
 * by slicing from the first "{" to the last "}" (the regex approach breaks on
 * the first inner "}") and unwrapping the "data" envelope the API wraps task
 * errors in.
 */
function parseYouCamErrorPayload(message: string): YouCamErrorPayload | null {
  const start = message.indexOf('{');
  const end = message.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(message.slice(start, end + 1)) as YouCamErrorPayload;
    // Task errors nest under {status, data:{error, error_message}}; file-init
    // style errors are flat. Unify both shapes.
    return parsed.data ?? parsed;
  } catch {
    return null;
  }
}

/**
 * Match an error code anywhere in the message (handles the digits in codes
 * like error_40001 that the old [a-z_] pattern missed).
 */
function extractErrorCode(message: string): string | undefined {
  return message.match(/error_[a-z0-9_]+/i)?.[0]?.toLowerCase();
}

function friendlyApiError(message: string): string {
  const payload = parseYouCamErrorPayload(message);
  // Prefer the structured code; fall back to a code found in the raw text.
  const errorCode = payload?.error ?? extractErrorCode(message);

  // Network / connectivity failures: only reachable on the results step (the
  // live API fetch). Report a friendly, actionable message instead of the raw
  // browser "NetworkError when attempting to fetch resource."
  const normalized = message.toLowerCase();
  if (
    normalized.includes('networkerror') ||
    normalized.includes('failed to fetch') ||
    normalized.includes('network request failed') ||
    normalized.includes('load failed') ||
    normalized.includes('err_internet_disconnected') ||
    normalized.includes('the internet connection appears to be offline')
  ) {
    return 'You appear to be offline. Check your internet connection and try again.';
  }
  if (normalized.includes('timeout') || normalized.includes('timed out') || normalized.includes('aborted')) {
    return 'The analysis took too long and timed out. Please try again with a different photo.';
  }
  // Misconfigured deployment (common on static hosts like Cloudflare Pages):
  // live mode is on but the NEXT_PUBLIC_* credentials were not in the build.
  if (normalized.includes('credentials missing')) {
    return 'Live analysis is not configured for this deployment: the app is in live mode, but its API keys were not available when this build was made. Set NEXT_PUBLIC_YOUCAM_API_KEY and NEXT_PUBLIC_YOUCAM_API_URL, then redeploy.';
  }

  const messages: Record<string, string> = {
    // Face position and orientation errors
    error_large_face_angle:
      'Your face is turned or tilted too far. Look straight at the camera and keep your head upright.',
    error_face_angle_invalid:
      'Keep your head straight — front-facing photos need your head within about 10°.',
    error_face_position_invalid:
      'Make sure your entire face is fully visible in the frame.',
    error_face_position_too_small:
      'Your face is too small. Move closer to the camera.',
    error_face_position_out_of_boundary:
      'Your face is too large or partly outside the frame. Adjust your position and retake.',
    error_multiple_faces:
      'Multiple faces detected. Ensure only one person is in the frame and try again.',

    // Real YouCam task-error codes (task errors nest under data.error).
    // The src_ prefix is the input image on skin analysis; dst_ appears on
    // VTO tasks. Face-too-small means the face is under ~60% of image width.
    error_below_min_image_size:
      'The image is too low-resolution. Move closer to the camera or upload a larger photo.',
    error_image_too_small:
      'The image dimensions are too small. Move closer to the camera or upload a larger photo.',
    error_src_face_too_small:
      'Move closer to the camera — your face should fill most of the photo (at least 60% of the width).',
    error_dst_face_too_small:
      'Move closer to the camera — your face should fill most of the photo (at least 60% of the width).',
    error_face_too_small:
      'Move closer to the camera — your face should fill most of the photo (at least 60% of the width).',
    error_src_face_angle_invalid:
      'Keep your head straight and face the camera directly.',
    error_dst_face_angle_invalid:
      'Keep your head straight and face the camera directly.',
    error_src_face_position_invalid:
      'Make sure your entire face is fully visible in the frame.',
    error_dst_face_position_invalid:
      'Make sure your entire face is fully visible in the frame.',
    error_src_face_out_of_boundary:
      'Your face is partly outside the frame. Move back slightly so your whole face shows.',
    error_dst_face_out_of_boundary:
      'Your face is partly outside the frame. Move back slightly so your whole face shows.',
    error_src_face_not_detected:
      'No face was detected. Use a clear, front-facing photo of your face.',
    error_dst_face_not_detected:
      'No face was detected. Use a clear, front-facing photo of your face.',
    error_face_not_detected:
      'No face was detected. Use a clear, front-facing photo of your face.',
    
    // Image quality and size errors
    error_invalid_image_format:
      'Invalid image format. Please upload a JPG or PNG image.',
    error_corrupted_image:
      'The image appears to be corrupted or damaged. Please try another photo.',
    
    // Lighting and quality errors
    error_poor_lighting:
      'Poor lighting detected. Ensure you\'re in a well-lit area and face the light source.',
    error_excessive_brightness:
      'The image is too bright. Move away from bright lights and try again.',
    error_excessive_darkness:
      'The image is too dark. Ensure proper lighting and try again.',
    error_blurry_image:
      'The image is blurry. Hold your camera steady and take a clear photo.',
    error_low_contrast:
      'Low contrast detected. Ensure good lighting and clear focus.',
    
    // Privacy and content errors
    error_sensitive_content_detected:
      'Sensitive content detected. Please ensure the image contains only your face.',
    error_inappropriate_content:
      'Inappropriate content detected. Please upload a suitable photo.',
    error_person_not_visible:
      'No person detected in the image. Please include a person in the frame.',
    
    // API and technical errors
    error_api_timeout:
      'The analysis took too long. Please try again with a different image.',
    error_api_internal_error:
      'A server error occurred. Please try again later.',
    error_api_rate_limit:
      'Too many requests. Please wait a moment and try again.',
    error_api_unauthorized:
      'Authentication error. Please check your API configuration.',
    error_api_forbidden:
      'Access denied. Please check your API permissions.',
    error_api_not_found:
      'Service not available. Please try again later.',
    
    // Default fallbacks
    error_unknown_error:
      'Unable to analyze the image. Please try a different photo.',
    error_default:
      'The selected image cannot be analyzed. Please try another photo.',
  };

  // Return specific error message if we have a matching code
  if (errorCode && messages[errorCode]) {
    return messages[errorCode];
  }

  // Pattern-match against the API's plain-English error_message (falling back
  // to the raw text) so unmapped codes still produce friendly guidance.
  // NOTE: face-specific checks run before generic size checks.
  const detail = (payload?.error_message ?? message).toLowerCase();
  if (detail.includes('too small') && detail.includes('face')) {
    return 'Move closer to the camera — your face should fill most of the photo (at least 60% of the width).';
  }
  if (detail.includes('too small') || detail.includes('resolution')) {
    return 'The image is too low-resolution. Move closer to the camera or upload a larger photo.';
  }
  if (detail.includes('too large')) {
    return 'The image is too large. Upload a smaller photo.';
  }
  if (
    detail.includes('face') &&
    (detail.includes('angle') || detail.includes('tilt') || detail.includes('turned'))
  ) {
    return 'Your face is turned or tilted too far. Look straight at the camera and keep your head upright.';
  }
  if (detail.includes('multiple face') || detail.includes('more than one face')) {
    return 'Multiple faces detected. Ensure only one person is in the frame and try again.';
  }
  if (detail.includes('no face') || detail.includes('face not detect')) {
    return 'No face was detected. Use a clear, front-facing photo of your face.';
  }
  if (detail.includes('blur')) {
    return 'The image is blurry. Hold your camera steady and take a clear photo.';
  }
  if (detail.includes('light')) {
    return 'Poor lighting detected. Ensure you\'re in a well-lit area and face the light source.';
  }
  if (detail.includes('position') || detail.includes('boundary')) {
    return 'Make sure your entire face is fully visible in the frame.';
  }
  if (detail.includes('blur')) {
    return 'The image is blurry. Hold your camera steady and take a clear photo.';
  }
  if (detail.includes('light')) {
    return 'Poor lighting detected. Ensure you\'re in a well-lit area and face the light source.';
  }

  // Unmapped code with a human-readable API message: use it verbatim — it is
  // still far friendlier than raw JSON.
  if (payload?.error_message) {
    return payload.error_message;
  }

  // Never leak raw JSON to the user.
  if (message.trim().startsWith('{') || message.includes('{"')) {
    return 'Unable to analyze the image. Please try a different photo.';
  }
  // Fallback to original message or generic error
  return message || 'Unable to analyze the image. Please try a different photo.';
}

export default function Home() {
  // localStorage is read via useSyncExternalStore (see lib/useLocalStorage):
  // getServerSnapshot returns null during SSR and hydration, so the
  // server-rendered markup always matches the client's hydration render —
  // no hydration mismatch — and React re-renders with the stored values right
  // after hydration without a manual setState-in-effect.
  const history = parseHistory(useLocalStorageValue(HISTORY_KEY));
  const settings = parseSettings(useLocalStorageValue(SETTINGS_KEY));

  // Interactive state (capture/processing/results) stays in useState.
  // No restore-on-reload: a page refresh always lands on the original capture
  // screen (the latest run is still reachable via Recent History below it).
  const [state, setState] = useState<AppState>(defaultState);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  
  // Destructure validation state for easier access
  const { validationProgress, validationMessage } = state;
  
  // Validation setters
  const setValidationProgress = (progress: number) => {
    setState(prev => ({ ...prev, validationProgress: progress }));
  };

  // Latest analysis only from the live flow — never from localStorage, so
  // reloading the page shows the capture screen instead of old results.
  const analysis = state.analysis;
  const viewStep: AppState['step'] =
    state.step === 'capture' && analysis ? 'results' : state.step;

  const showToast = (variant: ToastMessage['variant'], text: string) => {
    setToast({ id: Date.now(), variant, text });
  };

  const handleShare = async () => {
    if (!analysis || !settings.enableSocialSharing) return;

    const shareText = `My Nyirira skin score is ${analysis.skinAnalysis.healthScore}/100. Safe skincare starts with hydration, barrier repair, and sun protection.`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Nyirira Results',
          text: shareText,
          url: window.location.href,
        });
        return;
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        showToast('success', 'Results copied to clipboard');
      }
    } catch {
      showToast('info', 'Sharing was cancelled');
    }
  };

  const handleExport = () => {
    if (!analysis) return;
    exportResultAsPng(analysis);
    showToast('success', 'Results image downloaded');
  };

  // Guard against empty/incomplete results so the dashboard never renders blank.
  // A response is "complete" when it has essential skin analysis data and either
  // VTO data or reasonable fallbacks for the dashboard.
  const hasCompleteAnalysis = (result: AnalysisResponse | null): result is AnalysisResponse => {
    if (!result) return false;
    const skin = result.skinAnalysis;
    const vto = result.vto;
    
    // Essential skin analysis data must be present
    const hasEssentialSkinData = skin && 
      typeof skin.healthScore === 'number' && 
      Number.isFinite(skin.healthScore) &&
      // A live response that mapped to 0 means every score was missing/unreadable
      // (e.g. another API shape drift) — treat it as "no usable results" instead
      // of rendering a dashboard full of zeros.
      skin.healthScore > 0 &&
      skin.spots && 
      skin.texture && 
      skin.redness &&
      Array.isArray(skin.safetyFlags) &&
      Array.isArray(skin.barrierRepairRegimen);
    
    // VTO data should be present, but we can be more flexible
    const hasVTOData = vto && vto.outfitPalette;
    
    // For recommended lip shades, we prefer non-empty but can work with empty
    // as long as we have other VTO data like outfit palette
    const hasLipShades = vto && Array.isArray(vto.recommendedLipShades);
    
    return Boolean(hasEssentialSkinData && (hasVTOData || hasLipShades));
  };

  const handleImageCapture = async (imageData: string) => {
    setState((prev) => ({
      ...prev,
      imageData,
      step: 'processing',
      isLoading: true,
      error: null,
      errorList: null,
      scanProgress: 0,
    }));

    // Timer to animate scan progress during the API call phase (50-95%).
    let scanTimer: ReturnType<typeof setInterval> | null = null;

    try {
      // Comprehensive validation (size, resolution, face, quality, privacy) 
      // — fail fast with friendly messages instead of burning API credits on
      // doomed images. All processing happens client-side for privacy.
      setState((prev) => ({ ...prev, scanProgress: 2 }));

      const validation = await runFullImageValidation(imageData, (progress, message) => {
        // Validation maps to the first half of the scan overlay progress.
        setState((prev) => ({
          ...prev,
          validationProgress: progress,
          validationMessage: message,
          scanProgress: Math.round(2 + (progress / 100) * 48),
        }));
      });
      
      if (!validation.valid) {
        const errorMessages = validation.errors?.length
          ? validation.errors
          : [validation.message ?? 'The selected image cannot be analyzed.'];
        setState((prev) => ({
          ...prev,
          error: validation.message ?? 'The selected image cannot be analyzed.',
          errorList: errorMessages,
          step: 'capture',
          isLoading: false,
          // imageData already set above — kept so the user can retake/retry.
        }));
        setValidationProgress(0);
        return;
      }

      // Compress/resize before analysis and storage so large uploads don't
      // blow past the localStorage quota (SRS NF1.4 + FR4.1).
      const compressed = await compressImage(imageData);

      // API phase: ease the overlay progress from 50 → 95% while the request
      // is in flight so the scan overlay reads as live progress.
      setState((prev) => ({ ...prev, scanProgress: 50 }));
      scanTimer = setInterval(() => {
        setState((prev) => ({
          ...prev,
          scanProgress: Math.min(prev.scanProgress + 1, 95),
        }));
      }, 200);

      const result = await analyzeImage(compressed);

      if (scanTimer) {
        clearInterval(scanTimer);
        scanTimer = null;
      }
      setState((prev) => ({ ...prev, scanProgress: 100 }));

      // Never surface empty/incomplete results — treat a malformed response as a
      // failure so the user sees the friendly alert + their photo, not a blank
      // dashboard. This keeps every "results" render backed by real data.
      if (!hasCompleteAnalysis(result)) {
        setState((prev) => ({
          ...prev,
          error: 'The analysis returned no usable results. Please try a clearer photo.',
          errorList: null,
          step: 'capture',
          isLoading: false,
        }));
        return;
      }

      const item = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        summary: `Skin score ${result.skinAnalysis.healthScore}/100`,
        imageData: compressed,
        analysis: result,
      };

      addAnalysisToHistory(item);
      saveAnalysis(result);

      setState((prev) => ({
        ...prev,
        analysis: result,
        step: 'results',
        isLoading: false,
      }));
    } catch (err) {
      // Collect all errors that occurred during processing
      const errors: string[] = [];
      
      // Add analysis error
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      const analysisError = friendlyApiError(errorMessage);
      errors.push(analysisError);
      
      // If we have multiple errors, show them all
      const finalError = errors.length > 1 
        ? `Multiple issues found:\n\n${errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}`
        : errors[0];
      
      setState((prev) => ({
        ...prev,
        error: finalError,
        errorList: errors.length > 1 ? errors : null,
        step: 'capture',
        isLoading: false,
        // Keep imageData so the user can retry the same photo or retake —
        // the original image stays visible in the error alert.
      }));
    } finally {
      // Always stop the progress timer, whatever the outcome.
      if (scanTimer) clearInterval(scanTimer);
    }
  };

  // Re-analyze the retained image (user adjusted position and wants another go).
  const handleRetry = () => {
    if (state.imageData) handleImageCapture(state.imageData);
  };

  // Discard the failed image and return to a fresh camera/upload flow.
  const handleStartOver = () => {
    setState({ ...defaultState });
  };

  // Brand-name click: always return to the original home/capture screen.
  const handleGoHome = () => {
    setState({ ...defaultState });
  };

  const handleBack = () => {
    setState({
      step: 'capture',
      imageData: null,
      analysis: null,
      error: null,
      errorList: null,
      isLoading: false,
      validationProgress: 0,
      validationMessage: '',
      scanProgress: 0,
    });
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-emerald-50 to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="sticky top-0 z-40 bg-white shadow-sm dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleGoHome}
            aria-label="Go to home"
            className="flex items-center gap-3 text-left"
          >
            <Sparkles className="w-6 h-6 text-emerald-600" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-amber-600 bg-clip-text text-transparent">
              Nyirira
            </h1>
          </button>
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
        </div>
      </header>

      <main className="w-full">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="mb-12">
            <div className="flex items-center justify-between">
              <div
                className={`flex-1 h-2 rounded-full ${
                  viewStep === 'capture' ? 'bg-emerald-600' : 'bg-emerald-200'
                }`}
              />
              <div className="px-4 text-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                    ['capture', 'processing', 'results'].indexOf(viewStep) >= 1
                      ? 'bg-emerald-600'
                      : 'bg-slate-300'
                  }`}
                >
                  {viewStep === 'capture' ? '1' : '✓'}
                </div>
              </div>
              <div
                className={`flex-1 h-2 rounded-full ${
                  viewStep === 'processing' || viewStep === 'results'
                    ? 'bg-emerald-600'
                    : 'bg-emerald-200'
                }`}
              />
              <div className="px-4 text-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                    viewStep === 'results' ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  {viewStep === 'results' ? '✓' : '2'}
                </div>
              </div>
              <div
                className={`flex-1 h-2 rounded-full ${
                  viewStep === 'results' ? 'bg-emerald-600' : 'bg-emerald-200'
                }`}
              />
            </div>

            <div className="flex justify-between mt-4 text-sm font-medium text-slate-600">
              <span>Capture</span>
              <span>Analyzing</span>
              <span>Results</span>
            </div>
          </div>

          {state.error && viewStep === 'capture' && (
            <div
              role="alert"
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-950 dark:border-red-900"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-red-900 dark:text-red-100">Analysis Error</p>
                    <div className="relative group">
                      <HelpCircle className="w-4 h-4 text-red-400" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-xs rounded py-1 px-2 z-10 w-64">
                        <p className="text-center">To avoid errors: move close, face the camera directly, ensure good lighting, and use a clear photo.</p>
                      </div>
                    </div>
                  </div>
                  {state.errorList && state.errorList.length > 1 ? (
                    <ul className="mt-1 space-y-1 text-sm text-red-800 dark:text-red-200 list-disc list-inside">
                      {state.errorList.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="mt-1">
                      <p className="text-red-800 text-sm dark:text-red-200">{state.error}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Show the original image with retry / retake options */}
              {state.imageData && (
                <div className="mt-4 flex flex-col sm:flex-row items-start gap-4">
                  <img
                    src={state.imageData}
                    alt="Photo that failed analysis"
                    className="w-28 h-28 object-cover rounded-lg border border-red-200"
                  />
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      This photo couldn&apos;t be analyzed. Fix the issue above and try the same photo again,
                      or take/upload a new one.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleRetry}
                        disabled={state.isLoading}
                        className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Try again
                      </button>
                      <button
                        type="button"
                        onClick={handleStartOver}
                        disabled={state.isLoading}
                        className="inline-flex items-center gap-2 rounded-full border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:bg-transparent dark:text-red-200 dark:border-red-800 dark:hover:bg-red-950"
                      >
                        <Camera className="w-4 h-4" />
                        Take new photo
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {viewStep === 'capture' && (
            <div className="flex flex-col items-center">
              {/* Validation Progress UI */}
              {state.validationProgress > 0 && state.validationProgress < 100 && (
                <div className="w-full max-w-md bg-white rounded-xl p-6 shadow-lg mb-8 border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">Validating Image</h3>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {Math.round(state.validationProgress)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-slate-700">
                      <div
                        className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${state.validationProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                      {state.validationMessage}
                    </p>
                  </div>
                </div>
              )}
              
              {!state.error && <CameraCapture onImageCapture={handleImageCapture} />}
            </div>
          )}

          {viewStep === 'processing' && (
            <div className="flex flex-col items-center justify-center py-6">
              {state.imageData ? (
                <ScanOverlay imageData={state.imageData} progress={state.scanProgress} />
              ) : (
                <div className="mb-6">
                  <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
                </div>
              )}
              <h2 className="text-2xl font-bold text-slate-900 mt-6 mb-2">Analyzing Your Skin</h2>
              <p className="text-slate-600 text-center max-w-md">
                Our AI is processing your image to provide personalized skincare recommendations optimized for melanin-rich skin (Fitzpatrick V-VI).
              </p>
            </div>
          )}

          {viewStep === 'results' && analysis && (
            <div className="space-y-6">
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleExport}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Download className="w-4 h-4" />
                  Export image
                </button>
                {settings.enableSocialSharing && (
                  <button
                    type="button"
                    onClick={handleShare}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                )}
              </div>

              <HistoryCompare current={analysis} history={history} currentImageData={state.imageData!} />

              <AnalysisDashboard
                analysis={analysis}
                imageData={state.imageData!}
                onBack={handleBack}
                onSaved={() => showToast('success', 'Results saved to this device')}
              />
            </div>
          )}

          {history.length > 0 && viewStep === 'capture' && (
            <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Clock3 className="w-4 h-4 text-slate-600" />
                <h2 className="font-semibold text-slate-900">Recent History</h2>
                <button
                  type="button"
                  onClick={() => {
                    clearAnalysisHistory();
                    showToast('info', 'History cleared');
                  }}
                  className="ml-auto inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  Clear history
                </button>
              </div>

              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 p-3 hover:border-emerald-200 hover:bg-emerald-50"
                  >
                    <button
                      type="button"
                      onClick={() => setState({ ...defaultState, step: 'results', analysis: item.analysis, imageData: item.imageData })}
                      className="flex flex-1 items-center gap-3 text-left"
                    >
                      <div
                        className="h-12 w-12 rounded-lg bg-cover bg-center"
                        style={{ backgroundImage: `url(${item.imageData})` }}
                      />
                      <div>
                        <p className="font-medium text-slate-900">{item.summary}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(item.createdAt).toLocaleDateString()} · {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-emerald-700">Open</span>
                      <button
                        type="button"
                        aria-label={`Remove ${item.summary}`}
                        onClick={() => {
                          removeAnalysisFromHistory(item.id);
                          showToast('info', 'History item removed');
                        }}
                        className="rounded-full border border-slate-200 p-1.5 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <footer className="bg-slate-900 text-slate-300 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-white mb-2">About Nyirira</h3>
              <p className="text-sm">
                Safe, localized skincare diagnostics for the Ugandan market, optimized for melanin-rich skin.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Disclaimer</h3>
              <p className="text-sm">
                This tool provides guidance only. Always consult a dermatologist for medical concerns.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Privacy</h3>
              <p className="text-sm">
                Your images are analyzed locally. No data is stored on servers.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-8 text-center text-sm">
            <p>© 2026 Nyirira. Built for beautiful, healthy melanin-rich skin.</p>
          </div>
        </div>
      </footer>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
