"use client";

import Link from 'next/link';
import { useState } from 'react';
import { AlertCircle, Clock3, Download, Loader2, Share2, Settings, Sparkles } from 'lucide-react';
import CameraCapture from '@/components/CameraCapture';
import AnalysisDashboard from '@/components/AnalysisDashboard';
import HistoryCompare from '@/components/HistoryCompare';
import Toast, { ToastMessage } from '@/components/Toast';
import { AppState } from '@/lib/types';
import {
  ANALYSIS_KEY,
  HISTORY_KEY,
  SETTINGS_KEY,
  addAnalysisToHistory,
  parseAnalysis,
  parseHistory,
  parseSettings,
  saveAnalysis,
} from '@/lib/storage';
import { useLocalStorageValue } from '@/lib/useLocalStorage';
import { analyzeImage } from '@/lib/youcamClient';
import { compressImage } from '@/lib/image';
import { exportResultAsPng } from '@/lib/export';

const defaultState: AppState = {
  step: 'capture',
  imageData: null,
  analysis: null,
  error: null,
  isLoading: false,
};

export default function Home() {
  // localStorage is read via useSyncExternalStore (see lib/useLocalStorage):
  // getServerSnapshot returns null during SSR and hydration, so the
  // server-rendered markup always matches the client's hydration render —
  // no hydration mismatch — and React re-renders with the stored values right
  // after hydration without a manual setState-in-effect.
  const storedAnalysis = parseAnalysis(useLocalStorageValue(ANALYSIS_KEY));
  const history = parseHistory(useLocalStorageValue(HISTORY_KEY));
  const settings = parseSettings(useLocalStorageValue(SETTINGS_KEY));

  // Interactive state (capture/processing/results) stays in useState; the
  // restored analysis is only used until the user explicitly starts over.
  const [state, setState] = useState<AppState>(defaultState);
  const [restored, setRestored] = useState(true);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const analysis = state.analysis ?? (restored ? storedAnalysis : null);
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

  const handleImageCapture = async (imageData: string) => {
    setState((prev) => ({
      ...prev,
      imageData,
      step: 'processing',
      isLoading: true,
      error: null,
    }));

    try {
      // Compress/resize before analysis and storage so large uploads don't
      // blow past the localStorage quota (SRS NF1.4 + FR4.1).
      const compressed = await compressImage(imageData);

      const result = await analyzeImage(compressed);
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
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        step: 'capture',
        isLoading: false,
        imageData: null,
      }));
    }
  };

  const handleBack = () => {
    setRestored(false);
    setState({
      step: 'capture',
      imageData: null,
      analysis: null,
      error: null,
      isLoading: false,
    });
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-emerald-50 to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="sticky top-0 z-40 bg-white shadow-sm dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-emerald-600" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-amber-600 bg-clip-text text-transparent">
              Nyirira
            </h1>
          </div>
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

          {state.error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Analysis Error</p>
                <p className="text-red-800 text-sm">{state.error}</p>
              </div>
            </div>
          )}

          {viewStep === 'capture' && <CameraCapture onImageCapture={handleImageCapture} />}

          {viewStep === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-6">
                <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Analyzing Your Skin</h2>
              <p className="text-slate-600 text-center max-w-md">
                Our AI is processing your image to provide personalized skincare recommendations optimized for melanin-rich skin (Fitzpatrick V-VI).
              </p>
              <div className="mt-6 space-y-2 max-w-md">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse" />
                  <p className="text-sm text-slate-600">Detecting skin conditions...</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse delay-100" />
                  <p className="text-sm text-slate-600">Analyzing texture & tone...</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse delay-200" />
                  <p className="text-sm text-slate-600">Generating color recommendations...</p>
                </div>
              </div>
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

              <HistoryCompare current={analysis} history={history} />

              <AnalysisDashboard
                analysis={analysis}
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
              </div>

              <div className="space-y-3">
                {history.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setState({ ...defaultState, step: 'results', analysis: item.analysis })}
                    className="flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 p-3 text-left hover:border-emerald-200 hover:bg-emerald-50"
                  >
                    <div className="flex items-center gap-3">
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
                    </div>
                    <span className="text-xs text-emerald-700">Open</span>
                  </button>
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
