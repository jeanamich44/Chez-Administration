"use client";

import {
  ArrowLeft,
  ArrowRight,
  Shield
} from "lucide-react";
import { useTelegram } from "@/components/TelegramContext";

/* ===================================================================== */

interface AssuranceOption {
  slug: string;
  name: string;
  badge: string;
  description: string;
  logo: string;
  logoClass?: string;
}

const ASSURANCES: AssuranceOption[] = [
  {
    slug: "maxance",
    name: "Maxance Assurances",
    badge: "MÉMO",
    description: "Attestation et mémo véhicule assuré Maxance",
    logo: "/logos/maxance.svg",
    logoClass: "scale-90"
  },
  {
    slug: "axa",
    name: "AXA Assurances",
    badge: "FVA 2024+",
    description: "Mémo véhicule assuré AXA conforme fichier des véhicules assurés",
    logo: "/logos/axa.svg",
    logoClass: "scale-90"
  }
];

/* ===================================================================== */

interface AssuranceHubProps {
  onBack: () => void;
  onSelectAssurance: (slug: string) => void;
}

export default function AssuranceHub({ onBack, onSelectAssurance }: AssuranceHubProps) {
  const { haptic } = useTelegram();

  return (
    <div className="space-y-3 pb-20 fade-in">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-white/60 hover:text-white transition-colors bg-white/[0.04] border border-white/10 px-3 py-1.5 rounded-xl active:scale-95"
        >
          <ArrowLeft size={13} />
          <span>Catégories</span>
        </button>
      </div>

      <div className="px-1">
        <h2 className="text-sm font-black italic text-white uppercase tracking-tight">
          Assurances Véhicules
        </h2>
        <p className="text-[10px] text-white/40 font-medium leading-relaxed">
          Sélectionnez la compagnie pour éditer votre attestation d'assurance
        </p>
      </div>

      <div className="space-y-2.5">
        {ASSURANCES.map(item => (
          <button
            key={item.slug}
            type="button"
            onClick={() => {
              haptic("selection");
              onSelectAssurance(item.slug);
            }}
            className="w-full bg-[#0f121d]/90 backdrop-blur-md p-3.5 rounded-2xl border border-white/[0.08] hover:border-sky-500/40 active:scale-[0.98] transition-all text-left flex items-center justify-between group shadow-sm cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-12 h-10 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 overflow-hidden border border-white/20">
                <img
                  src={item.logo}
                  alt={item.name}
                  className={`max-h-full max-w-full object-contain ${item.logoClass || ""}`}
                />
              </div>

              <div className="min-w-0 flex-1 pr-2">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-xs font-black text-white leading-tight truncate">
                    {item.name}
                  </h3>
                  <span className="px-1.5 py-0.5 rounded-full border text-[7px] font-black tracking-wider uppercase shrink-0 bg-sky-500/10 text-sky-400 border-sky-500/20">
                    {item.badge}
                  </span>
                </div>
                <p className="text-[10px] text-white/40 font-medium line-clamp-1">
                  {item.description}
                </p>
              </div>
            </div>

            <div className="w-7 h-7 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center text-sky-400 group-hover:bg-sky-500 group-hover:text-slate-950 transition-all shrink-0">
              <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
