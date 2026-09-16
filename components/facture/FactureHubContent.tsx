"use client";

import React, { useState } from 'react';
import { ArrowLeft, Sparkles, ShoppingCart, Flame, ArrowRight } from 'lucide-react';
import { BRAND_CATALOG } from '@/data/brands';

interface FactureHubContentProps {
  onNavigate: (slug: string) => void;
  onBack: () => void;
}

export type FactureCategory = "luxe" | "commerce" | "domicile";

const CATEGORIES = [
  {
    id: "luxe" as const,
    title: "FACTURES DE LUXE",
    subtitle: "MODE & HAUTE COUTURE",
    icon: Sparkles,
    iconColor: "text-amber-300"
  },
  {
    id: "commerce" as const,
    title: "E-COMMERCE & MAGASINS",
    subtitle: "BOUTIQUES EN LIGNE & ENSEIGNES",
    icon: ShoppingCart,
    iconColor: "text-emerald-400"
  },
  {
    id: "domicile" as const,
    title: "FACTURES DE DOMICILE",
    subtitle: "ÉNERGIE & FOURNISSEURS",
    icon: Flame,
    iconColor: "text-orange-400"
  }
];

const ISSUERS = [
  BRAND_CATALOG["ami"],
  BRAND_CATALOG["burberry"],
  BRAND_CATALOG["chanel"],
  BRAND_CATALOG["dior"],
  BRAND_CATALOG["fred"],
  BRAND_CATALOG["jacquemus"],
  BRAND_CATALOG["loro_piana"],
  BRAND_CATALOG["adidas"],
  BRAND_CATALOG["amazon"],
  BRAND_CATALOG["cdiscount"],
  BRAND_CATALOG["dafy"],
  BRAND_CATALOG["darty"],
  BRAND_CATALOG["boulanger"],
  BRAND_CATALOG["fnac"],
  BRAND_CATALOG["nike"],
  BRAND_CATALOG["nocibe"],
  BRAND_CATALOG["pack_moto"],
  BRAND_CATALOG["gaz"]
];

export default function FactureHubContent({ onNavigate, onBack }: FactureHubContentProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const displayedCategories = CATEGORIES.filter(cat => selectedCategory === "all" || selectedCategory === cat.id);

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
          GÉNÉRATEUR DE <span className="text-primary">FACTURES</span>
        </h1>
        <p className="text-white/60 font-bold tracking-widest uppercase text-xs sm:text-sm">
          Sélectionnez l'émetteur pour générer la facture au format PDF
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedCategory("all")}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            selectedCategory === "all"
              ? "bg-primary text-black shadow-lg shadow-primary/20"
              : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
          }`}
        >
          Toutes ({ISSUERS.length})
        </button>
        {CATEGORIES.map(cat => {
          const count = ISSUERS.filter(i => i.category === cat.id).length;
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-primary text-black shadow-lg shadow-primary/20"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={14} className={selectedCategory === cat.id ? "text-black" : cat.iconColor} />
              {cat.title} ({count})
            </button>
          );
        })}
      </div>

      {displayedCategories.map(cat => {
        const items = ISSUERS.filter(i => i.category === cat.id).sort((a, b) => a.name.localeCompare(b.name, "fr"));
        const Icon = cat.icon;
        return (
          <section key={cat.id} className="glass p-6 md:p-8 rounded-3xl space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              <Icon className={`w-6 h-6 ${cat.iconColor}`} />
              <h2 className="text-xl font-black italic text-white tracking-wide uppercase">
                {cat.title} <span className="text-white/40 font-normal text-sm">{cat.subtitle}</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
              {items.map((item) => (
                <div
                  key={item.slug}
                  onClick={() => onNavigate(item.slug)}
                  className="glass p-4 md:p-6 flex flex-col items-start relative overflow-hidden transition-all duration-300 hover:border-primary/50 cursor-pointer group rounded-3xl"
                >
                  <div className={`w-full h-32 border rounded-2xl p-4 flex items-center justify-center relative overflow-hidden backdrop-blur-md shadow-xl mb-6 transition-all duration-300 ${item.headerBg}`}>
                    <img
                      src={item.logo}
                      alt={item.name}
                      className={`h-16 md:h-20 w-auto max-w-[92%] max-h-[85%] object-contain filter drop-shadow-lg ${item.logoClass || ""}`}
                    />
                  </div>

                  <div className="relative z-10 w-full flex flex-col flex-grow">
                    <h3 className="text-2xl font-black italic mb-3 text-white tracking-tight">{item.name}</h3>
                    <div className="text-xs text-white/60 mb-6 font-medium whitespace-pre-line leading-relaxed">
                      {item.description}
                    </div>
                    <div className="mt-auto flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary group-hover:gap-5 transition-all">
                      <span>Générer la facture</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
