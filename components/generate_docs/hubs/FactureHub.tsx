"use client";

import React, { useState } from "react";
import { ArrowRight, Flame, ShoppingCart, Sparkles, ChevronLeft, Lock } from "lucide-react";
import { isDocumentEnabled, type GenerateDocsPublicConfig } from "@/components/generate_docs/_shared/usePreviewCooldown";

/* ===================================================================== */

export type FactureCategory = "luxe" | "commerce" | "domicile";

interface FactureOption {
  slug: string;
  name: string;
  description: string;
  logo: string;
  logoClass?: string;
  headerBg: string;
  category: FactureCategory;
}

const CATEGORIES = [
  {
    id: "luxe" as const,
    title: "LUXE",
    subtitle: "MODE",
    icon: Sparkles,
    iconColor: "text-amber-300"
  },
  {
    id: "commerce" as const,
    title: "COMMERCE",
    subtitle: "MAGASINS",
    icon: ShoppingCart,
    iconColor: "text-emerald-400"
  },
  {
    id: "domicile" as const,
    title: "DOMICILE",
    subtitle: "ÉNERGIE",
    icon: Flame,
    iconColor: "text-orange-400"
  }
];

const ISSUERS: FactureOption[] = [
  {
    slug: "ami",
    name: "AMI",
    description: "• Facture AMI Paris\n• Format PDF / Preview Gratuite\n• Adresse, TVA et articles",
    logo: "/logos/ami.png",
    logoClass: "scale-[2.5]",
    headerBg: "bg-white border-white/20",
    category: "luxe"
  },
  {
    slug: "burberry",
    name: "Burberry",
    description: "• Déclaration d'expédition Burberry\n• Format PDF / Preview Gratuite\n• Collect-in-store et articles",
    logo: "/logos/burberry.png",
    logoClass: "scale-100",
    headerBg: "bg-white border-neutral-800/30",
    category: "luxe"
  },
  {
    slug: "chanel",
    name: "Chanel",
    description: "• Facture boutique Chanel Mode & Joaillerie\n• Format PDF / Preview Gratuite\n• Vente, conseiller et articles luxe",
    logo: "/logos/chanel.png",
    logoClass: "scale-[1.5]",
    headerBg: "bg-white border-neutral-800/30",
    category: "luxe"
  },
  {
    slug: "dior",
    name: "Dior",
    description: "• Facture boutique Christian Dior\n• Format PDF / Preview Gratuite\n• Vente, duplicata et articles luxe",
    logo: "/logos/dior.svg",
    logoClass: "scale-[0.6]",
    headerBg: "bg-white border-neutral-800/30",
    category: "luxe"
  },
  {
    slug: "fred",
    name: "Fred",
    description: "• Facture boutique Fred Joaillerie\n• Format PDF / Preview Gratuite\n• Orfèvrerie, force 10 et joaillerie",
    logo: "/logos/fred.svg",
    logoClass: "scale-100",
    headerBg: "bg-white border-neutral-800/30",
    category: "luxe"
  },
  {
    slug: "jacquemus",
    name: "Jacquemus",
    description: "• Facture commande en ligne Jacquemus\n• Format PDF / Preview Gratuite\n• Expédition, TVA et articles mode",
    logo: "/logos/jacquemus.svg",
    logoClass: "scale-[0.6]",
    headerBg: "bg-white border-neutral-800/30",
    category: "luxe"
  },
  {
    slug: "loro_piana",
    name: "Loro Piana",
    description: "• Ticket de caisse Loro Piana\n• Format PDF / Preview Gratuite\n• Caisse, vendeur et articles luxe",
    logo: "/logos/loro_piana.png",
    logoClass: "scale-90",
    headerBg: "bg-white border-neutral-800/30",
    category: "luxe"
  },
  {
    slug: "adidas",
    name: "Adidas",
    description: "• Facture boutique en ligne Adidas\n• Format PDF / Preview Gratuite\n• Adresses, références et articles",
    logo: "/logos/adidas.svg",
    headerBg: "bg-white border-white/20",
    category: "commerce"
  },
  {
    slug: "amazon",
    name: "Amazon",
    description: "• Facture Amazon ou vendeur marketplace\n• Format PDF / Preview Gratuite\n• Commande, TVA et articles",
    logo: "/logos/amazon.svg",
    logoClass: "scale-85",
    headerBg: "bg-white border-amber-500/30",
    category: "commerce"
  },
  {
    slug: "cdiscount",
    name: "Cdiscount",
    description: "• Facture Cdiscount Marketplace\n• Format PDF / Preview Gratuite\n• Commande, vendeur et articles",
    logo: "/logos/cdiscount.svg",
    logoClass: "scale-90",
    headerBg: "bg-white border-red-500/30",
    category: "commerce"
  },
  {
    slug: "dafy",
    name: "Dafy Moto",
    description: "• Facture d'achat Dafy Moto\n• Format PDF / Preview Gratuite\n• Adresses, magasin et articles moto",
    logo: "/logos/dafy.png",
    logoClass: "scale-110",
    headerBg: "bg-white border-red-500/30",
    category: "commerce"
  },
  {
    slug: "darty",
    name: "Darty",
    description: "• Facture d'achat Darty\n• Format PDF / Preview Gratuite\n• Garantie, délivrance et articles",
    logo: "/logos/darty.svg",
    logoClass: "scale-110",
    headerBg: "bg-white border-red-500/30",
    category: "commerce"
  },
  {
    slug: "boulanger",
    name: "Boulanger",
    description: "• Facture Boulanger en ligne ou magasin\n• Format PDF / Preview Gratuite\n• Adresses, garantie et articles",
    logo: "/logos/boulanger.svg",
    logoClass: "scale-110",
    headerBg: "bg-white border-orange-500/30",
    category: "commerce"
  },
  {
    slug: "fnac",
    name: "Fnac",
    description: "• Facture Fnac.com ou magasin\n• Format PDF / Preview Gratuite\n• Mode de règlement et articles",
    logo: "/logos/fnac.svg",
    logoClass: "scale-110",
    headerBg: "bg-white border-yellow-500/30",
    category: "commerce"
  },
  {
    slug: "nike",
    name: "Nike",
    description: "• Facture Nike.com\n• Format PDF / Preview Gratuite\n• Adresses, références et articles",
    logo: "/logos/nike.svg",
    logoClass: "scale-85",
    headerBg: "bg-white border-orange-500/30",
    category: "commerce"
  },
  {
    slug: "nocibe",
    name: "Nocibé",
    description: "• Facture boutique & parfumerie Nocibé\n• Format PDF / Preview Gratuite\n• Parfums, remises et TVA détaillée",
    logo: "/logos/nocibe.svg",
    logoClass: "scale-90",
    headerBg: "bg-white border-pink-500/30",
    category: "commerce"
  },
  {
    slug: "pack_moto",
    name: "Pack Moto",
    description: "• Facture d'expédition Pack Moto\n• Format PDF / Preview Gratuite\n• Transporteur, société et articles",
    logo: "/logos/pack_moto.png",
    logoClass: "scale-95",
    headerBg: "bg-white border-orange-500/30",
    category: "commerce"
  },
  {
    slug: "gaz",
    name: "Gaz (Engie)",
    description: "• Facture de souscription gaz Engie\n• Format PDF / Preview Gratuite\n• PCE, lieu de conso et montants",
    logo: "/logos/gaz.svg",
    logoClass: "scale-90",
    headerBg: "bg-white border-blue-500/30",
    category: "domicile"
  },
  {
    slug: "sfr",
    name: "SFR",
    description: "• Facture mobile & box SFR\n• Format PDF / Preview Gratuite\n• Lignes, mensualités et SEPA",
    logo: "/logos/sfr.svg",
    logoClass: "scale-95",
    headerBg: "bg-white border-red-500/30",
    category: "domicile"
  }
];

