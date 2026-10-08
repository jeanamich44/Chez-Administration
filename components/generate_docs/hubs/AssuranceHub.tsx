"use client";

import React from "react";
import { ArrowRight, Shield, ChevronLeft } from "lucide-react";

/* ===================================================================== */

interface InsuranceOption {
  slug: string;
  name: string;
  description: string;
  logo: string;
  logoClass?: string;
  headerBg: string;
  isAvailable: boolean;
}

const INSURANCES: InsuranceOption[] = [
  {
    slug: "maxance",
    name: "Maxance Assurances",
    description: "• Générateur d'Attestation Maxance\n• Format PDF / Preview Gratuite\n• 13 Champs à remplir",
    logo: "/logos/maxance.svg",
    logoClass: "scale-90",
    headerBg: "bg-gradient-to-br from-red-950/50 to-slate-950/80 border-rose-500/30",
    isAvailable: true,
  },
  {
    slug: "axa",
    name: "AXA Assurances",
    description: "• Mémo Véhicule Assuré AXA\n• Format PDF / Preview Gratuite\n• Conforme FVA 2024+",
    logo: "/logos/axa.svg?v=2",
    logoClass: "scale-90",
    headerBg: "bg-gradient-to-br from-blue-950/50 to-slate-950/80 border-blue-500/30",
    isAvailable: true,
  }
];

/* ===================================================================== */

interface AssuranceHubProps {
  onSelectItem: (slug: string) => void;
  onBack: () => void;
}

export default function AssuranceHub({ onSelectItem, onBack }: AssuranceHubProps) {
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
          GÉNÉRATEUR D'<br/><span className="text-primary">ASSURANCE</span>
        </h1>
        <p className="text-white/40 font-bold tracking-wider uppercase text-[10px]">
          Sélectionnez votre compagnie d'assurance
        </p>
      </div>

      <section>
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/10">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-black italic text-white tracking-wide">
            COMPAGNIES D'ASSURANCE
          </h2>
        </div>
        <div className="flex flex-col gap-3">
          {[...INSURANCES].sort((a, b) => a.name.localeCompare(b.name, "fr")).map((item) => (
            <div
              key={item.slug}
              onClick={() => onSelectItem(item.slug)}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col items-start relative overflow-hidden active:scale-[0.98] transition-all cursor-pointer"
            >
              <div className={`w-full h-24 border rounded-xl p-3 flex items-center justify-center relative overflow-hidden mb-4 ${item.headerBg}`}>
                <img
                  src={item.logo}
                  alt={item.name}
                  className={`h-12 w-auto max-w-[90%] object-contain filter drop-shadow-md ${item.logoClass || ""}`}
                />
              </div>

              <div className="relative z-10 w-full flex flex-col flex-grow">
                <h3 className="text-base font-black italic mb-2 text-white tracking-tight flex items-center gap-2">
                  {item.name}
                </h3>
                <div className="text-[11px] text-white/60 mb-4 font-medium whitespace-pre-line leading-relaxed">
                  {item.description}
                </div>

                <div className="mt-auto flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-primary">
                  Générer l'Attestation <ArrowRight size={12} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
