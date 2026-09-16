"use client";

import React from 'react';
import { Landmark, Zap, ArrowRight, ArrowLeft } from 'lucide-react';
import { BANKS, BankInfo } from '@/data/rib-banks';

interface RibHubContentProps {
  onNavigate: (slug: string) => void;
  onBack?: () => void;
}

export default function RibHubContent({ onNavigate, onBack }: RibHubContentProps) {
  const physiques = BANKS.filter((b) => b.category === 'physique');
  const neobanques = BANKS.filter((b) => b.category === 'neobanque');

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold text-sm tracking-wider uppercase">Documents</span>
          </button>
        )}
      </div>

      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tight text-white">
          GÉNÉRATEUR DE <span className="text-primary">RIB</span>
        </h1>
        <p className="text-white/70 font-medium">
          Sélectionnez la banque pour générer le RIB
        </p>
      </div>

      <section className="glass p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <Landmark className="w-6 h-6 text-primary" />
          <h2 className="font-black italic uppercase tracking-tight text-white text-xl">
            BANQUES PHYSIQUES TRADITIONNELLES
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {physiques.map((bank) => (
            <BankCard key={bank.slug} bank={bank} onNavigate={onNavigate} />
          ))}
        </div>
      </section>

      <section className="glass p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <Zap className="w-6 h-6 text-primary" />
          <h2 className="font-black italic uppercase tracking-tight text-white text-xl">
            NÉOBANQUES & BANQUES EN LIGNE
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {neobanques.map((bank) => (
            <BankCard key={bank.slug} bank={bank} onNavigate={onNavigate} />
          ))}
        </div>
      </section>
    </div>
  );
}

function BankCard({ bank, onNavigate }: { bank: BankInfo; onNavigate: (slug: string) => void }) {
  return (
    <div className="glass flex flex-col relative overflow-hidden transition-transform hover:scale-[1.02]">
      {bank.badge && (
        <div className="absolute top-3 right-3 z-10 bg-black/50 backdrop-blur-md border border-white/10 px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider">
          {bank.badge}
        </div>
      )}
      
      <div className={`h-24 ${bank.headerBg} relative flex items-center justify-center p-4`}>
        <div className="relative w-full h-full max-h-12 flex items-center justify-center">
          <img
            src={bank.logo}
            alt={bank.name}
            className={`max-h-full max-w-[80%] object-contain ${bank.logoClass || ''}`}
          />
        </div>
      </div>
      
      <div className="p-4 md:p-6 flex flex-col flex-grow justify-between gap-4">
        <div>
          <h3 className="font-black italic uppercase tracking-tight text-white text-lg mb-2">
            {bank.name}
          </h3>
          <p className="text-white/70 text-sm whitespace-pre-line leading-relaxed">
            {bank.description}
          </p>
        </div>
        
        <button
          onClick={() => onNavigate(bank.slug)}
          className="flex items-center gap-2 text-primary hover:text-white transition-colors group mt-2"
        >
          <span className="font-bold text-xs uppercase tracking-widest">Générer le RIB</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
