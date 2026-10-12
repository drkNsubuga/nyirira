'use client';

import { useEffect } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  variant: ToastVariant;
  text: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
  /** Auto-dismiss after this many ms. Default 4000. */
  duration?: number;
}

const variantStyles: Record<ToastVariant, { wrap: string; Icon: typeof Info }> = {
  success: { wrap: 'bg-emerald-600', Icon: CheckCircle2 },
  error: { wrap: 'bg-red-600', Icon: XCircle },
  info: { wrap: 'bg-slate-800', Icon: Info },
};

/**
 * Accessible inline toast. Uses `role="status"` + `aria-live="polite"` so
 * screen readers announce it, replacing the previous native `alert()` calls
 * (SRS NF3.1 — WCAG 2.1 AA). Auto-dismisses; dismissable via the close button.
 */
export default function Toast({ toast, onDismiss, duration = 4000 }: ToastProps) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [toast, duration, onDismiss]);

  if (!toast) return null;

  const { wrap, Icon } = variantStyles[toast.variant];

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 px-4"
    >
      <div
        className={`flex items-center gap-3 rounded-full px-4 py-3 text-sm font-medium text-white shadow-lg ${wrap}`}
      >
        <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        <span>{toast.text}</span>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="ml-1 rounded-full p-1 hover:bg-white/20"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
