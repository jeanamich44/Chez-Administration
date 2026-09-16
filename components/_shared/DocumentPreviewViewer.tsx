"use client"
import { useEffect } from 'react';

/* ========================================= */

interface DocumentPreviewViewerProps {
  imageUrl: string | null;
  title?: string;
  onClose: () => void;
  onAction?: () => void;
  isActionLoading?: boolean;
  actionLabel?: string;
}

/* ========================================= */

export default function DocumentPreviewViewer({ imageUrl, title, onClose, onAction, isActionLoading, actionLabel }: DocumentPreviewViewerProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col fade-in">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="font-black italic uppercase tracking-tight text-white">{title || 'Aperçu'}</h3>
        <button
          onClick={onClose}
          className="bg-white/10 border border-white/10 rounded-xl w-10 h-10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          X
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <img
          src={imageUrl}
          alt="Aperçu du document"
          className="max-w-full max-h-[70vh] object-contain rounded-lg"
        />
      </div>

      {onAction && actionLabel && (
        <div className="p-4 border-t border-white/10 bg-slate-900/50 flex justify-end">
          <button
            onClick={onAction}
            disabled={isActionLoading}
            className="bg-primary text-slate-950 font-black text-xs uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isActionLoading ? 'Chargement...' : actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}
