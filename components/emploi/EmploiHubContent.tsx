"use client";

import React from 'react';
import { ArrowLeft, ArrowRight, Lock } from 'lucide-react';
import { BRAND_CATALOG } from '@/data/brands';

interface EmploiHubContentProps {
  onNavigate: (slug: string) => void;
  onBack: () => void;
}

const EMPLOI_DOCS = [
  { ...BRAND_CATALOG["fiche_de_paie"], badge: "OFFICIEL", isAvailable: true },
  { ...BRAND_CATALOG["contrat_travail"], badge: "CDI / CDD", isAvailable: false },
  { ...BRAND_CATALOG["attestation_france_travail"], badge: "EMPLOYEUR", isAvailable: false }
];

export default function EmploiHubContent({ onNavigate, onBack }: EmploiHubContentProps) {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors cursor-pointer text-xs font-black uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Documents</span>
        </button>
      </div>

      <div className="text-center space-y-4">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black italic uppercase tracking-tight text-white">
          EMPLOI ET <span className="text-primary">TRAVAIL</span>
        </h1>
        <p className="text-white/60 font-bold tracking-widest uppercase text-xs sm:text-sm">
          Sélectionnez un type de document professionnel à générer au format PDF
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {EMPLOI_DOCS.map((doc) => (
          <div
            key={doc.slug}
            onClick={() => doc.isAvailable && onNavigate(doc.slug)}
            className={`glass p-4 md:p-6 flex flex-col items-start relative overflow-hidden transition-all duration-300 rounded-3xl ${
              doc.isAvailable ? "hover:border-primary/50 cursor-pointer group" : "opacity-50 border-white/5 select-none cursor-not-allowed"
            }`}
          >
            {doc.badge && (
              <div className="absolute top-6 right-6 z-10 bg-black/60 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full text-[10px] font-black text-primary uppercase tracking-wider">
                {doc.badge}
              </div>
            )}

            <div className={`w-full h-32 border rounded-2xl p-4 flex items-center justify-center relative overflow-hidden backdrop-blur-md shadow-xl mb-6 transition-all duration-300 ${doc.headerBg}`}>
              <img
                src={doc.logo}
                alt={doc.name}
                className={`h-20 md:h-22 w-auto max-w-[92%] max-h-[85%] object-contain filter drop-shadow-lg ${doc.logoClass || ""}`}
              />
            </div>

            <div className="relative z-10 w-full flex flex-col flex-grow">
              <h3 className="text-2xl font-black italic mb-3 text-white tracking-tight flex items-center gap-2">
                {doc.name}
                {!doc.isAvailable && <Lock size={16} className="text-amber-400/80" />}
              </h3>

              <div className="text-xs text-white/60 mb-6 font-medium whitespace-pre-line leading-relaxed">
                {doc.description}
              </div>

              <div className="mt-auto flex items-center justify-between text-xs font-black uppercase tracking-wider w-full pt-4 border-t border-white/5">
                {doc.isAvailable ? (
                  <span className="text-primary flex items-center gap-2 group-hover:gap-3 transition-all text-[10px] tracking-[0.3em]">
                    Générer ce document <ArrowRight size={14} />
                  </span>
                ) : (
                  <span className="text-amber-400/70 flex items-center gap-2 text-[10px]">
                    <Lock size={12} /> Bientôt disponible
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
