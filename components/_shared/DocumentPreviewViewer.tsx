"use client";

import { useEffect } from "react";
import { X, Download, RefreshCw, ZoomIn } from "lucide-react";

/* ===================================================================== */

interface DocumentPreviewViewerProps {
  imageUrl: string | null;
  title?: string;
  onClose: () => void;
  onAction?: () => void;
  isActionLoading?: boolean;
  actionLabel?: string;
}

/* ===================================================================== */

export default function DocumentPreviewViewer({
  imageUrl,
  title,
  onClose,
  onAction,
  isActionLoading,
  actionLabel,
}: DocumentPreviewViewerProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#060810]/95 backdrop-blur-xl flex flex-col fade-in">
      <div className="flex items-center justify-between p-3.5 border-b border-white/10 bg-[#0a0d18]/80">
        <div className="flex items-center gap-2 min-w-0">
          <ZoomIn size={16} className="text-primary shrink-0" />
          <h3 className="font-black italic uppercase tracking-tight text-white text-xs sm:text-sm truncate">
            {title || "Aperçu du document"}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-colors shrink-0"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-3 overflow-auto">
        <div className="max-w-full max-h-full flex items-center justify-center shadow-2xl rounded-xl overflow-hidden border border-white/10 bg-white/5">
          <img
            src={imageUrl}
            alt="Aperçu du document"
            className="max-w-full max-h-[72vh] object-contain select-none"
          />
        </div>
      </div>

      {onAction && actionLabel && (
        <div className="p-3 border-t border-white/10 bg-[#080b14]/95 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onAction}
            disabled={isActionLoading}
            className="w-full h-11 rounded-xl bg-primary text-slate-950 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {isActionLoading ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
            <span>{actionLabel}</span>
          </button>
        </div>
      )}
    </div>
  );
}
