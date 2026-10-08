"use client";

import React, { lazy, Suspense, useEffect, useState } from "react";
import { RefreshCw, Lock } from "lucide-react";
import {
  fetchGenerateDocsConfig,
  isDocumentEnabled,
  type GenerateDocsPublicConfig,
} from "./_shared/usePreviewCooldown";
import GenerateDocsHub from "./hubs/GenerateDocsHub";
import RibHub from "./hubs/RibHub";
import FactureHub from "./hubs/FactureHub";
import EmploiHub from "./hubs/EmploiHub";
import ReleveHub from "./hubs/ReleveHub";
import AssuranceHub from "./hubs/AssuranceHub";
import JustificatifHub from "./hubs/JustificatifHub";
import { RIB_BANK_CONFIGS } from "./_shared/ribBankConfigs";
import {
  axaApplyDynamicDates,
  FACTURE_DATES,
  FACTURE_TOGGLES,
  JUSTIFICATIF_DATES
} from "./_shared/documentPresets";

/* ===================================================================== */

const RibWorkspace = lazy(() => import("./workspaces/RibWorkspace"));
const FicheDePaieClient = lazy(() => import("./workspaces/FicheDePaieClient"));
const LbpReleveClient = lazy(() => import("./workspaces/LbpReleveClient"));
const MaxanceAssuranceClient = lazy(() => import("./workspaces/MaxanceAssuranceClient"));
const DynamicFormView = lazy(() => import("./_shared/DynamicFormView"));

/* ===================================================================== */

type AppState =
  | "hub"
  | "rib"
  | "facture"
  | "emploi"
  | "releve"
  | "assurance"
  | "justificatif"
  | { type: "workspace"; category: string; slug: string };

interface GenerateDocsContainerProps {
  onBackToServices: () => void;
}

function WorkspaceFallback() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-white gap-3 select-none">
      <RefreshCw className="animate-spin text-primary w-8 h-8" />
      <span className="text-xs uppercase tracking-widest text-white/40 font-bold">
        Chargement du formulaire...
      </span>
    </div>
  );
}

/* ===================================================================== */

export default function GenerateDocsContainer({ onBackToServices }: GenerateDocsContainerProps) {
  const [state, setState] = useState<AppState>("hub");
  const [config, setConfig] = useState<GenerateDocsPublicConfig | null>(null);

  useEffect(() => {
    fetchGenerateDocsConfig(true).then((data) => {
      if (data) setConfig(data);
    });
  }, []);

  const handleSelectCategory = (slug: string) => {
    setState(slug as AppState);
  };

  const handleSelectItem = (category: string, slug: string) => {
    setState({ type: "workspace", category, slug });
  };

  const handleBackToHub = () => {
    setState("hub");
  };

  const handleBackToCategory = (category: string) => {
    setState(category as AppState);
  };

  /* ===================================================================== */

  if (typeof state === "object" && state.type === "workspace") {
    const { category, slug } = state;
    const backToCat = () => handleBackToCategory(category);

    if (config && !isDocumentEnabled(config, category, slug)) {
      return (
        <div className="w-full min-h-screen pt-12 px-4 max-w-md mx-auto text-center flex flex-col items-center justify-center">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl flex flex-col items-center justify-center space-y-4">
            <Lock className="w-12 h-12 text-amber-400/80 mb-2" />
            <h2 className="text-lg font-black text-white uppercase italic tracking-wider">
              Document indisponible
            </h2>
            <p className="text-xs text-white/60 leading-relaxed font-medium">
              Ce document est actuellement désactivé.
            </p>
            <button
              onClick={backToCat}
              type="button"
              className="mt-4 px-6 py-2.5 rounded-xl bg-primary text-black font-black text-xs uppercase tracking-widest hover:scale-105 transition-all cursor-pointer"
            >
              Retour aux documents
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full min-h-screen">
        <Suspense fallback={<WorkspaceFallback />}>
          {category === "rib" && (
            <RibWorkspace
              config={RIB_BANK_CONFIGS[slug] || RIB_BANK_CONFIGS.lbp}
              onBack={backToCat}
            />
          )}

          {category === "emploi" && slug === "fiche_de_paie" && (
            <FicheDePaieClient onBack={backToCat} />
          )}

          {category === "releve" && slug === "lbp" && (
            <LbpReleveClient onBack={backToCat} />
          )}

          {category === "assurance" && slug === "maxance" && (
            <MaxanceAssuranceClient onBack={backToCat} />
          )}

          {category === "assurance" && slug === "axa" && (
            <DynamicFormView
              category="assurance"
              slug="axa"
              applyDynamicDates={axaApplyDynamicDates}
              onBack={backToCat}
              defaultBackLabel="Retour aux assurances"
            />
          )}

          {category === "facture" && (
            <DynamicFormView
              category="facture"
              slug={slug}
              applyDynamicDates={FACTURE_DATES[slug]}
              onToggle={FACTURE_TOGGLES[slug]}
              onBack={backToCat}
              defaultBackLabel="Retour aux factures"
            />
          )}

          {category === "justificatif" && (
            <DynamicFormView
              category="justificatif"
              slug={slug}
              applyDynamicDates={JUSTIFICATIF_DATES[slug]}
              onBack={backToCat}
              defaultBackLabel="Retour aux justificatifs"
            />
          )}
        </Suspense>
      </div>
    );
  }

  /* ===================================================================== */

  return (
    <div className="w-full min-h-screen">
      {state === "hub" && (
        <GenerateDocsHub
          onSelectCategory={handleSelectCategory}
          onBack={onBackToServices}
          config={config}
        />
      )}

      {state === "rib" && (
        <RibHub
          onSelectItem={(slug) => handleSelectItem("rib", slug)}
          onBack={handleBackToHub}
          config={config}
        />
      )}

      {state === "facture" && (
        <FactureHub
          onSelectItem={(slug) => handleSelectItem("facture", slug)}
          onBack={handleBackToHub}
          config={config}
        />
      )}

      {state === "emploi" && (
        <EmploiHub
          onSelectItem={(slug) => handleSelectItem("emploi", slug)}
          onBack={handleBackToHub}
          config={config}
        />
      )}

      {state === "releve" && (
        <ReleveHub
          onSelectItem={(slug) => handleSelectItem("releve", slug)}
          onBack={handleBackToHub}
          config={config}
        />
      )}

      {state === "assurance" && (
        <AssuranceHub
          onSelectItem={(slug) => handleSelectItem("assurance", slug)}
          onBack={handleBackToHub}
          config={config}
        />
      )}

      {state === "justificatif" && (
        <JustificatifHub
          onSelectItem={(slug) => handleSelectItem("justificatif", slug)}
          onBack={handleBackToHub}
          config={config}
        />
      )}
    </div>
  );
}
