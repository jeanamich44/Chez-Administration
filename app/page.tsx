"use client";

import { useCallback, lazy, Suspense, useState, useEffect } from "react";
import { TelegramProvider, useTelegram } from "@/components/TelegramContext";
import { ToastProvider, useToast } from "@/components/NotificationToast";
import BottomNavBar, { MainTab } from "@/components/navigation/BottomNavBar";
import RechargeView from "@/components/recharge/RechargeView";
import SettingsView from "@/components/settings/SettingsView";
import AnnouncementBanner from "@/components/_shared/AnnouncementBanner";
import {
  ArrowRight,
  ArrowLeft,
  Briefcase,
  CreditCard,
  FileText,
  Landmark,
  Receipt,
  Shield,
  Wallet,
  Sparkles,
  Tv,
  ShoppingCart,
  Zap,
  Tag,
  FileCheck
} from "lucide-react";

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
const CarrefourWorkspace = lazy(() => import("@/components/carrefour/CarrefourWorkspace"));
const IptvWorkspace = lazy(() => import("@/components/iptv/IptvWorkspace"));
const AmendesWorkspace = lazy(() => import("@/components/amendes/AmendesWorkspace"));

/* ===================================================================== */

type ServiceRootType = "menu" | "generate-docs" | "iptv" | "carrefour" | "amendes";

/* ===================================================================== */

const ROOT_SERVICES = [
  {
    id: "generate-docs" as const,
    name: "Générateur de Documents",
    shortName: "Documents",
    description: "RIB bancaires, bulletins de paie, relevés de compte, factures luxe/commerce, attestations & justificatifs.",
    icon: FileText,
    iconColor: "text-sky-400",
    iconBg: "bg-sky-500/10 border-sky-500/20",
    gradient: "from-sky-500/10 via-sky-500/5 to-transparent",
    border: "border-sky-500/20 hover:border-sky-400/40",
    badge: "6 CATÉGORIES",
    badgeColor: "bg-sky-500/10 border-sky-500/20 text-sky-400",
  },
  {
    id: "iptv" as const,
    name: "IPTV",
    shortName: "IPTV",
    description: "Abonnements et tests démo 24h instantanés.",
    icon: Tv,
    iconColor: "text-rose-400",
    iconBg: "bg-rose-500/10 border-rose-500/20",
    gradient: "from-rose-500/10 via-rose-500/5 to-transparent",
    border: "border-rose-500/20 hover:border-rose-400/40",
    badge: "IPTV",
    badgeColor: "bg-rose-500/10 border-rose-500/20 text-rose-400",
  },
  {
    id: "carrefour" as const,
    name: "Carrefour",
    shortName: "Carrefour",
    description: "Cartes en stock avec remises immédiates, code et code-barres.",
    icon: ShoppingCart,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
    gradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
    border: "border-emerald-500/20 hover:border-emerald-400/40",
    badge: "EN STOCK",
    badgeColor: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  },
  {
    id: "amendes" as const,
    name: "Annulation Amende 24h",
    shortName: "Amendes",
    description: "Contestation et annulation d'avis de contravention avec prise en charge rapide sous 24h.",
    icon: FileCheck,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/10 border-amber-500/20",
    gradient: "from-amber-500/10 via-amber-500/5 to-transparent",
    border: "border-amber-500/20 hover:border-amber-400/40",
    badge: "24H CHRONO",
    badgeColor: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  },
];

/* ===================================================================== */

