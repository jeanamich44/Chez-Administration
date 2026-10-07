"use client";

import {
  ArrowRight,
  Briefcase,
  CreditCard,
  FileCheck,
  FileText,
  Lock,
  Shield
} from "lucide-react";
import { useTelegram } from "@/components/TelegramContext";

/* ===================================================================== */

interface DocCategoryItem {
  id: string;
  name: string;
  badge: string;
  badgeColor: string;
  description: string;
  icon: typeof FileText;
  iconColor: string;
  iconBg: string;
  border: string;
  count: string;
}

const CATEGORIES: DocCategoryItem[] = [
  {
    id: "emploi",
    name: "Emploi & Salaires",
    badge: "BULLETINS",
    badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    description: "Bulletins de paie et fiches de salaire 1, 3, 6 et 12 mois.",
    icon: Briefcase,
    iconColor: "text-indigo-400",
    iconBg: "bg-indigo-500/10 border-indigo-500/20",
    border: "border-indigo-500/20 hover:border-indigo-400/40",
    count: "4 durées"
  },
  {
    id: "rib",
    name: "RIB Bancaires",
    badge: "17 BANQUES",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    description: "Relevés d'identité bancaire traditionnels et néobanques.",
    icon: CreditCard,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
    border: "border-emerald-500/20 hover:border-emerald-400/40",
    count: "17 banques"
  },
  {
    id: "releve",
    name: "Relevés Bancaires",
    badge: "COMPTES",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    description: "Relevés de compte bancaire La Banque Postale 1, 3, 6, 12 mois.",
    icon: FileText,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/10 border-blue-500/20",
    border: "border-blue-500/20 hover:border-blue-400/40",
    count: "4 durées"
  },
  {
    id: "facture",
    name: "Factures d'Achat",
    badge: "19 ENSEIGNES",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    description: "Factures Luxe, E-Commerce, Magasins et Domicile / Énergie.",
    icon: FileText,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/10 border-amber-500/20",
    border: "border-amber-500/20 hover:border-amber-400/40",
    count: "19 marques"
  },
  {
    id: "assurance",
    name: "Assurances Véhicules",
    badge: "AUTO & MOTO",
    badgeColor: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    description: "Justificatifs et mémos d'assurance véhicule (Axa, Maxance).",
    icon: Shield,
    iconColor: "text-sky-400",
    iconBg: "bg-sky-500/10 border-sky-500/20",
    border: "border-sky-500/20 hover:border-sky-400/40",
    count: "2 organismes"
  },
  {
    id: "justificatif",
    name: "Justificatifs & Attestations",
    badge: "OFFICIEL",
    badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    description: "Attestations de titulaire EDF, Direct Énergie, et conduite.",
    icon: FileCheck,
    iconColor: "text-rose-400",
    iconBg: "bg-rose-500/10 border-rose-500/20",
    border: "border-rose-500/20 hover:border-rose-400/40",
    count: "3 modèles"
  }
];

/* ===================================================================== */

interface GenerateDocsHubProps {
  onSelectCategory: (category: string) => void;
}

export default function GenerateDocsHub({ onSelectCategory }: GenerateDocsHubProps) {
  const { haptic, isCategoryActive } = useTelegram();

  return (
    <div className="space-y-3 pb-20 fade-in">
      <div className="px-1 mb-2">
        <h2 className="text-sm font-black italic text-white uppercase tracking-tight">
          Catalogue de documents
        </h2>
        <p className="text-[10px] text-white/40 font-medium leading-relaxed">
          Sélectionnez la catégorie de document à générer en PDF certifié
        </p>
      </div>

      <div className="space-y-2.5">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const active = isCategoryActive(cat.id);

          return (
            <button
              key={cat.id}
              type="button"
              disabled={!active}
              onClick={() => {
                haptic("selection");
                onSelectCategory(cat.id);
              }}
              className={`w-full bg-[#0f121d]/90 backdrop-blur-md p-3.5 rounded-2xl border ${cat.border} active:scale-[0.98] transition-all text-left flex items-center justify-between group shadow-sm ${
                !active ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={`w-10 h-10 rounded-xl ${cat.iconBg} flex items-center justify-center ${cat.iconColor} shrink-0 group-hover:scale-105 transition-transform`}
                >
                  <Icon size={18} />
                </div>

                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-xs font-black italic text-white leading-tight">
                      {cat.name}
                    </h3>
                    <span
                      className={`px-1.5 py-0.5 rounded-full border text-[7px] font-black tracking-wider uppercase shrink-0 ${cat.badgeColor}`}
                    >
                      {cat.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/40 font-medium leading-relaxed line-clamp-1">
                    {cat.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[9px] font-mono text-white/30 hidden sm:inline">{cat.count}</span>
                <div className="w-7 h-7 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-slate-950 transition-all shrink-0">
                  <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
