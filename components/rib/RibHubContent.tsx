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
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors cursor-pointer"
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
    <div
      onClick={() => onNavigate(bank.slug)}
      className="glass p-4 md:p-6 flex flex-col items-start relative overflow-hidden transition-all duration-300 hover:border-primary/50 cursor-pointer group rounded-3xl"
    >
      {bank.badge && (
        <div className="absolute top-6 right-6 z-10 bg-black/60 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-wider">
          {bank.badge}
        </div>
      )}
      
      <div className={`w-full h-32 border rounded-2xl p-4 flex items-center justify-center relative overflow-hidden backdrop-blur-md shadow-xl mb-6 transition-all duration-300 ${bank.headerBg}`}>
        <img
          src={bank.logo}
          alt={bank.name}
          className={`h-20 md:h-22 w-auto max-w-[92%] max-h-[85%] object-contain filter drop-shadow-lg ${bank.logoClass || ''}`}
        />
      </div>
      
      <div className="relative z-10 w-full flex flex-col flex-grow">
        <h3 className="text-2xl font-black italic mb-3 text-white tracking-tight">
          {bank.name}
        </h3>
        <p className="text-xs text-white/60 mb-6 font-medium whitespace-pre-line leading-relaxed">
          {bank.description}
        </p>
        
        <div className="mt-auto flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary group-hover:gap-5 transition-all">
          <span>Générer le RIB</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
}
