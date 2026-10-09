"use client";

import { useState } from "react";
import { MessageSquare, Bell, Copy, Shield, ChevronDown, ExternalLink } from "lucide-react";
import { useTelegram } from "@/components/TelegramContext";
import { useToast } from "@/components/NotificationToast";

/* ===================================================================== */

export default function SettingsView() {
  const { user, haptic, isAdmin, adminSlug, supportTelegram, supportTelegram2, channelTelegram, channelBackupTelegram } = useTelegram();
  const toast = useToast();
  const [adminOpen, setAdminOpen] = useState(true);
  const [communityOpen, setCommunityOpen] = useState(true);

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

  const handleOpenWebPanel = () => {
    haptic("impact");
    if (!adminSlug) {
      toast.error("Panel administrateur non configuré");
      return;
    }
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const cleanSlug = adminSlug.replace(/^\/+/, "");
    const targetUrl = `${origin}/${cleanSlug}`;
    const tg = typeof window !== "undefined" ? (window as any).Telegram?.WebApp : null;

    toast.success("Ouverture du panel web...");
    if (tg?.openLink) {
      tg.openLink(targetUrl);
    } else if (typeof window !== "undefined") {
      window.open(targetUrl, "_blank");
    }
  };

  const handleOpenTelegramLink = (url: string | null) => {
    if (!url) return;
    haptic("selection");
    const tg = typeof window !== "undefined" ? (window as any).Telegram?.WebApp : null;
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(url);
    } else if (tg?.openLink) {
      tg.openLink(url);
    } else if (typeof window !== "undefined") {
      window.open(url, "_blank");
    }
  };

  const supportHandle = supportTelegram
    ? supportTelegram.startsWith("@") ? supportTelegram : `@${supportTelegram}`
    : null;
  const supportUrl = supportTelegram
    ? `https://t.me/${supportTelegram.replace("@", "")}`
    : null;

  const supportHandle2 = supportTelegram2
    ? supportTelegram2.startsWith("@") ? supportTelegram2 : `@${supportTelegram2}`
    : null;
  const supportUrl2 = supportTelegram2
    ? `https://t.me/${supportTelegram2.replace("@", "")}`
    : null;

  const channelHandle = channelTelegram
    ? channelTelegram.startsWith("@") ? channelTelegram : `@${channelTelegram}`
    : null;
  const channelUrl = channelTelegram
    ? (channelTelegram.startsWith("http") ? channelTelegram : `https://t.me/${channelTelegram.replace("@", "")}`)
    : null;

  const channelBackupUrl = channelBackupTelegram
    ? (channelBackupTelegram.startsWith("http") ? channelBackupTelegram : `https://t.me/${channelBackupTelegram.replace("@", "")}`)
    : "https://t.me/+ia4UMfD2S91jNjY0";

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

      {isAdmin && (
        <div className="bg-[#0f121d]/80 backdrop-blur-md rounded-2xl p-4 border border-primary/20 space-y-2">
          <div
            onClick={() => {
              haptic("selection");
              setAdminOpen(!adminOpen);
            }}
            className="flex items-center justify-between cursor-pointer select-none"
          >
            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary/80">
              Espace Super-Admin
            </h3>
            <button
              type="button"
              className="p-1 rounded-md text-primary/60 hover:text-primary transition-colors cursor-pointer"
              aria-label={adminOpen ? "Replier" : "Déplier"}
            >
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${adminOpen ? "rotate-0" : "-rotate-90"}`}
              />
            </button>
          </div>
          {adminOpen && (
            <button
              type="button"
              onClick={handleOpenWebPanel}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all text-left gap-2.5 cursor-pointer mt-2"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 text-primary flex items-center justify-center shrink-0">
                  <Shield size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-white truncate">Panel d'Administration Web</p>
                  <p className="text-[10px] text-white/50 truncate">Ouvrir dans le navigateur externe</p>
                </div>
              </div>
              <span className="text-[9px] bg-primary text-slate-950 font-black px-2 py-1 rounded-full flex items-center gap-1 shrink-0 whitespace-nowrap">
                <span>NAVIGATEUR</span>
                <ExternalLink size={9} />
              </span>
            </button>
          )}
        </div>
      )}

      {(supportUrl || supportUrl2 || channelUrl || channelBackupUrl) && (
        <div className="bg-[#0f121d]/80 backdrop-blur-md rounded-2xl p-4 border border-white/[0.06] space-y-2">
          <div
            onClick={() => {
              haptic("selection");
              setCommunityOpen(!communityOpen);
            }}
            className="flex items-center justify-between cursor-pointer select-none"
          >
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/50">
              Assistance & Communauté
            </h3>
            <button
              type="button"
              className="p-1 rounded-md text-white/40 hover:text-white transition-colors cursor-pointer"
              aria-label={communityOpen ? "Replier" : "Déplier"}
            >
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${communityOpen ? "rotate-0" : "-rotate-90"}`}
              />
            </button>
          </div>

          {communityOpen && (
            <div className="space-y-2 pt-1">
              {supportUrl && (
                <button
                  type="button"
                  onClick={() => handleOpenTelegramLink(supportUrl)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                      <MessageSquare size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Support Technique</p>
                      <p className="text-[10px] text-white/40">Équipe admin 7j/7</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-primary font-bold">{supportHandle}</span>
                </button>
              )}

              {supportUrl2 && (
                <button
                  type="button"
                  onClick={() => handleOpenTelegramLink(supportUrl2)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                      <MessageSquare size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Support Technique</p>
                      <p className="text-[10px] text-white/40">Équipe admin 7j/7</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-primary font-bold">{supportHandle2}</span>
                </button>
              )}

              {channelUrl && (
                <button
                  type="button"
                  onClick={() => handleOpenTelegramLink(channelUrl)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors cursor-pointer text-left"
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
                </button>
              )}

              {channelBackupUrl && (
                <button
                  type="button"
                  onClick={() => handleOpenTelegramLink(channelBackupUrl)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                      <Shield size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Canal Backup</p>
                      <p className="text-[10px] text-white/40">Canal officiel de secours</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-rose-400 font-bold">Rejoindre</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
