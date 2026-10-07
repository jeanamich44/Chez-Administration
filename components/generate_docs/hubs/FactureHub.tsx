"use client";

import { useState, useMemo } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Flame,
  Search,
  ShoppingCart,
  Sparkles
} from "lucide-react";
import { useTelegram } from "@/components/TelegramContext";

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

const ISSUERS: FactureOption[] = [
  {
    slug: "ami",
    name: "AMI Paris",
    description: "Facture officielle avec adresses et articles",
    logo: "/logos/ami.png",
    logoClass: "scale-[2.8]",
    headerBg: "bg-white border-white/20",
    category: "luxe"
  },
  {
    slug: "burberry",
    name: "Burberry",
    description: "Déclaration d'expédition et collect-in-store",
    logo: "/logos/burberry.png",
    logoClass: "scale-100",
    headerBg: "bg-white border-neutral-800/30",
    category: "luxe"
  },
  {
    slug: "chanel",
    name: "Chanel",
    description: "Facture boutique Chanel Mode & Joaillerie",
    logo: "/logos/chanel.png",
    logoClass: "scale-[1.8]",
    headerBg: "bg-white border-neutral-800/30",
    category: "luxe"
  },
  {
    slug: "dior",
    name: "Christian Dior",
    description: "Facture boutique et duplicata articles luxe",
    logo: "/logos/dior.svg",
    logoClass: "scale-[0.70]",
    headerBg: "bg-white border-neutral-800/30",
    category: "luxe"
  },
  {
    slug: "fred",
    name: "Fred Joaillerie",
    description: "Facture orfèvrerie et joaillerie Force 10",
    logo: "/logos/fred.svg",
    logoClass: "scale-100",
    headerBg: "bg-white border-neutral-800/30",
    category: "luxe"
  },
  {
    slug: "jacquemus",
    name: "Jacquemus",
    description: "Facture boutique en ligne et expédition",
    logo: "/logos/jacquemus.svg",
    logoClass: "scale-[0.70]",
    headerBg: "bg-white border-neutral-800/30",
    category: "luxe"
  },
  {
    slug: "loro_piana",
    name: "Loro Piana",
    description: "Ticket de caisse boutique et articles luxe",
    logo: "/logos/loro_piana.png",
    logoClass: "scale-90",
    headerBg: "bg-white border-neutral-800/30",
    category: "luxe"
  },
  {
    slug: "adidas",
    name: "Adidas",
    description: "Facture boutique en ligne et adresses",
    logo: "/logos/adidas.svg",
    headerBg: "bg-white border-white/20",
    category: "commerce"
  },
  {
    slug: "amazon",
    name: "Amazon EU",
    description: "Facture officielle ou vendeur marketplace tiers",
    logo: "/logos/amazon.svg",
    logoClass: "scale-85",
    headerBg: "bg-white border-amber-500/30",
    category: "commerce"
  },
  {
    slug: "cdiscount",
    name: "Cdiscount",
    description: "Facture directe ou marketplace vendeur tiers",
    logo: "/logos/cdiscount.svg",
    logoClass: "scale-90",
    headerBg: "bg-white border-red-500/30",
    category: "commerce"
  },
  {
    slug: "dafy",
    name: "Dafy Moto",
    description: "Facture équipement et magasin moto",
    logo: "/logos/dafy.png",
    logoClass: "scale-120",
    headerBg: "bg-white border-red-500/30",
    category: "commerce"
  },
  {
    slug: "darty",
    name: "Darty",
    description: "Facture délivrance, garantie et électroménager",
    logo: "/logos/darty.svg",
    logoClass: "scale-110",
    headerBg: "bg-white border-red-500/30",
    category: "commerce"
  },
  {
    slug: "boulanger",
    name: "Boulanger",
    description: "Facture web ou magasin avec garantie",
    logo: "/logos/boulanger.svg",
    logoClass: "scale-110",
    headerBg: "bg-white border-orange-500/30",
    category: "commerce"
  },
  {
    slug: "fnac",
    name: "Fnac",
    description: "Facture Fnac.com ou achat en magasin",
    logo: "/logos/fnac.svg",
    logoClass: "scale-125",
    headerBg: "bg-white border-yellow-500/30",
    category: "commerce"
  },
  {
    slug: "nike",
    name: "Nike",
    description: "Facture officielle commande en ligne Nike",
    logo: "/logos/nike.svg",
    logoClass: "scale-85",
    headerBg: "bg-white border-orange-500/30",
    category: "commerce"
  },
  {
    slug: "nocibe",
    name: "Nocibé",
    description: "Facture parfumerie avec TVA détaillée",
    logo: "/logos/nocibe.svg",
    logoClass: "scale-100",
    headerBg: "bg-white border-pink-500/30",
    category: "commerce"
  },
  {
    slug: "pack_moto",
    name: "Pack Moto",
    description: "Facture expédition transporteur et articles",
    logo: "/logos/pack_moto.png",
    logoClass: "scale-95",
    headerBg: "bg-white border-orange-500/30",
    category: "commerce"
  },
  {
    slug: "gaz",
    name: "Engie (Gaz)",
    description: "Facture de souscription avec PCE et conso",
    logo: "/logos/gaz.svg",
    logoClass: "scale-90",
    headerBg: "bg-white border-blue-500/30",
    category: "domicile"
  },
  {
    slug: "sfr",
    name: "SFR",
    description: "Facture box internet & mobile avec SEPA",
    logo: "/logos/sfr.svg",
    logoClass: "scale-100",
    headerBg: "bg-white border-red-500/30",
    category: "domicile"
  }
];

