'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Check, Globe, Moon, ShieldCheck, Sparkles, Sun } from 'lucide-react';
import { AppSettings, getAppSettings, saveAppSettings } from '@/lib/storage';
import { applyTheme, getStoredTheme, setStoredTheme, type ThemePreference } from '@/lib/theme';

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(() => getAppSettings());
  const [theme, setTheme] = useState<ThemePreference>(() => getStoredTheme());

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveAppSettings(next);
  };

  const toggleTheme = () => {
    const next: ThemePreference = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setStoredTheme(next);
    applyTheme(next);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-amber-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-slate-700 hover:text-slate-900">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <h1 className="text-2xl font-bold text-slate-900">Nyirira Settings</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="grid gap-6">
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">App Preferences</h2>

            <div className="space-y-4">
              <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
                <div>
                  <p className="font-medium text-slate-900">Use live API</p>
                  <p className="text-sm text-slate-600">Toggle real YouCam integration when credentials are present.</p>
                </div>
                <button
                  type="button"
                  onClick={() => updateSetting('useRealAPI', !settings.useRealAPI)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                    settings.useRealAPI ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                  aria-label="Toggle live API"
                >
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white transition ${
                      settings.useRealAPI ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>

              <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
                <div>
                  <p className="font-medium text-slate-900">Push notifications</p>
                  <p className="text-sm text-slate-600">Reminder updates for skin care and safety guidance.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                  Coming soon
                </span>
              </label>

              <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
                <div>
                  <p className="font-medium text-slate-900">Share results</p>
                  <p className="text-sm text-slate-600">Enable native share / clipboard sharing from the dashboard.</p>
                </div>
                <button
                  type="button"
                  onClick={() => updateSetting('enableSocialSharing', !settings.enableSocialSharing)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                    settings.enableSocialSharing ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                  aria-label="Toggle share results"
                >
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white transition ${
                      settings.enableSocialSharing ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Appearance</h2>

            <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? (
                  <Moon className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                ) : (
                  <Sun className="w-5 h-5 text-amber-500" aria-hidden="true" />
                )}
                <div>
                  <p className="font-medium text-slate-900">Dark mode</p>
                  <p className="text-sm text-slate-600">Easier viewing in low light.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                  theme === 'dark' ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
                role="switch"
                aria-checked={theme === 'dark'}
                aria-label="Toggle dark mode"
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white transition ${
                    theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Connected Apps</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Google</p>
                    <p className="text-sm text-slate-600">Account linking is not available yet.</p>
                  </div>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                  Coming soon
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Facebook</p>
                    <p className="text-sm text-slate-600">Account linking is not available yet.</p>
                  </div>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                  Coming soon
                </span>
              </div>
            </div>
          </section>

          <section className="bg-emerald-600 text-white rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-5 h-5" />
              <p className="font-semibold">Saved locally</p>
            </div>
            <p className="text-sm text-emerald-50">
              Your settings are stored in the browser so your preferences stay available on this device.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
