"use client";

import { lazy, Suspense } from "react";
import { ArrowLeft, Lock, RefreshCw } from "lucide-react";
import { useTelegram } from "@/components/TelegramContext";
import GenerateDocsHub from "./hubs/GenerateDocsHub";
import FactureHub from "./hubs/FactureHub";
import RibHub from "./hubs/RibHub";
import EmploiHub from "./hubs/EmploiHub";
import ReleveHub from "./hubs/ReleveHub";
import AssuranceHub from "./hubs/AssuranceHub";
import JustificatifHub from "./hubs/JustificatifHub";

/* ===================================================================== */

const RibWorkspace = lazy(() => import("./workspaces/RibWorkspace"));
const FicheDePaieClient = lazy(() => import("./workspaces/FicheDePaieClient"));
const LbpReleveClient = lazy(() => import("./workspaces/LbpReleveClient"));
const MaxanceAssuranceClient = lazy(() => import("./workspaces/MaxanceAssuranceClient"));
const DynamicFormView = lazy(() => import("./_shared/DynamicFormView"));

/* ===================================================================== */

function WorkspaceSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <RefreshCw className="animate-spin text-primary" size={24} />
      <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
        Chargement de l'éditeur...
      </span>
    </div>
  );
}

/* ===================================================================== */

interface GenerateDocsContainerProps {
  onBackToServices: () => void;
}

export default function GenerateDocsContainer({ onBackToServices }: GenerateDocsContainerProps) {
  const { navigation, navigateTo, goBack } = useTelegram();

  if (navigation.view === "form") {
    const { category, slug } = navigation;

    if (category === "rib") {
      return (
        <Suspense fallback={<WorkspaceSpinner />}>
          <RibWorkspace slug={slug} onBack={goBack} />
        </Suspense>
      );
    }

    if (category === "emploi") {
      if (slug === "fiche_de_paie") {
        return (
          <Suspense fallback={<WorkspaceSpinner />}>
            <FicheDePaieClient onBack={goBack} />
          </Suspense>
        );
      }
      return (
        <div className="space-y-4 pb-20 fade-in">
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-white/60 hover:text-white transition-colors bg-white/[0.04] border border-white/10 px-3 py-1.5 rounded-xl active:scale-95"
          >
            <ArrowLeft size={13} />
            <span>Retour</span>
          </button>
          <div className="p-8 rounded-2xl bg-[#0f121d]/85 border border-white/[0.06] text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
              <Lock size={22} />
            </div>
            <h3 className="text-sm font-black italic text-white uppercase">Bientôt disponible</h3>
            <p className="text-xs text-white/40 max-w-xs">
              Ce document professionnel sera disponible prochainement.
            </p>
          </div>
        </div>
      );
    }

    if (category === "releve") {
      if (slug === "lbp") {
        return (
          <Suspense fallback={<WorkspaceSpinner />}>
            <LbpReleveClient onBack={goBack} />
          </Suspense>
        );
      }
      return (
        <div className="space-y-4 pb-20 fade-in">
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-white/60 hover:text-white transition-colors bg-white/[0.04] border border-white/10 px-3 py-1.5 rounded-xl active:scale-95"
          >
            <ArrowLeft size={13} />
            <span>Retour</span>
          </button>
          <div className="p-8 rounded-2xl bg-[#0f121d]/85 border border-white/[0.06] text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
              <Lock size={22} />
            </div>
            <h3 className="text-sm font-black italic text-white uppercase">Bientôt disponible</h3>
            <p className="text-xs text-white/40 max-w-xs">
              Les relevés pour cet établissement seront disponibles prochainement.
            </p>
          </div>
        </div>
      );
    }

    if (category === "assurance") {
      if (slug === "maxance") {
        return (
          <Suspense fallback={<WorkspaceSpinner />}>
            <MaxanceAssuranceClient onBack={goBack} />
          </Suspense>
        );
      }
      return (
        <Suspense fallback={<WorkspaceSpinner />}>
          <DynamicFormView category="assurance" slug={slug || "axa"} onBack={goBack} />
        </Suspense>
      );
    }

    if (category === "justificatif") {
      return (
        <Suspense fallback={<WorkspaceSpinner />}>
          <DynamicFormView
            category="justificatif"
            slug={slug || "attestation_edf"}
            onBack={goBack}
          />
        </Suspense>
      );
    }

    if (category === "facture") {
      return (
        <Suspense fallback={<WorkspaceSpinner />}>
          <DynamicFormView
            category="facture"
            slug={slug || "amazon"}
            onBack={goBack}
          />
        </Suspense>
      );
    }
  }

  if (navigation.view === "category") {
    const { category } = navigation;

    if (category === "facture") {
      return (
        <FactureHub
          onBack={goBack}
          onSelectIssuer={targetSlug => navigateTo("form", "facture", targetSlug)}
        />
      );
    }

    if (category === "rib") {
      return (
        <RibHub
          onBack={goBack}
          onSelectBank={targetSlug => navigateTo("form", "rib", targetSlug)}
        />
      );
    }

    if (category === "emploi") {
      return (
        <EmploiHub
          onBack={goBack}
          onSelectDoc={targetSlug => navigateTo("form", "emploi", targetSlug)}
        />
      );
    }

    if (category === "releve") {
      return (
        <ReleveHub
          onBack={goBack}
          onSelectBank={targetSlug => navigateTo("form", "releve", targetSlug)}
        />
      );
    }

    if (category === "assurance") {
      return (
        <AssuranceHub
          onBack={goBack}
          onSelectAssurance={targetSlug => navigateTo("form", "assurance", targetSlug)}
        />
      );
    }

    if (category === "justificatif") {
      return (
        <JustificatifHub
          onBack={goBack}
          onSelectDoc={targetSlug => navigateTo("form", "justificatif", targetSlug)}
        />
      );
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToServices}
          className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-white/60 hover:text-white transition-colors bg-white/[0.04] border border-white/10 px-3 py-1.5 rounded-xl active:scale-95"
        >
          <ArrowLeft size={13} />
          <span>Tous les services</span>
        </button>
      </div>

      <GenerateDocsHub
        onSelectCategory={catSlug => navigateTo("category", catSlug)}
      />
    </div>
  );
}
