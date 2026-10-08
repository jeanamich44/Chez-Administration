"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Crosshair, Download, Maximize2, Minus, Plus, RefreshCw, X } from "lucide-react";

const MIN_SCALE = 0.2;
const MAX_SCALE = 8;
const ZOOM_STEP = 1.25;

type View = { scale: number; x: number; y: number };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function DocumentPreviewViewer({
  url,
  title,
  onClose,
  onAction,
  actionLabel,
  isActionLoading,
  actionDisabled
}: {
  url: string | null;
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
    const pad = 24;
    const scale = Math.min((viewport.clientWidth - pad) / w, (viewport.clientHeight - pad) / h);
    const next = {
      scale,
      x: (viewport.clientWidth - w * scale) / 2,
      y: (viewport.clientHeight - h * scale) / 2
    };
    setViewBoth(next);
  }, [setViewBoth]);

  const recenter = useCallback(() => {
    const viewport = viewportRef.current;
    const { w, h } = naturalRef.current;
    const { scale } = viewRef.current;
    if (!viewport || w <= 0 || h <= 0) return;
    setViewBoth({
      scale,
      x: (viewport.clientWidth - w * scale) / 2,
      y: (viewport.clientHeight - h * scale) / 2
    });
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
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        zoomBy(ZOOM_STEP);
      } else if (e.key === "-") {
        e.preventDefault();
        zoomBy(1 / ZOOM_STEP);
      } else if (e.key === "0") {
        e.preventDefault();
        fitToView();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fitToView, requestClose, zoomBy]);

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

  if (!mounted || !url) return null;

  return createPortal(
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className={`fixed inset-0 z-[9999] flex flex-col bg-slate-950/95 backdrop-blur-md transition-opacity duration-260 ease-out select-none ${
        entered && !closing ? "opacity-100" : "opacity-0"
      }`}
      onContextMenu={event => event.preventDefault()}
    >
      <div
        className={`shrink-0 border-b border-white/10 bg-slate-950/90 backdrop-blur-md px-3 sm:px-5 py-2 sm:py-2.5 transition-all duration-300 ease-out ${
          entered && !closing ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
        }`}
      >
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
          <div className="min-w-0 max-w-[45%] sm:max-w-none order-1">
            <p className="text-xs sm:text-sm font-black italic text-white truncate tracking-tight">{title}</p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 order-2 sm:order-3">
            <div className="flex items-center rounded-lg bg-white/5 border border-white/10 p-0.5">
              <button
                type="button"
                onClick={() => zoomBy(1 / ZOOM_STEP)}
                className="w-7 h-7 rounded-md text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors"
                aria-label="Dézoomer"
              >
                <Minus size={14} />
              </button>
              <button
                type="button"
                onClick={fitToView}
                className="px-1.5 h-7 rounded-md text-[11px] font-mono font-bold text-white/80 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
                aria-label="Ajuster à l'écran"
                title="Ajuster"
              >
                {percent}%
              </button>
              <button
                type="button"
                onClick={() => zoomBy(ZOOM_STEP)}
                className="w-7 h-7 rounded-md text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors"
                aria-label="Zoomer"
              >
                <Plus size={14} />
              </button>
            </div>
            <button
              type="button"
              onClick={fitToView}
              className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors"
              title="Ajuster à l'écran"
              aria-label="Ajuster"
            >
              <Maximize2 size={13} />
            </button>
            <button
              type="button"
              onClick={requestClose}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer ml-0.5 transition-colors"
              aria-label="Fermer"
              title="Fermer"
            >
              <X size={15} />
            </button>
          </div>

          {onAction ? (
            <button
              type="button"
              onClick={onAction}
              disabled={isActionLoading || actionDisabled}
              className="h-9 px-4 rounded-xl bg-primary text-slate-950 font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md shadow-primary/20 cursor-pointer w-full sm:w-auto order-3 sm:order-2 shrink-0"
            >
              {isActionLoading ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : (
                <Download size={13} />
              )}
              <span className="truncate">{actionLabel || "Télécharger"}</span>
            </button>
          ) : null}
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
        {!ready ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold uppercase tracking-widest text-white/40">
            Chargement de l'aperçu…
          </div>
        ) : null}
        <img
          src={url}
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
      </div>
    </div>,
    document.body
  );
}
