"use client";

import React from "react";
import { ArrowRight, Briefcase, CreditCard, FileCheck, FileText, Lock, Shield, ChevronLeft } from "lucide-react";

/* ===================================================================== */

interface DocCategory {
  slug: string;
  name: string;
  badge: string;
  description: string;
  icon: React.ReactNode;
  isAvailable: boolean;
}

const CATEGORIES: DocCategory[] = [
  {
    slug: "emploi",
    name: "Emploi et Travail",
    badge: "EMPLOI",
    description: "Fiches de paie et bulletins de salaire conformes au format PDF",
    icon: <Briefcase size={20} />,
    isAvailable: true,
  },
  {
    slug: "rib",
    name: "RIB Bancaires",
    badge: "DOCS",
    description: "Générateur de Relevés d'Identité Bancaire (La Banque Postale, Société Générale...)",
    icon: <CreditCard size={20} />,
    isAvailable: true,
  },
  {
    slug: "releve",
    name: "Relevés Bancaires",
    badge: "BANQUE",
    description: "Générateur de Relevés de Compte Bancaire (La Banque Postale, BNP, Société Générale...)",
    icon: <FileText size={20} />,
    isAvailable: true,
  },
  {
    slug: "assurance",
    name: "Assurances",
    badge: "AUTO",
    description: "Justificatifs d'assurance véhicules (Voiture, Moto, Scooter) au format PDF",
    icon: <Shield size={20} />,
    isAvailable: true,
  },
  {
    slug: "facture",
    name: "Factures",
    badge: "FACTURE",
    description: "Factures Adidas, Amazon, Fnac, Nike, AMI et Burberry au format PDF",
    icon: <FileText size={20} />,
    isAvailable: true,
  },
  {
    slug: "justificatif",
    name: "Justificatifs",
    badge: "ATTESTATION",
    description: "Justificatifs d'heures de conduite et attestation EDF au format PDF",
    icon: <FileCheck size={20} />,
    isAvailable: true,
  }
];

/* ===================================================================== */

interface GenerateDocsHubProps {
  onSelectCategory: (slug: string) => void;
  onBack: () => void;
}

export default function GenerateDocsHub({ onSelectCategory, onBack }: GenerateDocsHubProps) {
  return (
    <main className="min-h-screen pt-4 pb-24 px-4 w-full max-w-md mx-auto">
      <div className="mb-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/40 hover:text-primary transition-colors mb-4"
        >
          <ChevronLeft size={16} /> Services
        </button>
        <h1 className="text-2xl font-black italic text-white mb-2 leading-tight">
          GÉNÉRATION DE <br/><span className="text-primary">DOCUMENTS</span>
        </h1>
        <p className="text-white/40 font-bold tracking-wider uppercase text-[10px]">
          Sélectionnez la catégorie de document à générer au format PDF
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {CATEGORIES.map((cat) => {
          const catContent = (
            <>
              <div className="w-full flex items-center justify-between mb-4 z-10">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-primary border border-white/10">
                  {cat.icon}
                </div>
                <span className="px-2 py-1 rounded-full text-[9px] font-black tracking-wider uppercase bg-primary/20 text-primary border border-primary/30">
                  {cat.badge}
                </span>
              </div>

              <div className="relative z-10 w-full flex flex-col">
                <h3 className="text-lg font-black italic mb-1 text-white tracking-tight flex items-center gap-2">
                  {cat.name}
                  {!cat.isAvailable && <Lock size={14} className="text-amber-400/80" />}
                </h3>
                <p className="text-[11px] text-white/50 mb-4 font-medium leading-relaxed">
                  {cat.description}
                </p>

                {cat.isAvailable ? (
                  <div className="mt-auto flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-primary">
                    Accéder <ArrowRight size={12} />
                  </div>
                ) : (
                  <div className="mt-auto flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-amber-400/80">
                    <Lock size={12} className="text-amber-400" /> Bientôt
                  </div>
                )}
              </div>
            </>
          );

          if (cat.isAvailable) {
            return (
              <div
                key={cat.slug}
                onClick={() => onSelectCategory(cat.slug)}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col items-start relative overflow-hidden transition-all active:scale-[0.98] cursor-pointer"
              >
                {catContent}
              </div>
            );
          }

          return (
            <div
              key={cat.slug}
              className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex flex-col items-start relative overflow-hidden opacity-50 select-none"
            >
              {catContent}
            </div>
          );
        })}
      </div>
    </main>
  );
}
