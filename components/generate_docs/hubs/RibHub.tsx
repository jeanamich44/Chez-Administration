"use client";

import { useState, useMemo } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Landmark,
  Search,
  Zap
} from "lucide-react";
import { useTelegram } from "@/components/TelegramContext";

/* ===================================================================== */

export type RibCategory = "physique" | "neobanque";

interface BankOption {
  slug: string;
  name: string;
  badge: string;
  description: string;
  logo: string;
  logoClass?: string;
  category: RibCategory;
}

const BANKS: BankOption[] = [
  {
    slug: "lbp",
    name: "La Banque Postale",
    badge: "FR",
    description: "11 champs • Format PDF officiel",
    logo: "/logos/lbp.svg",
    logoClass: "scale-125 -translate-x-1",
    category: "physique"
  },
  {
    slug: "ca",
    name: "Crédit Agricole",
    badge: "FR",
    description: "15 champs • Format PDF officiel",
    logo: "/logos/ca.svg",
    logoClass: "scale-110",
    category: "physique"
  },
  {
    slug: "sg",
    name: "Société Générale",
    badge: "FR",
    description: "10 champs • Format PDF officiel",
    logo: "/logos/sg.svg",
    category: "physique"
  },
  {
    slug: "cm",
    name: "Crédit Mutuel",
    badge: "FR",
    description: "11 champs • Format PDF officiel",
    logo: "/logos/cm.svg",
    logoClass: "scale-110",
    category: "physique"
  },
  {
    slug: "cic",
    name: "CIC",
    badge: "FR",
    description: "11 champs • Format PDF officiel",
    logo: "/logos/cic.svg",
    logoClass: "scale-135",
    category: "physique"
  },
  {
    slug: "bnp",
    name: "BNP Paribas",
    badge: "FR",
    description: "10 champs • Format PDF officiel",
    logo: "/logos/bnp.svg",
    logoClass: "scale-120",
    category: "physique"
  },
  {
    slug: "ce",
    name: "Caisse d'Épargne",
    badge: "FR",
    description: "10 champs • Format PDF officiel",
    logo: "/logos/caisse_depargne.svg",
    logoClass: "scale-115",
    category: "physique"
  },
  {
    slug: "bp",
    name: "Banque Populaire",
    badge: "FR",
    description: "10 champs • Format PDF officiel",
    logo: "/logos/banque_populaire.svg",
    logoClass: "scale-90",
    category: "physique"
  },
  {
    slug: "lcl",
    name: "LCL",
    badge: "FR",
    description: "8 champs • Format PDF officiel",
    logo: "/logos/lcl.svg",
    logoClass: "scale-120",
    category: "physique"
  },
  {
    slug: "helios",
    name: "Helios",
    badge: "FR",
    description: "9 champs • Néobanque éthique",
    logo: "/logos/helios.svg",
    logoClass: "scale-110",
    category: "neobanque"
  },
  {
    slug: "noelse",
    name: "Noelse",
    badge: "FR",
    description: "7 champs • Néobanque moderne",
    logo: "/logos/noelse.svg",
    logoClass: "scale-120",
    category: "neobanque"
  },
  {
    slug: "revolut",
    name: "Revolut",
    badge: "EU",
    description: "8 champs • Format multidevises",
    logo: "/logos/revolut.svg",
    category: "neobanque"
  },
  {
    slug: "qonto",
    name: "Qonto",
    badge: "FR",
    description: "9 champs • Compte professionnel",
    logo: "/logos/qonto.svg",
    logoClass: "scale-125",
    category: "neobanque"
  },
  {
    slug: "bfb",
    name: "BforBank",
    badge: "FR",
    description: "8 champs • Banque 100% en ligne",
    logo: "/logos/bfb.svg",
    logoClass: "scale-75",
    category: "neobanque"
  },
  {
    slug: "boursobank",
    name: "BoursoBank",
    badge: "FR",
    description: "9 champs • Leader banque en ligne",
    logo: "/logos/boursobank.svg",
    logoClass: "scale-125",
    category: "neobanque"
  },
  {
    slug: "sumup",
    name: "SumUp",
    badge: "EU",
    description: "9 champs • Compte pro & encaissements",
    logo: "/logos/sumup.svg",
    logoClass: "scale-110",
    category: "neobanque"
  },
  {
    slug: "mypos",
    name: "MyPos",
    badge: "EU",
    description: "10 champs • Solution de paiement",
    logo: "/logos/mypos.svg",
    logoClass: "scale-110",
    category: "neobanque"
  }
];

/* ===================================================================== */

interface RibHubProps {
  onBack: () => void;
  onSelectBank: (slug: string) => void;
}

export default function RibHub({ onBack, onSelectBank }: RibHubProps) {
  const { haptic } = useTelegram();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | RibCategory>("all");

  const filteredBanks = useMemo(() => {
    return BANKS.filter(item => {
      const matchCategory = selectedCategory === "all" || item.category === selectedCategory;
      const matchQuery =
        !query.trim() ||
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase());
      return matchCategory && matchQuery;
    });
  }, [query, selectedCategory]);

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
        <span className="text-[10px] font-mono text-white/40 uppercase">
          {filteredBanks.length} banque{filteredBanks.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="px-1">
        <h2 className="text-sm font-black italic text-white uppercase tracking-tight">
          RIB Bancaires
        </h2>
        <p className="text-[10px] text-white/40 font-medium leading-relaxed">
          Sélectionnez l'établissement pour éditer votre Relevé d'Identité Bancaire
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

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: "all", label: "Toutes (17)" },
          { id: "physique", label: "Traditionnelles (9)", icon: Landmark },
          { id: "neobanque", label: "Néobanques (8)", icon: Zap }
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                haptic("selection");
                setSelectedCategory(tab.id as "all" | RibCategory);
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

      <div className="space-y-2">
        {filteredBanks.map(item => (
          <button
            key={item.slug}
            type="button"
            onClick={() => {
              haptic("selection");
              onSelectBank(item.slug);
            }}
            className="w-full bg-[#0f121d]/90 backdrop-blur-md p-3 rounded-2xl border border-white/[0.08] hover:border-primary/40 active:scale-[0.98] transition-all text-left flex items-center justify-between group shadow-sm cursor-pointer"
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
                  <span className="px-1.5 py-0.2 rounded-md bg-white/5 border border-white/10 text-[8px] font-mono font-bold text-white/60 shrink-0">
                    {item.badge}
                  </span>
                </div>
                <p className="text-[10px] text-white/40 font-medium truncate mt-0.5">
                  {item.description}
                </p>
              </div>
            </div>

            <div className="w-7 h-7 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-slate-950 transition-all shrink-0">
              <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
