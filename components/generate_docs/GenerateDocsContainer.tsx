"use client";

import React, { useState, Suspense } from "react";
import GenerateDocsHub from "./hubs/GenerateDocsHub";
import RibHub from "./hubs/RibHub";
import FactureHub from "./hubs/FactureHub";
import EmploiHub from "./hubs/EmploiHub";
import ReleveHub from "./hubs/ReleveHub";
import AssuranceHub from "./hubs/AssuranceHub";
import JustificatifHub from "./hubs/JustificatifHub";

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
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white p-4 text-center">
        <h2 className="text-xl font-bold mb-4">Workspace: {state.slug}</h2>
        <p className="text-sm text-white/60 mb-6">Catégorie: {state.category}</p>
        <button
          onClick={() => handleBackToCategory(state.category)}
          className="px-6 py-3 bg-white/10 rounded-xl font-bold uppercase tracking-wider text-xs"
        >
          Retour
        </button>
      </div>
    );
  }

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
