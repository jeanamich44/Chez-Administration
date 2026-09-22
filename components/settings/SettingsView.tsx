"use client";

import { User, MessageSquare, Bell, Copy } from "lucide-react";
import { useTelegram } from "@/components/TelegramContext";
import { useToast } from "@/components/NotificationToast";

/* ===================================================================== */

export default function SettingsView() {
  const { user, haptic } = useTelegram();
  const toast = useToast();

  const fullName = user
    ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username || ""
    : "";
  const username = user?.username ? `@${user.username}` : "";
  const userId = user?.id ? String(user.id) : "";
  const initials = (user?.first_name?.[0] || user?.username?.[0] || "").toUpperCase();

  const handleCopyId = () => {
    if (!userId) return;
    haptic("notification");
    navigator.clipboard.writeText(userId);
    toast.success("ID Telegram copié !");
  };

  return (
    <div className="space-y-4 pb-24 fade-in">
      <div className="bg-[#0f121d]/80 backdrop-blur-md rounded-3xl p-5 border border-white/[0.08] flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-sky-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-primary/20 shrink-0">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-black text-white truncate">{fullName}</h2>
          <p className="text-xs text-primary font-bold">{username}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-white/40 font-mono">ID: {userId}</span>
            <button
              type="button"
              onClick={handleCopyId}
              className="p-1 rounded text-white/40 hover:text-white"
            >
              <Copy size={11} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-[#0f121d]/80 backdrop-blur-md rounded-2xl p-4 border border-white/[0.06] space-y-2">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">
          Assistance & Communauté
        </h3>

        <a
          href="https://t.me/RheyySupport"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => haptic("selection")}
          className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <MessageSquare size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Support Technique</p>
              <p className="text-[10px] text-white/40">Équipe d'astreinte 7j/7</p>
            </div>
          </div>
          <span className="text-[10px] text-primary font-bold">@RheyySupport</span>
        </a>

        <a
          href="https://t.me/ChezRheyyNews"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => haptic("selection")}
          className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Bell size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Canal d'annonces</p>
              <p className="text-[10px] text-white/40">Mises à jour et nouveautés</p>
            </div>
          </div>
          <span className="text-[10px] text-amber-400 font-bold">Rejoindre</span>
        </a>
      </div>
    </div>
  );
}
