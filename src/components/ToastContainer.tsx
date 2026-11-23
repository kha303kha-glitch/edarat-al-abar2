import React from 'react';
import {CheckCircle2, AlertCircle, Info, X} from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({toasts, onDismiss}) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="no-print fixed bottom-20 left-4 right-4 sm:left-6 sm:right-auto sm:w-96 z-50 flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((toast) => {
        const styles =
          toast.type === 'success'
            ? 'bg-emerald-800 text-white border-emerald-700'
            : toast.type === 'error'
              ? 'bg-red-700 text-white border-red-600'
              : 'bg-slate-900 text-white border-slate-800';

        const Icon =
          toast.type === 'success'
            ? CheckCircle2
            : toast.type === 'error'
              ? AlertCircle
              : Info;

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg transition-all ${styles}`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon className="h-4 w-4 shrink-0" />
              <span className="leading-snug">{toast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="إغلاق الإشعار"
              className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg hover:bg-white/15 transition-colors shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
