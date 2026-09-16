"use client";

import React from 'react';
import { ChevronLeft, ArrowRight, ShieldCheck } from 'lucide-react';

interface AssuranceHubContentProps {
  onNavigate: (slug: string) => void;
  onBack: () => void;
}

export default function AssuranceHubContent({ onNavigate, onBack }: AssuranceHubContentProps) {
  const assurances = [
    {
      name: 'Maxance',
      slug: 'maxance',
      desc: 'Attestation d\'assurance véhicule Maxance.',
      gradient: 'from-purple-900/40 to-fuchsia-900/40',
      borderHover: 'hover:border-fuchsia-500/50'
    },
    {
      name: 'AXA',
      slug: 'axa',
      desc: 'Attestation d\'assurance véhicule AXA.',
      gradient: 'from-blue-900/40 to-sky-900/40',
      borderHover: 'hover:border-blue-500/50'
    }
  ];

  return (
    <div className="space-y-8 fade-in pb-20">
      <button 
        onClick={onBack}
        className="flex items-center space-x-2 text-sm font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Documents</span>
      </button>

      <div className="space-y-2">
        <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
          GÉNÉRATEUR <span className="text-primary">D'ASSURANCES</span>
        </h1>
        <p className="text-white/60 text-sm md:text-base max-w-2xl">
          Sélectionnez un assureur pour générer une attestation sur mesure.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {assurances.map((assurance) => (
          <div 
            key={assurance.slug}
            className={`glass p-6 md:p-8 rounded-3xl transition-colors cursor-pointer flex flex-col h-full group ${assurance.borderHover}`}
            onClick={() => onNavigate(assurance.slug)}
          >
            <div className={`h-40 md:h-48 rounded-2xl bg-gradient-to-br ${assurance.gradient} border border-white/10 mb-6 flex items-center justify-center p-8 relative overflow-hidden group-hover:scale-[1.02] transition-transform`}>
              <div className="absolute inset-0 bg-black/20" />
              <div className="relative z-10 w-full h-full flex items-center justify-center bg-white rounded-xl p-4">
                <span className="text-slate-900 font-black text-3xl uppercase tracking-widest">{assurance.name}</span>
              </div>
            </div>
            
            <div className="flex-1 space-y-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h3 className="font-black italic text-xl uppercase tracking-tight text-white">{assurance.name}</h3>
              </div>
              <p className="text-sm text-white/60 leading-relaxed">{assurance.desc}</p>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Générer l'attestation</span>
              <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
