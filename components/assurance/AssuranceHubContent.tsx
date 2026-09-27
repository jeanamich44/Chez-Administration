"use client";

import React from 'react';
import { ArrowLeft, ArrowRight, Shield } from 'lucide-react';
import { BRAND_CATALOG } from '@/data/brands';

interface AssuranceHubContentProps {
  onNavigate: (slug: string) => void;
  onBack: () => void;
}

const INSURANCES = [
  BRAND_CATALOG["maxance"],
  BRAND_CATALOG["axa"]
];

export default function AssuranceHubContent({ onNavigate, onBack }: AssuranceHubContentProps) {
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
          GÉNÉRATEUR D'<span className="text-primary">ASSURANCE</span>
        </h1>
        <p className="text-white/60 font-bold tracking-widest uppercase text-xs sm:text-sm">
          Sélectionnez votre compagnie d'assurance pour générer votre attestation au format PDF
        </p>
      </div>

      <section className="glass p-6 md:p-8 rounded-3xl space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          <Shield className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-black italic text-white tracking-wide uppercase">
            COMPAGNIES <span className="text-white/40 font-normal text-sm">D'ASSURANCE</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {INSURANCES.map((item) => (
            <div
              key={item.slug}
              onClick={() => onNavigate(item.slug)}
              className="glass p-4 md:p-6 flex flex-col items-start relative overflow-hidden transition-all duration-300 hover:border-primary/50 cursor-pointer group rounded-3xl"
            >
              <div className={`w-full h-36 border rounded-2xl p-4 flex items-center justify-center relative overflow-hidden backdrop-blur-md shadow-xl mb-6 transition-all duration-300 ${item.headerBg}`}>
                <img
                  src={item.logo}
                  alt={item.name}
                  className={`h-20 md:h-22 w-auto max-w-[92%] max-h-[85%] object-contain filter drop-shadow-lg ${item.logoClass || ""}`}
                />
              </div>

              <div className="relative z-10 w-full flex flex-col flex-grow">
                <h3 className="text-2xl font-black italic mb-3 text-white tracking-tight flex items-center gap-2">
                  {item.name}
                </h3>
                <div className="text-xs text-white/60 mb-6 font-medium whitespace-pre-line leading-relaxed">
                  {item.description}
                </div>

                <div className="mt-auto flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary group-hover:gap-5 transition-all">
                  <span>Générer l'attestation</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
