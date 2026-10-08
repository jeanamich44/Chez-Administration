"use client";

import React, { useState } from "react";
import { ArrowRight, Flame, GraduationCap, ChevronLeft } from "lucide-react";

/* ===================================================================== */

type JustificatifCategory = "domicile" | "formation";

interface JustificatifOption {
  slug: string;
  name: string;
  description: string;
  logo: string;
  headerBg: string;
  category: JustificatifCategory;
}

const CATEGORIES = [
  {
    id: "domicile" as const,
    title: "DOMICILE",
    subtitle: "ÉNERGIE",
    icon: Flame,
    iconColor: "text-orange-400"
  },
  {
    id: "formation" as const,
    title: "FORMATION",
    subtitle: "AUTO-ÉCOLE",
    icon: GraduationCap,
    iconColor: "text-sky-400"
  }
];

const ISSUERS: JustificatifOption[] = [
  {
    slug: "attestation_direct_energie",
    name: "Direct Énergie",
    description: "• Titulaire de contrat Direct Énergie\n• Format PDF / Preview Gratuite\n• Identité, référence client et date",
    logo: "/logos/direct_energie.svg",
    headerBg: "bg-white border-amber-500/30",
    category: "domicile"
  },
  {
    slug: "attestation_edf",
    name: "EDF",
    description: "• Titulaire de contrat EDF\n• Format PDF / Preview Gratuite\n• Identité, PDL et cachet",
    logo: "/logos/edf.svg",
    headerBg: "bg-white border-orange-500/30",
    category: "domicile"
  },
  {
    slug: "conduite_heures",
    name: "Heures de conduite",
    description: "• Liste des rendez-vous de leçon\n• Format PDF / Preview Gratuite\n• Élève, édition et créneaux",
    logo: "/logos/cfrvitry.png",
    headerBg: "bg-white border-sky-500/30",
    category: "formation"
  }
];

/* ===================================================================== */

interface JustificatifHubProps {
  onSelectItem: (slug: string) => void;
  onBack: () => void;
}

export default function JustificatifHub({ onSelectItem, onBack }: JustificatifHubProps) {
  const [selectedCategory, setSelectedCategory] = useState<"all" | JustificatifCategory>("all");

  const renderCard = (item: JustificatifOption) => (
    <div
      key={item.slug}
      onClick={() => onSelectItem(item.slug)}
      className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col items-start relative overflow-hidden active:scale-[0.98] transition-all cursor-pointer mb-3"
    >
      <div className={`w-full h-24 border rounded-xl p-3 flex items-center justify-center relative overflow-hidden mb-4 ${item.headerBg}`}>
        <img src={item.logo} alt={item.name} className="h-12 w-auto max-w-[90%] object-contain filter drop-shadow-md" />
      </div>
      <div className="relative z-10 w-full flex flex-col flex-grow">
        <h3 className="text-base font-black italic mb-2 text-white tracking-tight">{item.name}</h3>
        <div className="text-[11px] text-white/60 mb-4 font-medium whitespace-pre-line leading-relaxed">
          {item.description}
        </div>
        <div className="mt-auto flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-primary">
          Générer justificatif <ArrowRight size={12} />
        </div>
      </div>
    </div>
  );

  const displayedCategories = CATEGORIES.filter(cat => selectedCategory === "all" || selectedCategory === cat.id);

  return (
    <main className="min-h-screen pt-4 pb-24 px-4 w-full max-w-md mx-auto">
      <div className="mb-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/40 hover:text-primary transition-colors mb-4"
        >
          <ChevronLeft size={16} /> Docs
        </button>
        <h1 className="text-2xl font-black italic text-white mb-2 leading-tight">
          GÉNÉRATEUR DE <br/><span className="text-primary">JUSTIFICATIFS</span>
        </h1>
        <p className="text-white/40 font-bold tracking-wider uppercase text-[10px]">
          Sélectionnez le justificatif à générer
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button
          type="button"
          onClick={() => setSelectedCategory("all")}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
            selectedCategory === "all"
              ? "bg-primary text-black"
              : "bg-white/5 text-white/60"
          }`}
        >
          Tous
        </button>
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-primary text-black"
                  : "bg-white/5 text-white/60"
              }`}
            >
              <Icon size={12} className={selectedCategory === cat.id ? "text-black" : cat.iconColor} />
              {cat.title}
            </button>
          );
        })}
      </div>

      {displayedCategories.map(cat => {
        const items = ISSUERS.filter(i => i.category === cat.id).sort((a, b) => a.name.localeCompare(b.name, "fr"));
        const Icon = cat.icon;
        return (
          <section key={cat.id} className="mb-8">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/10">
              <Icon className={`w-5 h-5 ${cat.iconColor}`} />
              <h2 className="text-sm font-black italic text-white tracking-wide">
                {cat.title}
              </h2>
            </div>
            <div className="flex flex-col">
              {items.map(renderCard)}
            </div>
          </section>
        );
      })}
    </main>
  );
}
