"use client";

import { useState, useMemo } from "react";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Lock,
  Search
} from "lucide-react";
import { useTelegram } from "@/components/TelegramContext";

/* ===================================================================== */

interface ReleveOption {
  slug: string;
  name: string;
  badge: string;
  description: string;
  logo: string;
  logoClass?: string;
  isAvailable: boolean;
}

const RELEVES: ReleveOption[] = [
  {
    slug: "lbp",
    name: "La Banque Postale",
    badge: "1 À 12 MOIS",
    description: "Relevé de compte CCP / Épargne avec profils d'activité",
    logo: "/logos/lbp.svg",
    logoClass: "scale-125 -translate-x-1",
    isAvailable: true
  },
  {
    slug: "ca",
    name: "Crédit Agricole",
    badge: "BIENTÔT",
    description: "Relevé de compte bancaire multimois",
    logo: "/logos/ca.svg",
    logoClass: "scale-110",
    isAvailable: false
  },
  {
    slug: "sg",
    name: "Société Générale",
    badge: "BIENTÔT",
    description: "Relevé de compte bancaire multimois",
    logo: "/logos/sg.svg",
    isAvailable: false
  },
  {
    slug: "cm",
    name: "Crédit Mutuel",
    badge: "BIENTÔT",
    description: "Relevé de compte bancaire multimois",
    logo: "/logos/cm.svg",
    logoClass: "scale-110",
    isAvailable: false
  },
  {
    slug: "bnp",
    name: "BNP Paribas",
    badge: "BIENTÔT",
    description: "Relevé de compte bancaire multimois",
    logo: "/logos/bnp.svg",
    logoClass: "scale-120",
    isAvailable: false
  },
  {
    slug: "boursobank",
    name: "BoursoBank",
    badge: "BIENTÔT",
    description: "Relevé de compte bancaire en ligne",
    logo: "/logos/boursobank.svg",
    logoClass: "scale-125",
    isAvailable: false
  }
];

/* ===================================================================== */

interface ReleveHubProps {
  onBack: () => void;
  onSelectBank: (slug: string) => void;
}

export default function ReleveHub({ onBack, onSelectBank }: ReleveHubProps) {
  const { haptic } = useTelegram();
  const [query, setQuery] = useState("");

  const filteredReleves = useMemo(() => {
    return RELEVES.filter(item => {
      return (
        !query.trim() ||
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase())
      );
    });
  }, [query]);

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
          Relevés Bancaires
        </h2>
        <p className="text-[10px] text-white/40 font-medium leading-relaxed">
          Sélectionnez la banque pour éditer un relevé de compte certifié
        </p>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Rechercher une banque..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-primary"
        />
      </div>

      <div className="space-y-2">
        {filteredReleves.map(item => (
          <button
            key={item.slug}
            type="button"
            disabled={!item.isAvailable}
            onClick={() => {
              if (!item.isAvailable) return;
              haptic("selection");
              onSelectBank(item.slug);
            }}
            className={`w-full bg-[#0f121d]/90 backdrop-blur-md p-3 rounded-2xl border transition-all text-left flex items-center justify-between group shadow-sm ${
              item.isAvailable
                ? "border-white/[0.08] hover:border-blue-500/40 active:scale-[0.98] cursor-pointer"
                : "border-white/5 opacity-50 cursor-not-allowed"
            }`}
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
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black text-white leading-tight truncate">
                    {item.name}
                  </h3>
                  <span
                    className={`px-1.5 py-0.2 rounded-md border text-[8px] font-mono font-bold shrink-0 ${
                      item.isAvailable
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : "bg-white/5 text-white/40 border-white/10"
                    }`}
                  >
                    {item.badge}
                  </span>
                </div>
                <p className="text-[10px] text-white/40 font-medium truncate mt-0.5">
                  {item.description}
                </p>
              </div>
            </div>

            <div className="shrink-0">
              {item.isAvailable ? (
                <div className="w-7 h-7 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-slate-950 transition-all">
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
