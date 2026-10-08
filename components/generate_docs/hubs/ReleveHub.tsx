"use client";

import React from "react";
import { ArrowRight, Lock, Landmark, Zap, ChevronLeft } from "lucide-react";

/* ===================================================================== */

interface BankOption {
  slug: string;
  name: string;
  badge?: string;
  description: string;
  logo: string;
  logoClass?: string;
  headerBg: string;
  isAvailable: boolean;
  category: "physique" | "neobanque";
}

const BANKS: BankOption[] = [
  {
    slug: "lbp",
    name: "La Banque Postale",
    badge: "FR",
    description: "• Générateur de Relevé La Banque Postale\n• 1, 3, 6 ou 12 mois au choix\n• Multi-comptes CCP / Épargne",
    logo: "/logos/lbp.svg",
    logoClass: "scale-125 -translate-x-2",
    headerBg: "bg-gradient-to-br from-blue-900/40 to-slate-950/80 border-blue-500/30",
    isAvailable: true,
    category: "physique"
  },
  {
    slug: "ca",
    name: "Crédit Agricole",
    badge: "FR",
    description: "• Générateur de Relevé Crédit Agricole\n• Multi-mois / Transactions",
    logo: "/logos/ca.svg",
    logoClass: "scale-110",
    headerBg: "bg-gradient-to-br from-emerald-900/40 to-slate-950/80 border-emerald-500/30",
    isAvailable: false,
    category: "physique"
  },
  {
    slug: "sg",
    name: "Société Générale",
    badge: "FR",
    description: "• Générateur de Relevé Société Générale\n• Multi-mois / Transactions",
    logo: "/logos/sg.svg",
    headerBg: "bg-gradient-to-br from-red-900/40 to-slate-950/80 border-red-500/30",
    isAvailable: false,
    category: "physique"
  },
  {
    slug: "cm",
    name: "Crédit Mutuel",
    badge: "FR",
    description: "• Générateur de Relevé Crédit Mutuel\n• Multi-mois / Transactions",
    logo: "/logos/cm.svg",
    logoClass: "scale-115",
    headerBg: "bg-gradient-to-br from-rose-900/40 to-slate-950/80 border-rose-500/30",
    isAvailable: false,
    category: "physique"
  },
  {
    slug: "cic",
    name: "CIC",
    badge: "FR",
    description: "• Générateur de Relevé CIC\n• Multi-mois / Transactions",
    logo: "/logos/cic.svg",
    logoClass: "scale-150",
    headerBg: "bg-gradient-to-br from-cyan-900/40 to-slate-950/80 border-cyan-500/30",
    isAvailable: false,
    category: "physique"
  },
  {
    slug: "bnp",
    name: "BNP Paribas",
    badge: "FR",
    description: "• Générateur de Relevé BNP Paribas\n• Multi-mois / Transactions",
    logo: "/logos/bnp.svg",
    logoClass: "scale-135",
    headerBg: "bg-gradient-to-br from-emerald-950/40 to-slate-950/80 border-emerald-500/30",
    isAvailable: false,
    category: "physique"
  },
  {
    slug: "ce",
    name: "Caisse d'Épargne",
    badge: "FR",
    description: "• Générateur de Relevé Caisse d'Épargne\n• Multi-mois / Transactions",
    logo: "/logos/caisse_depargne.svg",
    logoClass: "scale-120",
    headerBg: "bg-gradient-to-br from-red-950/40 to-slate-950/80 border-red-500/30",
    isAvailable: false,
    category: "physique"
  },
  {
    slug: "bp",
    name: "Banque Populaire",
    badge: "FR",
    description: "• Générateur de Relevé Banque Populaire\n• Multi-mois / Transactions",
    logo: "/logos/banque_populaire.svg",
    logoClass: "scale-90",
    headerBg: "bg-gradient-to-br from-cyan-950/40 to-slate-950/80 border-cyan-500/30",
    isAvailable: false,
    category: "physique"
  },
  {
    slug: "lcl",
    name: "LCL",
    badge: "FR",
    description: "• Générateur de Relevé LCL\n• Multi-mois / Transactions",
    logo: "/logos/lcl.svg",
    logoClass: "scale-135",
    headerBg: "bg-gradient-to-br from-blue-950/40 to-slate-950/80 border-blue-500/30",
    isAvailable: false,
    category: "physique"
  },
  {
    slug: "helios",
    name: "Helios",
    badge: "FR",
    description: "• Générateur de Relevé Helios\n• Multi-mois / Transactions",
    logo: "/logos/helios.svg",
    logoClass: "scale-110",
    headerBg: "bg-gradient-to-br from-cyan-900/40 to-slate-950/80 border-cyan-500/30",
    isAvailable: false,
    category: "neobanque"
  },
  {
    slug: "noelse",
    name: "Noelse",
    badge: "FR",
    description: "• Générateur de Relevé Noelse\n• Multi-mois / Transactions",
    logo: "/logos/noelse.svg",
    logoClass: "brightness-0 invert scale-130",
    headerBg: "bg-gradient-to-br from-indigo-950/40 to-slate-950/80 border-indigo-500/30",
    isAvailable: false,
    category: "neobanque"
  },
  {
    slug: "revolut",
    name: "Revolut",
    badge: "EU",
    description: "• Générateur de Relevé Revolut\n• Multi-mois / Transactions",
    logo: "/logos/revolut.svg",
    logoClass: "brightness-0 invert",
    headerBg: "bg-gradient-to-br from-purple-900/40 to-slate-950/80 border-purple-500/30",
    isAvailable: false,
    category: "neobanque"
  },
  {
    slug: "qonto",
    name: "Qonto",
    badge: "FR",
    description: "• Générateur de Relevé Qonto\n• Multi-mois / Transactions",
    logo: "/logos/qonto.svg",
    logoClass: "brightness-0 invert scale-130",
    headerBg: "bg-gradient-to-br from-violet-900/40 to-slate-950/80 border-violet-500/30",
    isAvailable: false,
    category: "neobanque"
  },
  {
    slug: "bfb",
    name: "BforBank",
    badge: "FR",
    description: "• Générateur de Relevé BforBank\n• Multi-mois / Transactions",
    logo: "/logos/bfb.svg",
    logoClass: "brightness-0 invert scale-75",
    headerBg: "bg-gradient-to-br from-blue-800/30 to-slate-950/80 border-blue-400/30",
    isAvailable: false,
    category: "neobanque"
  },
  {
    slug: "boursobank",
    name: "BoursoBank",
    badge: "FR",
    description: "• Générateur de Relevé BoursoBank\n• Multi-mois / Transactions",
    logo: "/logos/boursobank.svg",
    logoClass: "scale-135",
    headerBg: "bg-gradient-to-br from-pink-950/40 to-slate-950/80 border-pink-500/30",
    isAvailable: false,
    category: "neobanque"
  },
  {
    slug: "sumup",
    name: "SumUp",
    badge: "EU",
    description: "• Générateur de Relevé SumUp\n• Multi-mois / Transactions",
    logo: "/logos/sumup.svg",
    logoClass: "brightness-0 invert scale-115",
    headerBg: "bg-gradient-to-br from-slate-900/60 to-cyan-950/40 border-cyan-500/30",
    isAvailable: false,
    category: "neobanque"
  },
  {
    slug: "mypos",
    name: "MyPos",
    badge: "EU",
    description: "• Générateur de Relevé MyPos\n• Multi-mois / Transactions",
    logo: "/logos/mypos.svg",
    logoClass: "scale-115",
    headerBg: "bg-gradient-to-br from-blue-950/40 to-slate-950/80 border-blue-500/30",
    isAvailable: false,
    category: "neobanque"
  }
];

