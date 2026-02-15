import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Toast {
  id: number;
  message: string;
  tone: 'success' | 'error' | 'info';
}

interface ToastContextValue {
  pushToast: (message: string, tone?: Toast['tone']) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const value = useMemo<ToastContextValue>(
    () => ({
      pushToast: (message, tone = 'info') => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, tone }]);
        window.setTimeout(() => {
          setToasts((prev) => prev.filter((item) => item.id !== id));
        }, 2500);
      }
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex w-72 flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'rounded-lg px-3 py-2 text-sm text-white shadow-lg',
              toast.tone === 'success' && 'bg-emerald-600',
              toast.tone === 'error' && 'bg-rose-600',
              toast.tone === 'info' && 'bg-slate-800'
            )}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used in ToastProvider');
  return context;
}
