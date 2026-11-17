import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function ToastContainer() {
  const { toasts, dismissToast } = useAuth();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0 pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 bg-white border border-slate-200 shadow-lg rounded-xl px-4 py-3 text-sm text-slate-800"
        >
          {toast.type === 'success' && (
            <CheckCircle2 className="w-4 h-4 text-[#14B8A6] shrink-0 mt-0.5" />
          )}
          {toast.type === 'error' && (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          {toast.type === 'info' && (
            <Info className="w-4 h-4 text-[#6D5CE7] shrink-0 mt-0.5" />
          )}
          <p className="flex-1 leading-snug">{toast.message}</p>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss notification"
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