/* ===================================================================== */

interface ReleveHubProps {
  onSelectItem: (slug: string) => void;
  onBack: () => void;
}

export default function ReleveHub({ onSelectItem, onBack }: ReleveHubProps) {
  const physicalBanks = BANKS.filter((b) => b.category === "physique");
  const neobanks = BANKS.filter((b) => b.category === "neobanque");

  const renderBankCard = (bank: BankOption) => {
    const bankContent = (
      <>
        <div className={`w-full h-24 border rounded-xl p-3 flex items-center justify-center relative overflow-hidden mb-4 ${bank.headerBg}`}>
          <img
            src={bank.logo}
            alt={bank.name}
            className={`h-12 w-auto max-w-[90%] object-contain filter drop-shadow-md ${bank.logoClass || ""}`}
          />
        </div>

        <div className="relative z-10 w-full flex flex-col flex-grow">
          <h3 className="text-base font-black italic mb-2 text-white tracking-tight flex items-center gap-2">
            {bank.name}
            {!bank.isAvailable && <Lock size={14} className="text-amber-400/80" />}
          </h3>
          <div className="text-[11px] text-white/60 mb-4 font-medium whitespace-pre-line leading-relaxed">
            {bank.description}
          </div>

          {bank.isAvailable ? (
             <div className="mt-auto flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-primary">
               Générer Relevé <ArrowRight size={12} />
             </div>
          ) : (
             <div className="mt-auto flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-amber-400/80">
               <Lock size={12} className="text-amber-400" /> Indisponible
             </div>
          )}
        </div>
      </>
    );

    if (bank.isAvailable) {
      return (
        <div
          key={bank.slug}
          onClick={() => onSelectItem(bank.slug)}
          className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col items-start relative overflow-hidden active:scale-[0.98] transition-all cursor-pointer"
        >
          {bankContent}
        </div>
      );
    }

    return (
      <div
        key={bank.slug}
        className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex flex-col items-start relative overflow-hidden opacity-50 select-none"
      >
        {bankContent}
      </div>
    );
  };

  return (
    <main className="min-h-screen pt-4 pb-24 px-4 w-full max-w-md mx-auto">
      <div className="mb-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/40 hover:text-primary transition-colors mb-4"
        >
          <ChevronLeft size={16} /> Docs
        </button>
        <h1 className="text-2xl font-black italic text-white mb-2 leading-tight">
          GÉNÉRATEUR DE <br/><span className="text-primary">RELEVÉS</span>
        </h1>
        <p className="text-white/40 font-bold tracking-wider uppercase text-[10px]">
          Sélectionnez votre établissement bancaire
        </p>
      </div>

      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/10">
          <Landmark className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-black italic text-white tracking-wide">
            BANQUES PHYSIQUES
          </h2>
        </div>
        <div className="flex flex-col gap-3">
          {physicalBanks.map(renderBankCard)}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/10">
          <Zap className="w-5 h-5 text-indigo-400" />
          <h2 className="text-sm font-black italic text-white tracking-wide">
            NÉOBANQUES
          </h2>
        </div>
        <div className="flex flex-col gap-3">
          {neobanks.map(renderBankCard)}
        </div>
      </section>
    </main>
  );
}