/* ===================================================================== */

interface FactureHubProps {
  onBack: () => void;
  onSelectIssuer: (slug: string) => void;
}

export default function FactureHub({ onBack, onSelectIssuer }: FactureHubProps) {
  const { haptic } = useTelegram();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [query, setQuery] = useState<string>("");

  const filteredIssuers = useMemo(() => {
    return ISSUERS.filter(item => {
      const matchCat = selectedCategory === "all" || item.category === selectedCategory;
      const matchQuery = !query.trim() || item.name.toLowerCase().includes(query.toLowerCase()) || item.description.toLowerCase().includes(query.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [selectedCategory, query]);

  return (
    <div className="space-y-3 pb-20 fade-in">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-white/60 hover:text-white transition-colors bg-white/[0.04] border border-white/10 px-3 py-1.5 rounded-xl active:scale-95"
        >
          <ArrowLeft size={13} />
          <span>Tous les documents</span>
        </button>

        <span className="text-[10px] font-mono text-white/40">19 enseignes</span>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Rechercher une marque, enseigne..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-primary"
        />
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: "all", label: "Toutes" },
          { id: "luxe", label: "Luxe", icon: Sparkles },
          { id: "commerce", label: "Commerce", icon: ShoppingCart },
          { id: "domicile", label: "Domicile", icon: Flame }
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                haptic("selection");
                setSelectedCategory(tab.id);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-colors flex items-center gap-1.5 ${
                isSelected
                  ? "bg-primary text-slate-950 shadow-md shadow-primary/20"
                  : "bg-white/5 text-white/60 border border-white/5 hover:border-white/10"
              }`}
            >
              {Icon && <Icon size={12} />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        {filteredIssuers.map(item => (
          <button
            key={item.slug}
            type="button"
            onClick={() => {
              haptic("selection");
              onSelectIssuer(item.slug);
            }}
            className="w-full bg-[#0f121d]/90 backdrop-blur-md p-3 rounded-2xl border border-white/[0.08] hover:border-primary/40 active:scale-[0.98] transition-all text-left flex items-center justify-between group shadow-sm cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-12 h-10 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 overflow-hidden border border-white/20">
                <img
                  src={item.logo}
                  alt={item.name}
                  className={`max-h-full max-w-full object-contain ${item.logoClass || ""}`}
                />
              </div>

              <div className="min-w-0 flex-1 pr-2">
                <h3 className="text-xs font-black text-white leading-tight truncate">
                  {item.name}
                </h3>
                <p className="text-[10px] text-white/40 font-medium truncate mt-0.5">
                  {item.description}
                </p>
              </div>
            </div>

            <div className="w-7 h-7 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-slate-950 transition-all shrink-0">
              <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
