"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Download, Minus, Plus, RefreshCw, X } from "lucide-react";

/* ===================================================================== */

const MIN_SCALE = 0.2;
const MAX_SCALE = 8;
const ZOOM_STEP = 1.25;

type View = { scale: number; x: number; y: number };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/* ===================================================================== */

export default function MultiPagePreviewViewer({
  pages,
  title,
  onClose,
  onAction,
  actionLabel,
  isActionLoading,
  actionDisabled
}: {
  pages: string[];
  title: string;
  onClose: () => void;
  onAction?: () => void;
  actionLabel?: string;
  isActionLoading?: boolean;
  actionDisabled?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const naturalRef = useRef({ w: 0, h: 0 });
  const viewRef = useRef<View>({ scale: 1, x: 0, y: 0 });
  const dragRef = useRef<{ pointerId: number; x: number; y: number; origin: View } | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const [view, setView] = useState<View>({ scale: 1, x: 0, y: 0 });
  const [ready, setReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);
  const [closing, setClosing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    setMounted(true);
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true));
    });
    return () => {
      cancelAnimationFrame(frame);
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  const requestClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    closeTimerRef.current = window.setTimeout(onClose, 260);
  }, [closing, onClose]);

  const setViewBoth = useCallback((next: View) => {
    viewRef.current = next;
    setView(next);
  }, []);

  const fitToView = useCallback(() => {
    const viewport = viewportRef.current;
    const { w, h } = naturalRef.current;
    if (!viewport || w <= 0 || h <= 0) return;
    const pad = 16;
    const scale = Math.min((viewport.clientWidth - pad) / w, (viewport.clientHeight - pad) / h);
    const next = {
      scale,
      x: (viewport.clientWidth - w * scale) / 2,
      y: (viewport.clientHeight - h * scale) / 2
    };
    setViewBoth(next);
  }, [setViewBoth]);

  const zoomAt = useCallback(
    (clientX: number, clientY: number, factor: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const rect = viewport.getBoundingClientRect();
      const mx = clientX - rect.left;
      const my = clientY - rect.top;
      const current = viewRef.current;
      const nextScale = clamp(current.scale * factor, MIN_SCALE, MAX_SCALE);
      const worldX = (mx - current.x) / current.scale;
      const worldY = (my - current.y) / current.scale;
      setViewBoth({
        scale: nextScale,
        x: mx - worldX * nextScale,
        y: my - worldY * nextScale
      });
    },
    [setViewBoth]
  );

  const zoomBy = useCallback(
    (factor: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      zoomAt(viewport.clientWidth / 2, viewport.clientHeight / 2, factor);
    },
    [zoomAt]
  );

  useEffect(() => {
    if (!mounted) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const container = containerRef.current;
    const viewport = viewportRef.current;

    const onContainerWheel = (e: WheelEvent) => {
      e.preventDefault();
    };

    const onViewportWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const factor = e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
      zoomAt(e.clientX, e.clientY, factor);
    };

    if (container) {
      container.addEventListener("wheel", onContainerWheel, { passive: false });
    }
    if (viewport) {
      viewport.addEventListener("wheel", onViewportWheel, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener("wheel", onContainerWheel);
      }
      if (viewport) {
        viewport.removeEventListener("wheel", onViewportWheel);
      }
      document.body.style.overflow = originalOverflow;
    };
  }, [mounted, zoomAt]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        requestClose();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentPage(p => Math.max(0, p - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setCurrentPage(p => Math.min(pages.length - 1, p + 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pages.length, requestClose]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      origin: viewRef.current
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    setViewBoth({
      scale: drag.origin.scale,
      x: drag.origin.x + dx,
      y: drag.origin.y + dy
    });
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const viewport = viewportRef.current;
    if (viewport && viewport.hasPointerCapture(e.pointerId)) {
      viewport.releasePointerCapture(e.pointerId);
    }
    dragRef.current = null;
  };

  const percent = Math.round(view.scale * 100);
  const currentUrl = pages[currentPage];

  if (!mounted || pages.length === 0) return null;

  return createPortal(
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className={`fixed inset-0 z-[9999] flex flex-col bg-slate-950/98 backdrop-blur-md transition-opacity duration-260 ease-out select-none ${
        entered && !closing ? "opacity-100" : "opacity-0"
      }`}
      onContextMenu={event => event.preventDefault()}
    >
      <div
        className={`shrink-0 flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-slate-950/90 transition-all duration-300 ease-out ${
          entered && !closing ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
        }`}
      >
        <div className="min-w-0 pr-2">
          <p className="text-xs font-black italic text-white truncate">{title}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] text-primary font-bold">
              Page {currentPage + 1}/{pages.length}
            </span>
            <span className="text-white/20 text-[10px]">•</span>
            <span className="text-[10px] text-white/40">Aperçu filigrané</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {pages.length > 1 && (
            <div className="flex items-center rounded-lg bg-white/5 border border-white/10 p-0.5 mr-1">
              <button
                type="button"
                disabled={currentPage <= 0}
                onClick={() => {
                  setReady(false);
                  setCurrentPage(p => Math.max(0, p - 1));
                }}
                className="w-7 h-7 rounded text-white/80 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-1.5 text-[10px] font-mono font-bold text-white/80">
                {currentPage + 1}/{pages.length}
              </span>
              <button
                type="button"
                disabled={currentPage >= pages.length - 1}
                onClick={() => {
                  setReady(false);
                  setCurrentPage(p => Math.min(pages.length - 1, p + 1));
                }}
                className="w-7 h-7 rounded text-white/80 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          {onAction && (
            <button
              type="button"
              onClick={onAction}
              disabled={isActionLoading || actionDisabled}
              className="h-8 px-3 rounded-xl bg-primary text-slate-950 font-black uppercase text-[10px] tracking-wider flex items-center gap-1.5 hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md shadow-primary/20 cursor-pointer"
            >
              {isActionLoading ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : (
                <Download size={12} />
              )}
              <span>{actionLabel || "PDF"}</span>
            </button>
          )}

          <div className="flex items-center rounded-lg bg-white/5 border border-white/10 p-0.5">
            <button
              type="button"
              onClick={() => zoomBy(1 / ZOOM_STEP)}
              className="w-7 h-7 rounded text-white/80 hover:bg-white/10 flex items-center justify-center cursor-pointer"
            >
              <Minus size={13} />
            </button>
            <button
              type="button"
              onClick={fitToView}
              className="px-1.5 h-7 rounded text-[10px] font-mono font-bold text-white/80 hover:bg-white/10 cursor-pointer"
            >
              {percent}%
            </button>
            <button
              type="button"
              onClick={() => zoomBy(ZOOM_STEP)}
              className="w-7 h-7 rounded text-white/80 hover:bg-white/10 flex items-center justify-center cursor-pointer"
            >
              <Plus size={13} />
            </button>
          </div>

          <button
            type="button"
            onClick={requestClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer ml-1"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div
        ref={viewportRef}
        className="relative flex-1 overflow-hidden cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={fitToView}
      >
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold uppercase tracking-widest text-white/40">
            Chargement page {currentPage + 1}…
          </div>
        )}
        {currentUrl && (
          <img
            key={currentUrl}
            src={currentUrl}
            alt=""
            draggable={false}
            onLoad={event => {
              const img = event.currentTarget;
              naturalRef.current = { w: img.naturalWidth, h: img.naturalHeight };
              setReady(true);
              requestAnimationFrame(fitToView);
            }}
            className="absolute top-0 left-0 max-w-none select-none pointer-events-none"
            style={{
              opacity: ready && entered && !closing ? 1 : 0,
              transition: "opacity 280ms ease-out",
              transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
              transformOrigin: "0 0"
            }}
          />
        )}
      </div>
    </div>,
    document.body
  );
}
