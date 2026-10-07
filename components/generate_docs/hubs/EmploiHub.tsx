"use client";

import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  FileCheck,
  FileText,
  Lock
} from "lucide-react";
import { useTelegram } from "@/components/TelegramContext";

/* ===================================================================== */

interface EmploiDocOption {
  slug: string;
  name: string;
  badge: string;
  description: string;
  logo: string;
  isAvailable: boolean;
}

const EMPLOI_DOCS: EmploiDocOption[] = [
  {
    slug: "fiche_de_paie",
    name: "Fiche de Paie",
    badge: "1 À 12 MOIS",
    description: "Bulletin de paie conforme avec cumuls et calculs automatiques",
    logo: "/logos/fiche_de_paie.svg",
    isAvailable: true
  },
  {
    slug: "contrat_travail",
    name: "Contrat de Travail",
    badge: "BIENTÔT",
    description: "Contrat CDI ou CDD avec clauses légales",
    logo: "/logos/fiche_de_paie.svg",
    isAvailable: false
  },
  {
    slug: "attestation_france_travail",
    name: "Attestation France Travail",
    badge: "BIENTÔT",
    description: "Attestation employeur pôle emploi et fin de contrat",
    logo: "/logos/fiche_de_paie.svg",
    isAvailable: false
  }
];

/* ===================================================================== */

interface EmploiHubProps {
  onBack: () => void;
  onSelectDoc: (slug: string) => void;
}

export default function EmploiHub({ onBack, onSelectDoc }: EmploiHubProps) {
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
          Emploi & Travail
        </h2>
        <p className="text-[10px] text-white/40 font-medium leading-relaxed">
          Sélectionnez un document professionnel à générer au format PDF
        </p>
      </div>

      <div className="space-y-2.5">
        {EMPLOI_DOCS.map(item => (
          <button
            key={item.slug}
            type="button"
            disabled={!item.isAvailable}
            onClick={() => {
              if (!item.isAvailable) return;
              haptic("selection");
              onSelectDoc(item.slug);
            }}
            className={`w-full bg-[#0f121d]/90 backdrop-blur-md p-3.5 rounded-2xl border transition-all text-left flex items-center justify-between group shadow-sm ${
              item.isAvailable
                ? "border-white/[0.08] hover:border-indigo-500/40 active:scale-[0.98] cursor-pointer"
                : "border-white/5 opacity-50 cursor-not-allowed"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Briefcase size={18} />
              </div>

              <div className="min-w-0 flex-1 pr-2">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-xs font-black text-white leading-tight truncate">
                    {item.name}
                  </h3>
                  <span
                    className={`px-1.5 py-0.5 rounded-full border text-[7px] font-black tracking-wider uppercase shrink-0 ${
                      item.isAvailable
                        ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                        : "bg-white/5 text-white/40 border-white/10"
                    }`}
                  >
                    {item.badge}
                  </span>
                </div>
                <p className="text-[10px] text-white/40 font-medium line-clamp-1">
                  {item.description}
                </p>
              </div>
            </div>

            <div className="shrink-0">
              {item.isAvailable ? (
                <div className="w-7 h-7 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-slate-950 transition-all">
                  <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-center text-white/30">
                  <Lock size={12} />
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
