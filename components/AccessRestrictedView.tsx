"use client";

import { Lock, Send, ShieldAlert } from "lucide-react";

/* ===================================================================== */

export default function AccessRestrictedView() {
  return (
    <div className="min-h-screen bg-[#060810] text-white flex flex-col justify-between px-4 py-8">
      <div className="w-full max-w-sm mx-auto flex items-center justify-between pb-6 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xs">
            CA
          </div>
          <div>
            <h1 className="text-sm font-black italic tracking-tight text-white flex items-center gap-1.5">
              CHEZ <span className="text-primary">ADMINISTRATION</span>
            </h1>
            <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest">
              Telegram Mini App
            </p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-sm mx-auto my-auto py-10 space-y-6 text-center fade-in">
        <div className="relative mx-auto w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-2xl shadow-primary/20">
          <ShieldAlert size={38} className="animate-pulse" />
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-[#111422] border border-white/10 flex items-center justify-center text-amber-400">
            <Lock size={13} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-400 text-[10px] font-black tracking-widest uppercase">
            Accès Sécurisé Requis
          </div>
          <h2 className="text-xl font-black italic tracking-tight text-white">
            Accès Réservé à Telegram
          </h2>
          <p className="text-xs text-white/60 max-w-xs mx-auto leading-relaxed">
            Cette application est une Telegram Mini App sécurisée. Elle doit être ouverte exclusivement depuis notre bot officiel Telegram pour vous authentifier.
          </p>
        </div>

        <div className="pt-2">
          <a
            href="https://t.me/ChezAdministrationBot"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-12 rounded-2xl bg-primary text-slate-950 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-[0.99] transition-all"
          >
            <Send size={14} />
            <span>Ouvrir dans Telegram</span>
          </a>
        </div>

        <div className="pt-4 border-t border-white/5">
          <p className="text-[10px] text-white/30 font-medium">
            Signature cryptographique HMAC-SHA256 requise
          </p>
        </div>
      </div>

      <div className="w-full max-w-sm mx-auto text-center">
        <p className="text-[10px] text-white/20 font-bold uppercase tracking-wider">
          © Chez Administration • Tous droits réservés
        </p>
      </div>
    </div>
  );
}
