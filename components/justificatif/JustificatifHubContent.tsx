"use client";

import React, { useState } from 'react';
import { ChevronLeft, Flame, GraduationCap, ArrowRight } from 'lucide-react';

interface JustificatifHubContentProps {
  onNavigate: (slug: string) => void;
  onBack: () => void;
}

export default function JustificatifHubContent({ onNavigate, onBack }: JustificatifHubContentProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'Toutes (3)', icon: null },
    { id: 'domicile', label: 'JUSTIFICATIFS DE DOMICILE (2)', icon: <Flame className="w-4 h-4 text-orange-400" /> },
    { id: 'formation', label: 'FORMATION & CONDUITE (1)', icon: <GraduationCap className="w-4 h-4 text-blue-400" /> },
  ];

  const documents = [
    { name: 'Direct Énergie', slug: 'attestation_direct_energie', category: 'domicile', desc: 'Attestation de contrat Direct Énergie' },
    { name: 'EDF', slug: 'attestation_edf', category: 'domicile', desc: 'Attestation de contrat EDF' },
    { name: 'Heures de conduite', slug: 'conduit_heures', category: 'formation', desc: 'Attestation d\'heures de conduite auto-école' },
  ];

  const filteredDocs = activeCategory === 'all' 
    ? documents 
    : documents.filter(d => d.category === activeCategory);

  const getCategoryTitle = (catId: string) => {
    switch (catId) {
      case 'domicile': return { title: 'JUSTIFICATIFS DE DOMICILE', icon: <Flame className="w-5 h-5 text-orange-400" /> };
      case 'formation': return { title: 'FORMATION & CONDUITE', icon: <GraduationCap className="w-5 h-5 text-blue-400" /> };
      default: return null;
    }
  };

  const renderSection = (categoryId: string) => {
    const sectionDocs = filteredDocs.filter(d => d.category === categoryId);
    if (sectionDocs.length === 0) return null;

    const catInfo = getCategoryTitle(categoryId);

    return (
      <div key={categoryId} className="space-y-6 fade-in">
        <div className="flex items-center space-x-3 border-b border-white/10 pb-4">
          {catInfo?.icon}
          <h2 className="text-xl font-black italic uppercase tracking-tight text-white">
            {catInfo?.title}
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {sectionDocs.map((doc) => (
            <div 
              key={doc.slug}
              className="glass p-4 md:p-6 rounded-2xl hover:border-primary/50 transition-colors flex flex-col h-full cursor-pointer group"
              onClick={() => onNavigate(doc.slug)}
            >
              <div className="h-32 border border-white/10 rounded-2xl bg-white mb-4 flex items-center justify-center relative overflow-hidden">
                <span className="text-slate-900 font-black text-2xl uppercase tracking-widest text-center px-2">{doc.name}</span>
              </div>
              
              <div className="flex-1 space-y-2">
                <h3 className="font-black italic text-lg uppercase tracking-tight text-white">{doc.name}</h3>
                <p className="text-sm text-white/60 whitespace-pre-line leading-relaxed">{doc.desc}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-primary">Générer</span>
                <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

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
          GÉNÉRATEUR DE <span className="text-primary">JUSTIFICATIFS</span>
        </h1>
        <p className="text-white/60 text-sm md:text-base max-w-2xl">
          Sélectionnez un type de justificatif pour générer un document sur mesure.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
              activeCategory === cat.id
                ? 'bg-primary text-black'
                : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      <div className="space-y-12">
        {(activeCategory === 'all' || activeCategory === 'domicile') && renderSection('domicile')}
        {(activeCategory === 'all' || activeCategory === 'formation') && renderSection('formation')}
      </div>
    </div>
  );
}
