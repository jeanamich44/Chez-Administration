"use client";

import React, { useState } from 'react';
import { ChevronLeft, Sparkles, ShoppingCart, Flame, ArrowRight } from 'lucide-react';

interface FactureHubContentProps {
  onNavigate: (slug: string) => void;
  onBack: () => void;
}

export default function FactureHubContent({ onNavigate, onBack }: FactureHubContentProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'Toutes (18)', icon: null },
    { id: 'luxe', label: 'FACTURES DE LUXE (7)', icon: <Sparkles className="w-4 h-4 text-amber-300" /> },
    { id: 'commerce', label: 'E-COMMERCE & MAGASINS (9)', icon: <ShoppingCart className="w-4 h-4 text-emerald-400" /> },
    { id: 'domicile', label: 'FACTURES DE DOMICILE (1)', icon: <Flame className="w-4 h-4 text-orange-400" /> },
  ];

  const merchants = [
    { name: 'AMI', slug: 'ami', category: 'luxe', desc: 'Facture boutique AMI Paris' },
    { name: 'Burberry', slug: 'burberry', category: 'luxe', desc: 'Facture boutique Burberry' },
    { name: 'Chanel', slug: 'chanel', category: 'luxe', desc: 'Facture boutique Chanel' },
    { name: 'Dior', slug: 'dior', category: 'luxe', desc: 'Facture boutique Dior' },
    { name: 'Fred', slug: 'fred', category: 'luxe', desc: 'Facture joaillerie Fred' },
    { name: 'Jacquemus', slug: 'jacquemus', category: 'luxe', desc: 'Facture boutique Jacquemus' },
    { name: 'Loro Piana', slug: 'loro-piana', category: 'luxe', desc: 'Facture boutique Loro Piana' },
    { name: 'Adidas', slug: 'adidas', category: 'commerce', desc: 'Facture boutique Adidas' },
    { name: 'Amazon', slug: 'amazon', category: 'commerce', desc: 'Facture Amazon' },
    { name: 'Cdiscount', slug: 'cdiscount', category: 'commerce', desc: 'Facture Cdiscount' },
    { name: 'Dafy Moto', slug: 'dafy-moto', category: 'commerce', desc: 'Facture équipement Dafy Moto' },
    { name: 'Darty', slug: 'darty', category: 'commerce', desc: 'Facture magasin Darty' },
    { name: 'Boulanger', slug: 'boulanger', category: 'commerce', desc: 'Facture magasin Boulanger' },
    { name: 'Fnac', slug: 'fnac', category: 'commerce', desc: 'Facture magasin Fnac' },
    { name: 'Nike', slug: 'nike', category: 'commerce', desc: 'Facture boutique Nike' },
    { name: 'Nocibé', slug: 'nocibe', category: 'commerce', desc: 'Facture parfumerie Nocibé' },
    { name: 'Pack Moto', slug: 'pack-moto', category: 'commerce', desc: 'Facture accessoires Pack Moto' },
    { name: 'Gaz (Engie)', slug: 'engie', category: 'domicile', desc: 'Facture de gaz Engie' },
  ];

  const filteredMerchants = activeCategory === 'all' 
    ? merchants 
    : merchants.filter(m => m.category === activeCategory);

  const getCategoryTitle = (catId: string) => {
    switch (catId) {
      case 'luxe': return { title: 'FACTURES DE LUXE', icon: <Sparkles className="w-5 h-5 text-amber-300" /> };
      case 'commerce': return { title: 'E-COMMERCE & MAGASINS', icon: <ShoppingCart className="w-5 h-5 text-emerald-400" /> };
      case 'domicile': return { title: 'FACTURES DE DOMICILE', icon: <Flame className="w-5 h-5 text-orange-400" /> };
      default: return null;
    }
  };

  const renderSection = (categoryId: string) => {
    const sectionMerchants = filteredMerchants.filter(m => m.category === categoryId);
    if (sectionMerchants.length === 0) return null;

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
          {sectionMerchants.map((merchant) => (
            <div 
              key={merchant.slug}
              className="glass p-4 md:p-6 rounded-2xl hover:border-primary/50 transition-colors flex flex-col h-full cursor-pointer group"
              onClick={() => onNavigate(merchant.slug)}
            >
              <div className="h-32 border border-white/10 rounded-2xl bg-white mb-4 flex items-center justify-center relative overflow-hidden">
                <span className="text-slate-900 font-black text-2xl uppercase tracking-widest">{merchant.name}</span>
              </div>
              
              <div className="flex-1 space-y-2">
                <h3 className="font-black italic text-lg uppercase tracking-tight text-white">{merchant.name}</h3>
                <p className="text-sm text-white/60 whitespace-pre-line leading-relaxed">{merchant.desc}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-primary">Générer la facture</span>
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
          GÉNÉRATEUR DE <span className="text-primary">FACTURES</span>
        </h1>
        <p className="text-white/60 text-sm md:text-base max-w-2xl">
          Sélectionnez un marchand pour générer une facture sur mesure.
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
        {(activeCategory === 'all' || activeCategory === 'luxe') && renderSection('luxe')}
        {(activeCategory === 'all' || activeCategory === 'commerce') && renderSection('commerce')}
        {(activeCategory === 'all' || activeCategory === 'domicile') && renderSection('domicile')}
      </div>
    </div>
  );
}
