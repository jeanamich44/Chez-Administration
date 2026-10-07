"use client";

import { useState, useMemo } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Flame,
  GraduationCap
} from "lucide-react";
import { useTelegram } from "@/components/TelegramContext";

/* ===================================================================== */

export type JustificatifCategory = "domicile" | "formation";

interface JustificatifOption {
  slug: string;
  name: string;
  badge: string;
  description: string;
  logo: string;
  logoClass?: string;
  category: JustificatifCategory;
}

const JUSTIFICATIFS: JustificatifOption[] = [
  {
    slug: "attestation_direct_energie",
    name: "Direct Énergie",
    badge: "DOMICILE",
    description: "Attestation de titulaire de contrat Direct Énergie",
    logo: "/logos/direct_energie.svg",
    category: "domicile"
  },
  {
    slug: "attestation_edf",
    name: "EDF",
    badge: "DOMICILE",
    description: "Attestation de titulaire de contrat EDF avec PDL",
    logo: "/logos/edf.svg",
    category: "domicile"
  },
  {
    slug: "conduite_heures",
    name: "Heures de Conduite",
    badge: "AUTO-ÉCOLE",
    description: "Relevé d'heures et livret de conduite automobile",
    logo: "/logos/cfrvitry.png",
    category: "formation"
  }
];

/* ===================================================================== */

interface JustificatifHubProps {
  onBack: () => void;
  onSelectDoc: (slug: string) => void;
}

export default function JustificatifHub({ onBack, onSelectDoc }: JustificatifHubProps) {
  const { haptic } = useTelegram();
  const [selectedCategory, setSelectedCategory] = useState<"all" | JustificatifCategory>("all");

  const filteredDocs = useMemo(() => {
    return JUSTIFICATIFS.filter(item => {
      return selectedCategory === "all" || item.category === selectedCategory;
    });
  }, [selectedCategory]);

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
          Justificatifs & Attestations
        </h2>
        <p className="text-[10px] text-white/40 font-medium leading-relaxed">
          Sélectionnez l'attestation ou le justificatif officiel à générer
        </p>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: "all", label: "Tous" },
          { id: "domicile", label: "Domicile", icon: Flame },
          { id: "formation", label: "Formation", icon: GraduationCap }
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                haptic("selection");
                setSelectedCategory(tab.id as "all" | JustificatifCategory);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-colors flex items-center gap-1.5 ${
                isSelected
                  ? "bg-primary text-slate-950 shadow-md shadow-primary/20"
                  : "bg-white/5 text-white/60 border border-white/5 hover:border-white/10"
              }`}
            >
              {Icon && <Icon size={12} />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-2.5">
        {filteredDocs.map(item => (
          <button
            key={item.slug}
            type="button"
            onClick={() => {
              haptic("selection");
              onSelectDoc(item.slug);
            }}
            className="w-full bg-[#0f121d]/90 backdrop-blur-md p-3.5 rounded-2xl border border-white/[0.08] hover:border-rose-500/40 active:scale-[0.98] transition-all text-left flex items-center justify-between group shadow-sm cursor-pointer"
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
                  <span className="px-1.5 py-0.5 rounded-full border text-[7px] font-black tracking-wider uppercase shrink-0 bg-rose-500/10 text-rose-400 border-rose-500/20">
                    {item.badge}
                  </span>
                </div>
                <p className="text-[10px] text-white/40 font-medium line-clamp-1">
                  {item.description}
                </p>
              </div>
            </div>

            <div className="w-7 h-7 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center text-rose-400 group-hover:bg-rose-500 group-hover:text-slate-950 transition-all shrink-0">
              <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
