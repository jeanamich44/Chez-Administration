"use client";

import { useTelegram } from "@/components/TelegramContext";
import { Megaphone, Info, AlertTriangle, AlertCircle, Sparkles } from "lucide-react";

/* ===================================================================== */

const STYLE_CONFIG: Record<
  string,
  {
    bg: string;
    border: string;
    text: string;
    icon: any;
    iconColor: string;
    badgeBg: string;
    label: string;
  }
> = {
  standard: {
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    text: "text-indigo-200",
    icon: Megaphone,
    iconColor: "text-indigo-400",
    badgeBg: "bg-indigo-500/20 border-indigo-500/30 text-indigo-300",
    label: "FLASH",
  },
  info: {
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    text: "text-sky-200",
    icon: Info,
    iconColor: "text-sky-400",
    badgeBg: "bg-sky-500/20 border-sky-500/30 text-sky-300",
    label: "INFO",
  },
  warning: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-200",
    icon: AlertTriangle,
    iconColor: "text-amber-400",
    badgeBg: "bg-amber-500/20 border-amber-500/30 text-amber-300",
    label: "ATTENTION",
  },
  danger: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    text: "text-rose-200",
    icon: AlertCircle,
    iconColor: "text-rose-400",
    badgeBg: "bg-rose-500/20 border-rose-500/30 text-rose-300",
    label: "ALERTE",
  },
  success: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-200",
    icon: Sparkles,
    iconColor: "text-emerald-400",
    badgeBg: "bg-emerald-500/20 border-emerald-500/30 text-emerald-300",
    label: "OFFRE",
  },
};

/* ===================================================================== */

export default function AnnouncementBanner() {
  const { marqueeText, marqueeStyle } = useTelegram();

  if (!marqueeText || !marqueeText.trim()) {
    return null;
  }

  const cleanText = marqueeText.trim();
  const cfg = STYLE_CONFIG[marqueeStyle] || STYLE_CONFIG.standard;
  const Icon = cfg.icon;

  return (
    <div
      className={`w-full mb-3 px-2.5 py-1.5 rounded-xl border ${cfg.bg} ${cfg.border} backdrop-blur-md flex items-center gap-2 overflow-hidden shadow-sm`}
    >
      <div className="flex items-center gap-1.5 shrink-0">
        <div
          className={`w-5 h-5 rounded-md flex items-center justify-center border ${cfg.badgeBg} shrink-0`}
        >
          <Icon size={11} className={cfg.iconColor} />
        </div>
        <span
          className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${cfg.badgeBg} shrink-0`}
        >
          {cfg.label}
        </span>
      </div>

      <div className="flex-1 overflow-hidden relative select-none">
        <div className="animate-marquee items-center gap-6">
          <span className={`text-[11px] font-semibold tracking-tight ${cfg.text}`}>
            {cleanText}
          </span>
          <span className="text-[10px] opacity-40 text-white">•</span>
          <span className={`text-[11px] font-semibold tracking-tight ${cfg.text}`}>
            {cleanText}
          </span>
          <span className="text-[10px] opacity-40 text-white">•</span>
          <span className={`text-[11px] font-semibold tracking-tight ${cfg.text}`}>
            {cleanText}
          </span>
          <span className="text-[10px] opacity-40 text-white">•</span>
          <span className={`text-[11px] font-semibold tracking-tight ${cfg.text}`}>
            {cleanText}
          </span>
        </div>
      </div>
    </div>
  );
}