/* ===================================================================== */

interface FactureHubProps {
  onSelectItem: (slug: string) => void;
  onBack: () => void;
  config?: GenerateDocsPublicConfig | null;
}

export default function FactureHub({ onSelectItem, onBack, config }: FactureHubProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const availableIssuers = ISSUERS.filter(item => isDocumentEnabled(config, "facture", item.slug));

  const renderFactureCard = (item: FactureOption) => (
    <div
      key={item.slug}
      onClick={() => onSelectItem(item.slug)}
      className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col items-start relative overflow-hidden active:scale-[0.98] transition-all cursor-pointer mb-3"
    >
      <div className={`w-full h-24 border rounded-xl p-3 flex items-center justify-center relative overflow-hidden mb-4 ${item.headerBg}`}>
        <img
          src={item.logo}
          alt={item.name}
          className={`h-12 w-auto max-w-[90%] object-contain filter drop-shadow-md ${item.logoClass || ""}`}
        />
      </div>
      <div className="relative z-10 w-full flex flex-col flex-grow">
        <h3 className="text-base font-black italic mb-2 text-white tracking-tight">{item.name}</h3>
        <div className="text-[11px] text-white/60 mb-4 font-medium whitespace-pre-line leading-relaxed">
          {item.description}
        </div>
        <div className="mt-auto flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-primary">
          Générer facture <ArrowRight size={12} />
        </div>
      </div>
    </div>
  );

  const displayedCategories = CATEGORIES
    .filter(cat => selectedCategory === "all" || selectedCategory === cat.id)
    .filter(cat => availableIssuers.some(i => i.category === cat.id));

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
          GÉNÉRATEUR DE <br/><span className="text-primary">FACTURES</span>
        </h1>
        <p className="text-white/40 font-bold tracking-wider uppercase text-[10px]">
          Sélectionnez l'émetteur pour générer la facture
        </p>
      </div>

      {availableIssuers.length > 0 && (
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
            Toutes
          </button>
          {CATEGORIES.filter(cat => availableIssuers.some(i => i.category === cat.id)).map(cat => {
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
      )}

      {availableIssuers.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 text-center flex flex-col items-center justify-center">
          <Lock className="w-8 h-8 text-white/40 mb-3" />
          <p className="text-sm font-bold text-white/80">Aucune facture disponible</p>
          <p className="text-xs text-white/40 mt-1">Les factures de cette catégorie sont temporairement désactivées.</p>
        </div>
      ) : (
        displayedCategories.map(cat => {
          const items = availableIssuers.filter(i => i.category === cat.id).sort((a, b) => a.name.localeCompare(b.name, "fr"));
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
                {items.map(renderFactureCard)}
              </div>
            </section>
          );
        })
      )}
    </main>
  );
}
