"use client";

import React from "react";
import { ArrowRight, Lock, ChevronLeft } from "lucide-react";
import { isDocumentEnabled, type GenerateDocsPublicConfig } from "@/components/generate_docs/_shared/usePreviewCooldown";

/* ===================================================================== */

interface EmploiDocOption {
  slug: string;
  name: string;
  badge?: string;
  description: string;
  logo: string;
  headerBg: string;
  isAvailable: boolean;
}

const EMPLOI_DOCS: EmploiDocOption[] = [
  {
    slug: "fiche_de_paie",
    name: "Fiche de Paie",
    badge: "OFFICIEL",
    description: "• Bulletin de paie & fiche de salaire conforme\n• Pack 1, 3, 6 ou 12 mois avec continuité\n• Calculs automatiques",
    logo: "/logos/fiche_de_paie.svg",
    headerBg: "bg-gradient-to-br from-sky-900/40 to-slate-950/80 border-sky-500/30",
    isAvailable: true,
  },
  {
    slug: "contrat_travail",
    name: "Contrat de Travail",
    badge: "CDI / CDD",
    description: "• Contrat à durée indéterminée ou déterminée\n• Clauses conformes et mentions légales",
    logo: "/logos/fiche_de_paie.svg",
    headerBg: "bg-gradient-to-br from-indigo-900/40 to-slate-950/80 border-indigo-500/30",
    isAvailable: false,
  },
  {
    slug: "attestation_france_travail",
    name: "Attestation France Travail",
    badge: "EMPLOYEUR",
    description: "• Attestation employeur pôle emploi\n• Justificatif de fin de contrat et indemnités",
    logo: "/logos/fiche_de_paie.svg",
    headerBg: "bg-gradient-to-br from-emerald-900/40 to-slate-950/80 border-emerald-500/30",
    isAvailable: false,
  }
];

/* ===================================================================== */

interface EmploiHubProps {
  onSelectItem: (slug: string) => void;
  onBack: () => void;
  config?: GenerateDocsPublicConfig | null;
}

export default function EmploiHub({ onSelectItem, onBack, config }: EmploiHubProps) {
  const availableDocs = EMPLOI_DOCS.filter(doc => isDocumentEnabled(config, "emploi", doc.slug));

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
          EMPLOI ET <br/><span className="text-primary">TRAVAIL</span>
        </h1>
        <p className="text-white/40 font-bold tracking-wider uppercase text-[10px]">
          Sélectionnez un document professionnel
        </p>
      </div>

      {availableDocs.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 text-center flex flex-col items-center justify-center">
          <Lock className="w-8 h-8 text-white/40 mb-3" />
          <p className="text-sm font-bold text-white/80">Aucun document disponible</p>
          <p className="text-xs text-white/40 mt-1">Les documents d'emploi sont temporairement désactivés.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {availableDocs.map((doc) => {
          const cardContent = (
            <>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-2 shadow-lg">
                  <img
                    src={doc.logo}
                    alt={doc.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                {doc.badge && (
                  <span className="px-2 py-1 rounded-full text-[9px] font-black tracking-wider uppercase bg-primary/20 text-primary border border-primary/30">
                    {doc.badge}
                  </span>
                )}
              </div>

              <h3 className="text-lg font-black italic text-white mb-2 flex items-center gap-2">
                {doc.name}
                {!doc.isAvailable && <Lock size={14} className="text-amber-400/80" />}
              </h3>

              <p className="text-[11px] text-white/60 font-medium whitespace-pre-line leading-relaxed mb-4 flex-1">
                {doc.description}
              </p>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                {doc.isAvailable ? (
                  <span className="text-primary flex items-center gap-2">
                    Générer <ArrowRight size={12} />
                  </span>
                ) : (
                  <span className="text-amber-400/70 flex items-center gap-1.5">
                    <Lock size={12} /> Bientôt
                  </span>
                )}
              </div>
            </>
          );

          if (doc.isAvailable) {
            return (
              <div
                key={doc.slug}
                onClick={() => onSelectItem(doc.slug)}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col relative overflow-hidden active:scale-[0.98] transition-all cursor-pointer"
              >
                {cardContent}
              </div>
            );
          }

          return (
            <div
              key={doc.slug}
              className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex flex-col relative overflow-hidden opacity-50 select-none"
            >
              {cardContent}
            </div>
          );
        })}
        </div>
      )}
    </main>
  );
}
