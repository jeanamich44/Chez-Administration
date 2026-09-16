"use client";

import React from 'react';
import { ArrowLeft, ArrowRight, Landmark, Zap, Lock } from 'lucide-react';
import { BANKS, BankInfo } from '@/data/rib-banks';

interface ReleveHubContentProps {
  onNavigate: (slug: string) => void;
  onBack?: () => void;
}

export default function ReleveHubContent({ onNavigate, onBack }: ReleveHubContentProps) {
  const physiques = BANKS.filter((b) => b.category === 'physique');
  const neobanques = BANKS.filter((b) => b.category === 'neobanque');

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors cursor-pointer text-xs font-black uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Documents</span>
          </button>
        )}
      </div>

      <div className="text-center space-y-4">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black italic uppercase tracking-tight text-white">
          GÉNÉRATEUR DE <span className="text-primary">RELEVÉS BANCAIRES</span>
        </h1>
        <p className="text-white/60 font-bold tracking-widest uppercase text-xs sm:text-sm">
          Sélectionnez votre établissement bancaire pour générer un Relevé de Compte officiel
        </p>
      </div>

      <section className="glass p-6 md:p-8 space-y-6 rounded-3xl">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <Landmark className="w-6 h-6 text-primary" />
          <h2 className="font-black italic uppercase tracking-tight text-white text-xl">
            BANQUES PHYSIQUES TRADITIONNELLES
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {physiques.map((bank) => (
            <ReleveBankCard key={bank.slug} bank={bank} onNavigate={onNavigate} />
          ))}
        </div>
      </section>

      <section className="glass p-6 md:p-8 space-y-6 rounded-3xl">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <Zap className="w-6 h-6 text-indigo-400" />
          <h2 className="font-black italic uppercase tracking-tight text-white text-xl">
            NÉOBANQUES & BANQUES EN LIGNE
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {neobanques.map((bank) => (
            <ReleveBankCard key={bank.slug} bank={bank} onNavigate={onNavigate} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ReleveBankCard({ bank, onNavigate }: { bank: BankInfo; onNavigate: (slug: string) => void }) {
  const isAvailable = bank.slug === 'lbp';

  return (
    <div
      onClick={() => isAvailable && onNavigate(bank.slug)}
      className={`glass p-4 md:p-6 flex flex-col items-start relative overflow-hidden transition-all duration-300 rounded-3xl ${
        isAvailable ? "hover:border-primary/50 cursor-pointer group" : "opacity-50 border-white/5 select-none cursor-not-allowed"
      }`}
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
        <h3 className="text-2xl font-black italic mb-3 text-white tracking-tight flex items-center gap-2">
          {bank.name}
          {!isAvailable && <Lock size={16} className="text-amber-400/80" />}
        </h3>
        <p className="text-xs text-white/60 mb-6 font-medium whitespace-pre-line leading-relaxed">
          {isAvailable
            ? "• Générateur de Relevé La Banque Postale\n• 1, 3, 6 ou 12 mois au choix\n• Multi-comptes CCP / Épargne"
            : `• Générateur de Relevé ${bank.name}\n• Multi-mois / Transactions\n• Bientôt disponible`}
        </p>
        
        <div className="mt-auto flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] w-full pt-4 border-t border-white/5">
          {isAvailable ? (
            <span className="text-primary flex items-center gap-2 group-hover:gap-4 transition-all">
              <span>Générer le Relevé</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          ) : (
            <span className="text-amber-400/80 flex items-center gap-2">
              <Lock size={14} className="text-amber-400" /> Indisponible
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
