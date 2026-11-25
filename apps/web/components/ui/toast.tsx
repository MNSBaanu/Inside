'use client';

import { CheckCircle2, X } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

type Toast = { id: number; message: string };

const ToastContext = createContext<(message: string) => void>(() => undefined);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback((message: string) => {
    nextId.current += 1;
    const id = nextId.current;
    setToasts((current) => [...current.slice(-2), { id, message }]);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-6 right-6 z-[70] flex w-[min(22rem,calc(100vw-3rem))] flex-col gap-2"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      role="status"
      className="pointer-events-auto flex items-start gap-3 rounded-card bg-brand px-4 py-3 text-sm text-canvas shadow-lift"
    >
      <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-brand-soft" />
      <p className="flex-1">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
        className="-m-1 rounded p-1 text-canvas/70 hover:text-canvas"
      >
        <X aria-hidden className="h-4 w-4" />
      </button>
    </div>
  );
}
