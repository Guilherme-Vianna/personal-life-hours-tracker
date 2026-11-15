"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type Tone = "success" | "error";
type Toast = { id: number; message: string; tone: Tone; leaving: boolean };

const ToastContext = createContext<(message: string, tone?: Tone) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string, tone: Tone = "success") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, tone, leaving: false }]);
    setTimeout(() => setToasts((current) => current.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast))), 3200);
    setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 3500);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-50 flex flex-col items-center gap-2 px-4 lg:bottom-6">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-semibold shadow-xl ${toast.leaving ? "toast-leave" : ""} ${
              toast.tone === "error" ? "bg-danger text-white" : "chalkboard text-chalk"
            }`}
          >
            <span className={`flex size-5 items-center justify-center rounded-full text-xs ${toast.tone === "error" ? "bg-white/20" : "bg-pencil text-board-dark"}`} aria-hidden>
              {toast.tone === "error" ? "!" : "✓"}
            </span>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
