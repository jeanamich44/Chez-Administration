"use client";

import { useCallback, lazy, Suspense } from "react";
import { TelegramProvider, useTelegram } from "@/components/TelegramContext";
import { ToastProvider } from "@/components/NotificationToast";
import { ArrowRight, Briefcase, CreditCard, FileText, Landmark, Receipt, Shield } from "lucide-react";

/* ===================================================================== */

const RibHubContent = lazy(() => import("@/components/rib/RibHubContent"));
const RibWorkspace = lazy(() => import("@/components/rib/RibWorkspace"));
const EmploiHubContent = lazy(() => import("@/components/emploi/EmploiHubContent"));
const FicheDePaieWorkspace = lazy(() => import("@/components/emploi/FicheDePaieWorkspace"));
const ReleveHubContent = lazy(() => import("@/components/releve/ReleveHubContent"));
const LbpReleveWorkspace = lazy(() => import("@/components/releve/LbpReleveWorkspace"));
const FactureHubContent = lazy(() => import("@/components/facture/FactureHubContent"));
const DynamicFormView = lazy(() => import("@/components/facture/DynamicFormView"));
const AssuranceHubContent = lazy(() => import("@/components/assurance/AssuranceHubContent"));
const JustificatifHubContent = lazy(() => import("@/components/justificatif/JustificatifHubContent"));

/* ===================================================================== */

const CATEGORIES = [
  {
    id: "emploi",
    name: "Emploi & Travail",
    description: "Bulletins de salaire officiels multi-mois avec cumuls et PAS conformes",
    icon: Briefcase,
    color: "text-sky-400",
    badge: "PROFESSIONNEL",
    badgeColor: "bg-sky-500/10 border-sky-500/20 text-sky-400",
  },
  {
    id: "rib",
    name: "RIB Bancaire",
    description: "Relevés d'identité bancaire pour 17 banques françaises et néobanques",
    icon: Landmark,
    color: "text-emerald-400",
    badge: "17 BANQUES",
    badgeColor: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  },
  {
    id: "releve",
    name: "Relevés de Compte",
    description: "Relevés bancaires multi-mois avec continuité des soldes et multi-comptes",
    icon: CreditCard,
    color: "text-blue-400",
    badge: "MULTI-MOIS",
    badgeColor: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  },
  {
    id: "assurance",
    name: "Assurances",
    description: "Attestations d'assurance véhicule et responsabilité civile",
    icon: Shield,
    color: "text-violet-400",
    badge: "ATTESTATION",
    badgeColor: "bg-violet-500/10 border-violet-500/20 text-violet-400",
  },
  {
    id: "facture",
    name: "Factures",
    description: "Factures marchands luxe, e-commerce et domicile au format PDF",
    icon: Receipt,
    color: "text-amber-400",
    badge: "18 MARCHANDS",
    badgeColor: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  },
  {
    id: "justificatif",
    name: "Justificatifs",
    description: "Justificatifs de domicile et attestations de formation",
    icon: FileText,
    color: "text-orange-400",
    badge: "DOMICILE",
    badgeColor: "bg-orange-500/10 border-orange-500/20 text-orange-400",
  },
];

/* ===================================================================== */

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Chargement...</p>
    </div>
  );
}

/* ===================================================================== */

function AppRouter() {
  const { navigation, navigateTo, goBack, haptic } = useTelegram();

  const handleCategoryClick = useCallback((categoryId: string) => {
    haptic("impact");
    navigateTo("category", categoryId);
  }, [navigateTo, haptic]);

  const handleFormClick = useCallback((category: string, slug: string) => {
    haptic("impact");
    navigateTo("form", category, slug);
  }, [navigateTo, haptic]);

  const handleBack = useCallback(() => {
    haptic("selection");
    goBack();
  }, [goBack, haptic]);

  /* ===================================================================== */

  if (navigation.view === "form" && navigation.category && navigation.slug) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        {navigation.category === "rib" && (
          <RibWorkspace slug={navigation.slug} onBack={handleBack} />
        )}
        {navigation.category === "emploi" && navigation.slug === "fiche_de_paie" && (
          <FicheDePaieWorkspace onBack={handleBack} />
        )}
        {navigation.category === "releve" && navigation.slug === "lbp" && (
          <LbpReleveWorkspace onBack={handleBack} />
        )}
        {(navigation.category === "facture" || navigation.category === "assurance" || navigation.category === "justificatif") && (
          <DynamicFormView
            category={navigation.category as "facture" | "assurance" | "justificatif"}
            slug={navigation.slug}
            onBack={handleBack}
          />
        )}
      </Suspense>
    );
  }

  /* ===================================================================== */

  if (navigation.view === "category" && navigation.category) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        {navigation.category === "rib" && (
          <RibHubContent
            onNavigate={(slug: string) => handleFormClick("rib", slug)}
            onBack={handleBack}
          />
        )}
        {navigation.category === "emploi" && (
          <EmploiHubContent
            onNavigate={(slug: string) => handleFormClick("emploi", slug)}
            onBack={handleBack}
          />
        )}
        {navigation.category === "releve" && (
          <ReleveHubContent
            onNavigate={(slug: string) => handleFormClick("releve", slug)}
            onBack={handleBack}
          />
        )}
        {navigation.category === "facture" && (
          <FactureHubContent
            onNavigate={(slug: string) => handleFormClick("facture", slug)}
            onBack={handleBack}
          />
        )}
        {navigation.category === "assurance" && (
          <AssuranceHubContent
            onNavigate={(slug: string) => handleFormClick("assurance", slug)}
            onBack={handleBack}
          />
        )}
        {navigation.category === "justificatif" && (
          <JustificatifHubContent
            onNavigate={(slug: string) => handleFormClick("justificatif", slug)}
            onBack={handleBack}
          />
        )}
      </Suspense>
    );
  }

  /* ===================================================================== */

  return (
    <main className="min-h-screen pt-6 pb-12 px-4 max-w-7xl mx-auto">
      <div className="mb-8 fade-in">
        <h1 className="text-2xl sm:text-4xl font-black italic text-white mb-2">
          GÉNÉRATEUR DE <span className="text-primary">DOCUMENTS</span>
        </h1>
        <p className="text-white/40 font-bold tracking-widest uppercase text-[11px]">
          Sélectionnez la catégorie de document à générer
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CATEGORIES.map((cat, i) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryClick(cat.id)}
              className="glass p-5 flex flex-col items-start relative overflow-hidden transition-all duration-300 group active:scale-[0.98] cursor-pointer text-left fade-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center justify-between w-full mb-4">
                <div className={`w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center ${cat.color} group-active:scale-110 group-active:border-primary/50 transition-all duration-300`}>
                  <Icon size={22} />
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[8px] font-black tracking-wider uppercase ${cat.badgeColor}`}>
                  {cat.badge}
                </span>
              </div>

              <h3 className="text-lg font-black italic mb-1.5 text-white tracking-tight">
                {cat.name}
              </h3>
              <p className="text-[11px] text-white/50 mb-4 font-medium leading-relaxed">
                {cat.description}
              </p>

              <div className="mt-auto flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.25em] text-primary">
                Accéder <ArrowRight size={12} className="transition-transform group-active:translate-x-1" />
              </div>
            </button>
          );
        })}
      </div>
    </main>
  );
}

/* ===================================================================== */

export default function HomePage() {
  return (
    <TelegramProvider>
      <ToastProvider>
        <AppRouter />
      </ToastProvider>
    </TelegramProvider>
  );
}
