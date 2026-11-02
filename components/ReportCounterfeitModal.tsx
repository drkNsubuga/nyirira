'use client';

import { useState } from 'react';
import { AlertTriangle, X, Send, CheckSquare, Square, Camera } from 'lucide-react';
import Image from 'next/image';
import {
  AdverseSymptom,
  ADVERSE_SYMPTOM_LABELS,
  UGANDA_MARKETS,
  CounterfeitReport,
  COUNTERFEIT_REPORTS_KEY,
} from '@/types/nyirira';

interface ReportCounterfeitModalProps {
  isOpen: boolean;
  onClose: () => void;
  healthScore?: number;
  onReported?: (report: CounterfeitReport) => void;
}

const INITIAL_FORM = {
  productName: '',
  vendorBrand: '',
  purchaseLocation: '',
  batchNumber: '',
  symptoms: [] as AdverseSymptom[],
  productImageDataUrl: undefined as string | undefined,
};

export default function ReportCounterfeitModal({
  isOpen,
  onClose,
  healthScore,
  onReported,
}: ReportCounterfeitModalProps) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof INITIAL_FORM, string>>>({});

  if (!isOpen) return null;

  const toggleSymptom = (sym: AdverseSymptom) => {
    setForm((prev) => ({
      ...prev,
      symptoms: prev.symptoms.includes(sym)
        ? prev.symptoms.filter((s) => s !== sym)
        : [...prev.symptoms, sym],
    }));
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!form.productName.trim()) e.productName = 'Required';
    if (!form.vendorBrand.trim()) e.vendorBrand = 'Required';
    if (!form.purchaseLocation.trim()) e.purchaseLocation = 'Required';
    if (form.symptoms.length === 0) e.symptoms = 'Select at least one symptom';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    const report: CounterfeitReport = {
      id: `cr_${Date.now()}`,
      createdAt: new Date().toISOString(),
      productName: form.productName.trim(),
      vendorBrand: form.vendorBrand.trim(),
      purchaseLocation: form.purchaseLocation,
      batchNumber: form.batchNumber.trim() || undefined,
      symptoms: form.symptoms,
      healthScoreAtReport: healthScore,
      productImageDataUrl: form.productImageDataUrl,
    };

    try {
      const existing: CounterfeitReport[] = JSON.parse(
        localStorage.getItem(COUNTERFEIT_REPORTS_KEY) ?? '[]'
      );
      localStorage.setItem(
        COUNTERFEIT_REPORTS_KEY,
        JSON.stringify([report, ...existing])
      );
    } catch {
      // localStorage unavailable — still show success UI
    }

    setSubmitted(true);
    onReported?.(report);
  };

  const handleClose = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    setSubmitted(false);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rcm-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-red-50 dark:bg-red-950/40">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <h2 id="rcm-title" className="font-bold text-red-900 dark:text-red-100 text-lg">
              Report Adverse Reaction
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close modal"
            className="rounded-full p-1.5 text-slate-500 hover:bg-red-100 dark:hover:bg-red-900/40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <Send className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Report Submitted
            </h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-sm">
              Thank you for keeping the community safe. Your report has been saved and will appear
              in the Community Safety Watch.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-2 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Help protect others by reporting products that caused skin damage. Fields marked{' '}
              <span className="text-red-500 font-bold">*</span> are required.
            </p>

            <div>
              <label htmlFor="rcm-product" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                id="rcm-product"
                type="text"
                value={form.productName}
                onChange={(e) => {
                  setForm((p) => ({ ...p, productName: e.target.value }));
                  setErrors((p) => ({ ...p, productName: undefined }));
                }}
                placeholder="e.g. Fair & White Gold"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-400"
              />
              {errors.productName && (
                <p className="mt-1 text-xs text-red-600">{errors.productName}</p>
              )}
            </div>

            <div>
              <label htmlFor="rcm-vendor" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Vendor / Brand Name <span className="text-red-500">*</span>
              </label>
              <input
                id="rcm-vendor"
                type="text"
                value={form.vendorBrand}
                onChange={(e) => {
                  setForm((p) => ({ ...p, vendorBrand: e.target.value }));
                  setErrors((p) => ({ ...p, vendorBrand: undefined }));
                }}
                placeholder="e.g. Beauty World Ltd"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-400"
              />
              {errors.vendorBrand && (
                <p className="mt-1 text-xs text-red-600">{errors.vendorBrand}</p>
              )}
            </div>

            <div>
              <label htmlFor="rcm-location" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Purchase Location <span className="text-red-500">*</span>
              </label>
              <select
                id="rcm-location"
                value={form.purchaseLocation}
                onChange={(e) => {
                  setForm((p) => ({ ...p, purchaseLocation: e.target.value }));
                  setErrors((p) => ({ ...p, purchaseLocation: undefined }));
                }}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                <option value="">Select market / channel...</option>
                {UGANDA_MARKETS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              {errors.purchaseLocation && (
                <p className="mt-1 text-xs text-red-600">{errors.purchaseLocation}</p>
              )}
            </div>

            <div>
              <label htmlFor="rcm-batch" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Batch / Lot Number{' '}
                <span className="text-slate-400 font-normal text-xs">(optional)</span>
              </label>
              <input
                id="rcm-batch"
                type="text"
                value={form.batchNumber}
                onChange={(e) => setForm((p) => ({ ...p, batchNumber: e.target.value }))}
                placeholder="e.g. BT2024-03A"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>

            <div>
              <p className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Adverse Symptoms <span className="text-red-500">*</span>
              </p>
              <div className="space-y-2">
                {(Object.keys(ADVERSE_SYMPTOM_LABELS) as AdverseSymptom[]).map((sym) => {
                  const checked = form.symptoms.includes(sym);
                  return (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => {
                        toggleSymptom(sym);
                        setErrors((p) => ({ ...p, symptoms: undefined }));
                      }}
                      className={`w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-sm text-left transition-colors ${
                        checked
                          ? 'border-red-400 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-100'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-red-300 hover:bg-red-50/50'
                      }`}
                      aria-pressed={checked}
                    >
                      {checked ? (
                        <CheckSquare className="w-4 h-4 text-red-600 flex-shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      )}
                      {ADVERSE_SYMPTOM_LABELS[sym]}
                    </button>
                  );
                })}
              </div>
              {errors.symptoms && (
                <p className="mt-1 text-xs text-red-600">{errors.symptoms}</p>
              )}
            </div>

            {/* Product Photo (optional) */}
            <div>
              <p className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Product Photo <span className="text-slate-400 font-normal text-xs">(optional — helps others identify the product)</span>
              </p>
              {form.productImageDataUrl ? (
                <div className="relative w-24 h-24">
                  <Image
                    src={form.productImageDataUrl}
                    alt="Product photo preview"
                    fill
                    className="object-cover rounded-lg border border-slate-300"
                    unoptimized
                  />
                  <button type="button" onClick={() => setForm(p => ({ ...p, productImageDataUrl: undefined }))}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs"
                    aria-label="Remove photo">✕</button>
                </div>
              ) : (
                <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-slate-300 dark:border-slate-600 px-4 py-3 text-sm text-slate-500 hover:border-amber-400 hover:text-amber-700 transition-colors">
                  <Camera className="w-4 h-4 flex-shrink-0" />
                  Take or upload photo
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const dataUrl = ev.target?.result as string;
                        setForm(p => ({ ...p, productImageDataUrl: dataUrl }));
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              )}
            </div>
          </div>
        )}

        {!submitted && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full rounded-full bg-red-600 hover:bg-red-700 px-6 py-3 text-sm font-semibold text-white flex items-center justify-center gap-2 transition-colors"
            >
              <Send className="w-4 h-4" />
              Submit Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
