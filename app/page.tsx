"use client";

import { useCallback, lazy, Suspense, useState } from "react";
import { TelegramProvider, useTelegram } from "@/components/TelegramContext";
import { ToastProvider } from "@/components/NotificationToast";
import BottomNavBar, { MainTab } from "@/components/navigation/BottomNavBar";
import RechargeView from "@/components/recharge/RechargeView";
import SettingsView from "@/components/settings/SettingsView";
import AccessRestrictedView from "@/components/AccessRestrictedView";
import { ArrowRight, Briefcase, CreditCard, FileText, Landmark, Receipt, Shield, Wallet, Sparkles } from "lucide-react";

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
    description: "Bulletins de salaire conformes",
    icon: Briefcase,
    color: "text-sky-400",
    badge: "CONFORME",
    badgeColor: "bg-sky-500/10 border-sky-500/20 text-sky-400",
  },
  {
    id: "rib",
    name: "RIB Bancaire",
    description: "17 banques françaises",
    icon: Landmark,
    color: "text-emerald-400",
    badge: "17 BANQUES",
    badgeColor: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  },
  {
    id: "releve",
    name: "Relevés de Compte",
    description: "Multi-mois & soldes continus",
    icon: CreditCard,
    color: "text-blue-400",
    badge: "MULTI-MOIS",
    badgeColor: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  },
  {
    id: "facture",
    name: "Factures",
    description: "Luxe, e-commerce & énergie",
    icon: Receipt,
    color: "text-amber-400",
    badge: "18 MARCHANDS",
    badgeColor: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  },
  {
    id: "assurance",
    name: "Assurances",
    description: "Auto, moto & RC pro",
    icon: Shield,
    color: "text-violet-400",
    badge: "ATTESTATION",
    badgeColor: "bg-violet-500/10 border-violet-500/20 text-violet-400",
  },
  {
    id: "justificatif",
    name: "Justificatifs",
    description: "Domicile & quittances",
    icon: FileText,
    color: "text-orange-400",
    badge: "DOMICILE",
    badgeColor: "bg-orange-500/10 border-orange-500/20 text-orange-400",
  },
];

/* ===================================================================== */

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-7 h-7 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Chargement...</p>
    </div>
  );
}

/* ===================================================================== */

function AppRouter() {
  const { user, navigation, navigateTo, goBack, haptic, balance, ready, isTelegram } = useTelegram();
  const [activeTab, setActiveTab] = useState<MainTab>("services");

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#060810] text-white flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isTelegram) {
    return <AccessRestrictedView />;
  }

  const handleCategoryClick = useCallback(
    (categoryId: string) => {
      haptic("impact");
      navigateTo("category", categoryId);
    },
    [navigateTo, haptic]
  );

  const handleFormClick = useCallback(
    (category: string, slug: string) => {
      haptic("impact");
      navigateTo("form", category, slug);
    },
    [navigateTo, haptic]
  );

  const handleBack = useCallback(() => {
    haptic("selection");
    goBack();
  }, [goBack, haptic]);

  const handleTabChange = useCallback(
    (tab: MainTab) => {
      setActiveTab(tab);
      if (tab === "services" && navigation.view === "form") {
        goBack();
      }
    },
    [navigation.view, goBack]
  );

  const isInForm = navigation.view === "form";

  /* ===================================================================== */

  return (
    <div className="min-h-screen bg-[#060810] text-white flex flex-col justify-between">
      <div className="w-full max-w-lg mx-auto px-3.5 pt-3 pb-8">
        <header className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xs">
              CA
            </div>
            <div>
              <h1 className="text-sm font-black italic tracking-tight text-white flex items-center gap-1.5">
                CHEZ <span className="text-primary">ADMINISTRATION</span>
              </h1>
              <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest">
                Telegram Mini App
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleTabChange("recharge")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-primary/40 transition-colors"
          >
            <Wallet size={13} className="text-primary" />
            <span className="text-xs font-black italic text-white">{balance.toFixed(2).replace(".", ",")} €</span>
          </button>
        </header>

        {activeTab === "recharge" && (
          <RechargeView onBackToServices={() => handleTabChange("services")} />
        )}

        {activeTab === "settings" && <SettingsView />}

        {activeTab === "services" && (
          <>
            {navigation.view === "form" && navigation.category && navigation.slug && (
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
                {(navigation.category === "facture" ||
                  navigation.category === "assurance" ||
                  navigation.category === "justificatif") && (
                  <DynamicFormView
                    category={navigation.category as "facture" | "assurance" | "justificatif"}
                    slug={navigation.slug}
                    onBack={handleBack}
                  />
                )}
              </Suspense>
            )}

            {navigation.view === "category" && navigation.category && (
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
            )}

            {navigation.view === "hub" && (
              <div className="space-y-4 pb-20 fade-in">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-primary flex items-center gap-1">
                      <Sparkles size={11} /> Documents certifiés
                    </span>
                    <h2 className="text-sm font-black italic text-white mt-0.5">
                      Générateur Professionnel
                    </h2>
                    <p className="text-[10px] text-white/50 font-medium">
                      Sélectionnez un type de document pour débuter
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {CATEGORIES.map((cat, i) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategoryClick(cat.id)}
                        className="bg-[#0f121d]/85 backdrop-blur-md p-3.5 rounded-2xl border border-white/[0.06] hover:border-primary/40 active:scale-[0.98] transition-all text-left flex flex-col justify-between group shadow-sm"
                      >
                        <div className="flex items-center justify-between w-full mb-3">
                          <div className={`w-9 h-9 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center ${cat.color} group-hover:scale-105 transition-transform`}>
                            <Icon size={18} />
                          </div>
                          <span className={`px-1.5 py-0.5 rounded-full border text-[7px] font-black tracking-wider uppercase ${cat.badgeColor}`}>
                            {cat.badge}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-xs font-black italic text-white leading-tight mb-1">
                            {cat.name}
                          </h3>
                          <p className="text-[9px] text-white/40 font-medium leading-tight">
                            {cat.description}
                          </p>
                        </div>

                        <div className="mt-3 flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-primary">
                          <span>Ouvrir</span>
                          <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {!isInForm && (
        <BottomNavBar activeTab={activeTab} onTabChange={handleTabChange} />
      )}
    </div>
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
