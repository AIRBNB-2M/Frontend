"use client";

import { ToastType } from "@/components/Toast";
import { useState, useCallback } from "react";

interface ToastState {
  message: string;
  type: ToastType;
  isVisible: boolean;
}

interface ShowToastOptions {
  type?: ToastType;
  duration?: number;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    message: "",
    type: "success",
    isVisible: false,
  });

  const showToast = useCallback(
    (message: string, options?: ShowToastOptions) => {
      setToast({
        message,
        type: options?.type || "success",
        isVisible: true,
      });
    },
    []
  );

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  }, []);

  // 편의 메서드들
  const showSuccess = useCallback(
    (message: string) => {
      showToast(message, { type: "success" });
    },
    [showToast]
  );

  const showError = useCallback(
    (message: string) => {
      showToast(message, { type: "error" });
    },
    [showToast]
  );

  const showWarning = useCallback(
    (message: string) => {
      showToast(message, { type: "warning" });
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message: string) => {
      showToast(message, { type: "info" });
    },
    [showToast]
  );

  return {
    toast,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}
