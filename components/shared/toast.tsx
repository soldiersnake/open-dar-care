"use client";

import { useEffect, type JSX } from "react";

export type ToastVariant = "success" | "error" | "warning";

const variantStyles: Record<ToastVariant, { icon: JSX.Element; iconWrap: string }> = {
  success: {
    icon: (
      <path d="M4 12.5 9.5 18 20 6.5" />
    ),
    iconWrap: "bg-[#CFEBD8] text-[#3E9B6C]",
  },
  error: {
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m9 9 6 6M15 9l-6 6" />
      </>
    ),
    iconWrap: "bg-[#FBD8CC] text-[#C5503A]",
  },
  warning: {
    icon: (
      <>
        <path d="M10.3 3.9 1.9 18.1A2 2 0 0 0 3.6 21h16.8a2 2 0 0 0 1.7-2.9L13.7 3.9a2 2 0 0 0-3.4 0z" />
        <path d="M12 9v4M12 17v.1" />
      </>
    ),
    iconWrap: "bg-[#FBF1D6] text-[#9A7B1E]",
  },
};

export function Toast({
  variant,
  message,
  onClose,
}: {
  variant: ToastVariant;
  message: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = variantStyles[variant];

  return (
    <div
      role={variant === "success" ? "status" : "alert"}
      aria-live={variant === "success" ? "polite" : "assertive"}
      className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2.5 rounded-2xl border border-[#ECE0D0] bg-[#FFFDF9] px-4 py-3 shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)]"
    >
      <span
        className={`flex h-6 w-6 flex-none items-center justify-center rounded-full ${styles.iconWrap}`}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {styles.icon}
        </svg>
      </span>
      <span className="text-[14px] font-bold text-ink">{message}</span>
    </div>
  );
}