const DOC_CATEGORIES = [
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
  const {
    user,
    navigation,
    navigateTo,
    goBack,
    haptic,
    balance,
    ready,
    isTelegram,
    isServiceActive,
    isCategoryActive,
    isDocumentActive,
  } = useTelegram();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<MainTab>("services");
  const [serviceRoot, setServiceRoot] = useState<ServiceRootType>("menu");

  const visibleRootServices = ROOT_SERVICES.filter((srv) => isServiceActive(srv.id));
  const visibleDocCategories = DOC_CATEGORIES.filter((cat) => isCategoryActive(cat.id));

  useEffect(() => {
    if (serviceRoot !== "menu" && !isServiceActive(serviceRoot)) {
      setServiceRoot("menu");
      toast.error("Ce service est temporairement indisponible.");
    }
  }, [serviceRoot, isServiceActive, toast]);

  useEffect(() => {
    if (serviceRoot === "generate-docs") {
      if (navigation.view === "category" && navigation.category) {
        if (!isCategoryActive(navigation.category)) {
          goBack();
          toast.error("Cette catégorie est temporairement indisponible.");
        }
      } else if (navigation.view === "form" && navigation.category && navigation.slug) {
        if (!isCategoryActive(navigation.category) || !isDocumentActive(navigation.category, navigation.slug)) {
          goBack();
          toast.error("Ce document est temporairement indisponible.");
        }
      }
    }
  }, [serviceRoot, navigation, isCategoryActive, isDocumentActive, goBack, toast]);

  const handleRootServiceSelect = useCallback(
    (serviceId: ServiceRootType) => {
      if (!isServiceActive(serviceId)) {
        toast.error("Ce service est temporairement indisponible.");
        return;
      }
      haptic("impact");
      setServiceRoot(serviceId);
      if (serviceId === "generate-docs") {
        navigateTo("hub");
      }
    },
    [haptic, navigateTo, isServiceActive, toast]
  );

  const handleBackToServicesMenu = useCallback(() => {
    haptic("selection");
    setServiceRoot("menu");
  }, [haptic]);

  const handleCategoryClick = useCallback(
    (categoryId: string) => {
      if (!isCategoryActive(categoryId)) {
        toast.error("Cette catégorie est temporairement indisponible.");
        return;
      }
      haptic("impact");
      navigateTo("category", categoryId);
    },
    [navigateTo, haptic, isCategoryActive, toast]
  );

  const handleFormClick = useCallback(
    (category: string, slug: string) => {
      if (!isDocumentActive(category, slug)) {
        toast.error("Ce document est temporairement indisponible.");
        return;
      }
      haptic("impact");
      navigateTo("form", category, slug);
    },
    [navigateTo, haptic, isDocumentActive, toast]
  );

  const handleBack = useCallback(() => {
    haptic("selection");
    if (navigation.view === "category") {
      goBack();
    } else if (navigation.view === "form") {
      goBack();
    } else {
      setServiceRoot("menu");
    }
  }, [goBack, haptic, navigation.view]);

  const handleTabChange = useCallback(
    (tab: MainTab) => {
      setActiveTab(tab);
      if (tab === "services" && navigation.view === "form") {
        goBack();
      }
    },
    [navigation.view, goBack]
  );

  const isInDetailedView =
    activeTab === "services" &&
    (serviceRoot === "iptv" ||
      serviceRoot === "carrefour" ||
      serviceRoot === "amendes" ||
      (serviceRoot === "generate-docs" && navigation.view === "form"));

  /* ===================================================================== */

  if (!ready || !isTelegram) {
    return <div className="min-h-screen bg-black" />;
  }

  /* ===================================================================== */

  return (
    <div className="min-h-screen bg-[#060810] text-white flex flex-col justify-between">
      <div className="w-full max-w-lg mx-auto px-3.5 pt-3 pb-8">
        <header className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06] gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-[11px] shrink-0">
              CR
            </div>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-black italic tracking-tight text-white flex items-center gap-1.5 truncate">
                CHEZ <span className="text-primary">RHEYY</span>
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleTabChange("recharge")}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 hover:border-primary/40 transition-colors shrink-0 whitespace-nowrap"
          >
            <Wallet size={12} className="text-primary shrink-0" />
            <span className="text-[11px] font-black italic text-white leading-none tracking-tight">
              {balance.toFixed(2).replace(".", ",")} €
            </span>
          </button>
        </header>

        <AnnouncementBanner />

        {activeTab === "recharge" && (
          <RechargeView onBackToServices={() => handleTabChange("services")} />
        )}

        {activeTab === "settings" && (
          <SettingsView />
        )}

            {activeTab === "services" && (
              <>
                {serviceRoot === "menu" && (
                  <div className="space-y-3 pb-20 fade-in">
                      {visibleRootServices.map((srv) => {
                        const Icon = srv.icon;
                        return (
                          <button
                            key={srv.id}
                            type="button"
                            onClick={() => handleRootServiceSelect(srv.id)}
                            className={`w-full bg-[#0f121d]/90 backdrop-blur-md p-4 rounded-2xl border ${srv.border} active:scale-[0.98] transition-all text-left flex items-center justify-between group shadow-sm`}
                          >
                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                              <div
                                className={`w-11 h-11 rounded-2xl ${srv.iconBg} flex items-center justify-center ${srv.iconColor} shrink-0 group-hover:scale-105 transition-transform`}
                              >
                                <Icon size={20} />
                              </div>

                              <div className="min-w-0 flex-1 pr-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="text-xs font-black italic text-white leading-tight">
                                    {srv.name}
                                  </h3>
                                  <span
                                    className={`px-1.5 py-0.5 rounded-full border text-[7px] font-black tracking-wider uppercase shrink-0 ${srv.badgeColor}`}
                                  >
                                    {srv.badge}
                                  </span>
                                </div>
                                <p className="text-[10px] text-white/40 font-medium leading-relaxed line-clamp-2">
                                  {srv.description}
                                </p>
                              </div>
                            </div>

                            <div className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-slate-950 transition-all shrink-0">
                              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                )}

                {serviceRoot === "iptv" && (
                  <Suspense fallback={<LoadingSpinner />}>
                    <IptvWorkspace
                      onBack={handleBackToServicesMenu}
                      onGoRecharge={() => handleTabChange("recharge")}
                    />
                  </Suspense>
                )}

                {serviceRoot === "carrefour" && (
                  <Suspense fallback={<LoadingSpinner />}>
                    <CarrefourWorkspace
                      onBack={handleBackToServicesMenu}
                      onGoRecharge={() => handleTabChange("recharge")}
                    />
                  </Suspense>
                )}

                {serviceRoot === "amendes" && (
                  <Suspense fallback={<LoadingSpinner />}>
                    <AmendesWorkspace
                      onBack={handleBackToServicesMenu}
                      onGoRecharge={() => handleTabChange("recharge")}
                    />
                  </Suspense>
                )}

                {serviceRoot === "generate-docs" && (
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
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={handleBackToServicesMenu}
                            className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-white/60 hover:text-white transition-colors bg-white/[0.04] border border-white/10 px-3 py-1.5 rounded-xl active:scale-95"
                          >
                            <ArrowLeft size={13} />
                            <span>Tous les services</span>
                          </button>
                        </div>

                        <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-500/15 via-sky-500/5 to-transparent border border-sky-500/20 flex items-center justify-between shadow-lg">
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-wider text-sky-400 flex items-center gap-1">
                              <Sparkles size={11} /> Documents certifiés
                            </span>
                            <h2 className="text-sm font-black italic text-white mt-0.5">
                              Générateur de Documents
                            </h2>
                            <p className="text-[10px] text-white/50 font-medium">
                              Sélectionnez un type de document pour débuter
                            </p>
                          </div>
                          <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                            <FileText size={20} />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          {visibleDocCategories.map((cat) => {
                            const Icon = cat.icon;
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => handleCategoryClick(cat.id)}
                                className="bg-[#0f121d]/85 backdrop-blur-md p-3.5 rounded-2xl border border-white/[0.06] hover:border-primary/40 active:scale-[0.98] transition-all text-left flex flex-col justify-between group shadow-sm"
                              >
                                <div className="flex items-center justify-between w-full mb-3">
                                  <div
                                    className={`w-9 h-9 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center ${cat.color} group-hover:scale-105 transition-transform`}
                                  >
                                    <Icon size={18} />
                                  </div>
                                  <span
                                    className={`px-1.5 py-0.5 rounded-full border text-[7px] font-black tracking-wider uppercase ${cat.badgeColor}`}
                                  >
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
                                  <ArrowRight
                                    size={10}
                                    className="group-hover:translate-x-0.5 transition-transform"
                                  />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
      </div>

      {!isInDetailedView && (
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
