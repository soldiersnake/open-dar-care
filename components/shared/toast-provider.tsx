"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { Toast, type ToastVariant } from "@/components/shared/toast";

type ActiveToast = {
  key: number; // remounts the Toast so consecutive messages restart the 3s timer
  variant: ToastVariant;
  message: string;
};

type ToastContextValue = {
  showToast: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext);
  if (!value) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return value;
}

// Generic toast host: any screen in the (app) layout can raise feedback
// messages. Same visual and timing the feed's toast had.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ActiveToast | null>(null);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "success") => {
      setToast((current) => ({
        key: (current?.key ?? 0) + 1,
        variant,
        message,
      }));
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Toast
          key={toast.key}
          variant={toast.variant}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </ToastContext.Provider>
  );
}
