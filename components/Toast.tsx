"use client";

import { Check, X, AlertCircle, Info } from "lucide-react";
import { useEffect } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
  position?: "top" | "bottom";
}

const toastStyles = {
  success: {
    bg: "bg-green-600",
    icon: Check,
    iconColor: "text-white",
  },
  error: {
    bg: "bg-red-600",
    icon: X,
    iconColor: "text-white",
  },
  warning: {
    bg: "bg-yellow-600",
    icon: AlertCircle,
    iconColor: "text-white",
  },
  info: {
    bg: "bg-blue-600",
    icon: Info,
    iconColor: "text-white",
  },
};

export default function Toast({
  message,
  type = "success",
  isVisible,
  onClose,
  duration = 3000,
  position = "top",
}: ToastProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, duration]);

  if (!isVisible) return null;

  const style = toastStyles[type];
  const Icon = style.icon;
  const positionClass = position === "top" ? "top-4" : "bottom-4";

  return (
    <div
      className={`fixed ${positionClass} left-1/2 transform -translate-x-1/2 z-[9999] transition-all duration-300 ${
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
      }`}
    >
      <div
        className={`${style.bg} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 max-w-sm min-w-[200px]`}
      >
        <Icon className={`w-4 h-4 ${style.iconColor} flex-shrink-0`} />
        <span className="text-sm flex-1">{message}</span>
        {/* 수동 닫기 버튼 (선택사항) */}
        <button
          onClick={onClose}
          className="ml-2 p-0.5 hover:bg-white/20 rounded transition-colors"
          aria-label="토스트 닫기"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
