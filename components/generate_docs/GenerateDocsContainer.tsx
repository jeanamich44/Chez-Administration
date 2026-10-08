"use client";

import React, { lazy, Suspense, useState } from "react";
import { RefreshCw } from "lucide-react";
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
        />
      )}

      {state === "rib" && (
        <RibHub
          onSelectItem={(slug) => handleSelectItem("rib", slug)}
          onBack={handleBackToHub}
        />
      )}

      {state === "facture" && (
        <FactureHub
          onSelectItem={(slug) => handleSelectItem("facture", slug)}
          onBack={handleBackToHub}
        />
      )}

      {state === "emploi" && (
        <EmploiHub
          onSelectItem={(slug) => handleSelectItem("emploi", slug)}
          onBack={handleBackToHub}
        />
      )}

      {state === "releve" && (
        <ReleveHub
          onSelectItem={(slug) => handleSelectItem("releve", slug)}
          onBack={handleBackToHub}
        />
      )}

      {state === "assurance" && (
        <AssuranceHub
          onSelectItem={(slug) => handleSelectItem("assurance", slug)}
          onBack={handleBackToHub}
        />
      )}

      {state === "justificatif" && (
        <JustificatifHub
          onSelectItem={(slug) => handleSelectItem("justificatif", slug)}
          onBack={handleBackToHub}
        />
      )}
    </div>
  );
}
