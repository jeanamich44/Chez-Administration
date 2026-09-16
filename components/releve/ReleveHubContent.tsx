"use client";

import React from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface ReleveHubContentProps {
  onNavigate: (slug: string) => void;
  onBack: () => void;
}

export default function ReleveHubContent({ onNavigate, onBack }: ReleveHubContentProps) {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider"
      >
        <ArrowLeft className="w-4 h-4" />
        Documents
      </button>

      <div className="space-y-2">
        <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tight text-white">
          GÉNÉRATEUR DE <span className="text-primary">RELEVÉS</span>
        </h1>
        <p className="text-white/70 text-sm md:text-base">
          Créez vos relevés de compte bancaire.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => onNavigate('lbp')}
          className="glass p-6 rounded-2xl flex flex-col items-start text-left gap-4 hover:border-primary/50 transition-colors group"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-900 flex items-center justify-center">
            <img src="/logos/lbp.svg" alt="La Banque Postale" className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black italic uppercase tracking-tight text-white mb-2">
              La Banque Postale
            </h2>
            <div className="text-sm text-white/70 space-y-1">
              <p>• Relevé de compte CCP & Épargne</p>
              <p>• Multi-mois (1 à 12)</p>
              <p>• Continuité des soldes</p>
            </div>
          </div>
          <div className="mt-auto pt-4 w-full flex items-center justify-between text-primary font-bold uppercase text-xs tracking-widest group-hover:translate-x-2 transition-transform">
            Générer le relevé
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>
      </div>
    </div>
  );
}
