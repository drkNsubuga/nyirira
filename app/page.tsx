'use client';

import { useState } from 'react';
import CameraCapture from '@/components/CameraCapture';
import AnalysisDashboard from '@/components/AnalysisDashboard';
import { analyzeImage } from '@/lib/youcamClient';
import { AppState } from '@/lib/types';
import { Loader2, AlertCircle, Sparkles } from 'lucide-react';

const defaultState: AppState = {
  step: 'capture',
  imageData: null,
  analysis: null,
  error: null,
  isLoading: false,
};

export default function Home() {
  const [state, setState] = useState<AppState>(() => {
    if (typeof window === 'undefined') {
      return defaultState;
    }

    try {
      const saved = window.localStorage.getItem('nyirira_analysis');
      if (!saved) {
        return defaultState;
      }

      return {
        ...defaultState,
        step: 'results',
        analysis: JSON.parse(saved),
      };
    } catch {
      return defaultState;
    }
  });

  const handleImageCapture = async (imageData: string) => {
    setState((prev) => ({
      ...prev,
      imageData,
      step: 'processing',
      isLoading: true,
      error: null,
    }));

    try {
      const analysis = await analyzeImage(imageData);
      setState((prev) => ({
        ...prev,
        analysis,
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
    setState({
      step: 'capture',
      imageData: null,
      analysis: null,
      error: null,
      isLoading: false,
    });
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-emerald-50 to-amber-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-6 h-6 text-emerald-600" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-amber-600 bg-clip-text text-transparent">
              Nyirira
            </h1>
          </div>
          <p className="text-slate-600 text-sm">
            Localized skincare diagnostics & virtual beauty matching for melanin-rich skin
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Progress Indicator */}
          <div className="mb-12">
            <div className="flex items-center justify-between">
              <div
                className={`flex-1 h-2 rounded-full ${
                  state.step === 'capture'
                    ? 'bg-emerald-600'
                    : 'bg-emerald-200'
                }`}
              />
              <div className="px-4 text-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                    ['capture', 'processing', 'results'].indexOf(
                      state.step
                    ) >= 1
                      ? 'bg-emerald-600'
                      : 'bg-slate-300'
                  }`}
                >
                  {state.step === 'capture' ? '1' : '✓'}
                </div>
              </div>
              <div
                className={`flex-1 h-2 rounded-full ${
                  state.step === 'processing' || state.step === 'results'
                    ? 'bg-emerald-600'
                    : 'bg-emerald-200'
                }`}
              />
              <div className="px-4 text-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                    state.step === 'results'
                      ? 'bg-emerald-600'
                      : 'bg-slate-300'
                  }`}
                >
                  {state.step === 'results' ? '✓' : '2'}
                </div>
              </div>
              <div
                className={`flex-1 h-2 rounded-full ${
                  state.step === 'results'
                    ? 'bg-emerald-600'
                    : 'bg-emerald-200'
                }`}
              />
            </div>

            <div className="flex justify-between mt-4 text-sm font-medium text-slate-600">
              <span>Capture</span>
              <span>Analyzing</span>
              <span>Results</span>
            </div>
          </div>

          {/* Error State */}
          {state.error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Analysis Error</p>
                <p className="text-red-800 text-sm">{state.error}</p>
              </div>
            </div>
          )}

          {/* Capture Step */}
          {state.step === 'capture' && (
            <CameraCapture onImageCapture={handleImageCapture} />
          )}

          {/* Processing Step */}
          {state.step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-6">
                <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Analyzing Your Skin
              </h2>
              <p className="text-slate-600 text-center max-w-md">
                Our AI is processing your image to provide personalized skincare
                recommendations optimized for melanin-rich skin (Fitzpatrick V-VI).
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
                  <p className="text-sm text-slate-600">
                    Generating color recommendations...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Results Step */}
          {state.step === 'results' && state.analysis && (
            <AnalysisDashboard
              analysis={state.analysis}
              onBack={handleBack}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-white mb-2">About Nyirira</h3>
              <p className="text-sm">
                Safe, localized skincare diagnostics for the Ugandan market,
                optimized for melanin-rich skin.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Disclaimer</h3>
              <p className="text-sm">
                This tool provides guidance only. Always consult a dermatologist
                for medical concerns.
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
            <p>
              © 2026 Nyirira. Built for beautiful, healthy melanin-rich skin.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
