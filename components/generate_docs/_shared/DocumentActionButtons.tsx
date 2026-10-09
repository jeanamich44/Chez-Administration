"use client";

import React, { useEffect, useState } from "react";
import { Download, Eye, RefreshCw, Sparkles } from "lucide-react";

/* ===================================================================== */

interface DocumentActionButtonsProps {
  onFillExample?: () => void;
  onReset: () => void;
  onPreview?: () => void;
  onSubmit?: () => void;
  submitType?: "button" | "submit";
  isPreviewLoading?: boolean;
  isGenerating?: boolean;
  isPreviewBlocked?: boolean;
  previewAllowed?: boolean;
  previewCooldown?: number;
  formatCooldownTimer?: (seconds: number) => string;
  previewLabel?: string;
  generateLabel?: string;
  price?: number;
  disabled?: boolean;
  className?: string;
}

/* ===================================================================== */

function formatStopwatch(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
}

/* ===================================================================== */

export default function DocumentActionButtons({
  onFillExample,
  onReset,
  onPreview,
  onSubmit,
  submitType = "submit",
  isPreviewLoading = false,
  isGenerating = false,
  isPreviewBlocked = false,
  previewAllowed = true,
  previewCooldown = 0,
  formatCooldownTimer,
  previewLabel = "Aperçu gratuit",
  generateLabel = "Générer le PDF",
  price,
  disabled = false,
  className = ""
}: DocumentActionButtonsProps) {
  const [previewTimer, setPreviewTimer] = useState(0);
  const [generateTimer, setGenerateTimer] = useState(0);

  useEffect(() => {
    if (!isPreviewLoading) {
      setPreviewTimer(0);
      return;
    }
    setPreviewTimer(0);
    const start = Date.now();
    const iv = setInterval(() => {
      setPreviewTimer(Math.floor((Date.now() - start) / 1000));
    }, 250);
    return () => clearInterval(iv);
  }, [isPreviewLoading]);

  useEffect(() => {
    if (!isGenerating) {
      setGenerateTimer(0);
      return;
    }
    setGenerateTimer(0);
    const start = Date.now();
    const iv = setInterval(() => {
      setGenerateTimer(Math.floor((Date.now() - start) / 1000));
    }, 250);
    return () => clearInterval(iv);
  }, [isGenerating]);

  const previewText = !previewAllowed
    ? "Aperçus désactivés"
    : previewCooldown > 0
      ? `${previewLabel} (${formatCooldownTimer ? formatCooldownTimer(previewCooldown) : `${previewCooldown}s`})`
      : previewLabel;

  const generatePriceText = price != null ? ` (${price.toFixed(2)} €)` : "";

  return (
    <div className={`w-full pt-5 border-t border-white/10 space-y-2.5 ${className}`}>
      <div className="grid grid-cols-2 gap-2">
        {onFillExample && (
          <button
            type="button"
            onClick={onFillExample}
            disabled={disabled || isPreviewLoading || isGenerating}
            className="h-10 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.98] border border-white/10 text-white/70 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none"
          >
            <Sparkles size={13} className="text-amber-400 shrink-0" />
            <span className="truncate">Exemple</span>
          </button>
        )}
        <button
          type="button"
          onClick={onReset}
          disabled={disabled || isPreviewLoading || isGenerating}
          className={`h-10 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.98] border border-white/10 text-white/70 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none ${
            !onFillExample ? "col-span-2" : ""
          }`}
        >
          <RefreshCw size={13} className="text-white/50 shrink-0" />
          <span className="truncate">Réinitialiser</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {onPreview && (
          <button
            type="button"
            onClick={onPreview}
            disabled={disabled || isPreviewLoading || isPreviewBlocked || isGenerating}
            className="h-12 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 active:scale-[0.98] border border-white/10 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none"
          >
            {isPreviewLoading ? (
              <>
                <RefreshCw size={14} className="animate-spin text-primary shrink-0" />
                <span className="truncate">Aperçu en cours</span>
                <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-black/60 text-primary border border-primary/20 shrink-0">
                  {formatStopwatch(previewTimer)}
                </span>
              </>
            ) : (
              <>
                <Eye size={15} className="shrink-0 text-white/70" />
                <span className="truncate">{previewText}</span>
              </>
            )}
          </button>
        )}

        <button
          type={submitType}
          onClick={onSubmit}
          disabled={disabled || isGenerating || isPreviewLoading}
          className={`h-12 px-4 rounded-xl bg-primary hover:bg-primary/90 active:scale-[0.98] text-slate-950 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none ${
            !onPreview ? "sm:col-span-2" : ""
          }`}
        >
          {isGenerating ? (
            <>
              <RefreshCw size={14} className="animate-spin text-slate-950 shrink-0" />
              <span className="truncate">Génération en cours</span>
              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-950/20 text-slate-950 font-black shrink-0">
                {formatStopwatch(generateTimer)}
              </span>
            </>
          ) : (
            <>
              <Download size={15} className="shrink-0 text-slate-950" />
              <span className="truncate">
                {generateLabel}
                {generatePriceText}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
