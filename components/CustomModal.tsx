"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

// ----------------------------------------------------
export interface ModalProps {
  isOpen: boolean;
  type?: "info" | "success" | "error" | "warning";
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onClose: () => void;
  children?: React.ReactNode;
}

// ----------------------------------------------------
export default function CustomModal({
  isOpen,
  type = "info",
  title,
  message,
  confirmText = "Compris",
  cancelText,
  onConfirm,
  onClose,
  children
}: ModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-8 h-8 text-emerald-400" />;
      case "error":
        return <AlertTriangle className="w-8 h-8 text-rose-500" />;
      case "warning":
        return <AlertTriangle className="w-8 h-8 text-amber-400" />;
      default:
        return <Info className="w-8 h-8 text-sky-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#120f26] border border-white/10 rounded-2xl shadow-2xl overflow-hidden transform transition-all">
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                {getIcon()}
              </div>
              <h3 className="text-lg font-bold text-white tracking-wide">
                {title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {message && (
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              {message}
            </p>
          )}

          {children && <div className="mb-4">{children}</div>}

          <div className="flex items-center justify-end gap-3 mt-6">
            {cancelText && (
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium transition-colors"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={() => {
                if (onConfirm) onConfirm();
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
