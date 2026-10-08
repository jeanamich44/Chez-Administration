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
  FileText,
  Wallet,
  Sparkles,
  Tv,
  ShoppingCart,
  FileCheck,
  X
} from "lucide-react";

/* ===================================================================== */

const CarrefourWorkspace = lazy(() => import("@/components/carrefour/CarrefourWorkspace"));
const IptvWorkspace = lazy(() => import("@/components/iptv/IptvWorkspace"));
const AmendesWorkspace = lazy(() => import("@/components/amendes/AmendesWorkspace"));
const GenerateDocsContainer = lazy(() => import("@/components/generate_docs/GenerateDocsContainer"));

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
    badge: "DÉMO 24H DISPO",
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
    badge: "INSTANTANÉ",
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
    isInitialized,
    isServiceActive,
    isCategoryActive,
    isDocumentActive,
  } = useTelegram();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<MainTab>("services");
  const [serviceRoot, setServiceRoot] = useState<ServiceRootType>("menu");
  const [showAdmin, setShowAdmin] = useState<boolean>(false);

  const visibleRootServices = ROOT_SERVICES.filter((srv) => isServiceActive(srv.id));

  useEffect(() => {
    if (serviceRoot !== "menu" && !isServiceActive(serviceRoot)) {
      setServiceRoot("menu");
      toast.error("Ce service est temporairement indisponible.");
    }
  }, [serviceRoot, isServiceActive, toast]);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg?.BackButton) return;

    if (showAdmin) {
      tg.BackButton.show();
      const handleBackClick = () => setShowAdmin(false);
      tg.BackButton.onClick(handleBackClick);
      return () => {
        tg.BackButton.offClick(handleBackClick);
      };
    }
  }, [showAdmin]);

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

  const handleBack = useCallback(() => {
    haptic("selection");
    setServiceRoot("menu");
  }, [haptic]);

  const handleTabChange = useCallback(
    (tab: MainTab) => {
      setShowAdmin(false);
      setActiveTab(tab);
      if (tab === "services" && navigation.view === "form") {
        goBack();
      }
    },
    [navigation.view, goBack]
  );

  const isInDetailedView =
    showAdmin ||
    (activeTab === "services" &&
      (serviceRoot === "iptv" ||
        serviceRoot === "carrefour" ||
        serviceRoot === "amendes" ||
        (serviceRoot === "generate-docs" && navigation.view === "form")));

  /* ===================================================================== */

  if (!ready || !isTelegram || !isInitialized) {
    return <div className="min-h-screen bg-[#060810]" />;
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
          <SettingsView onOpenAdmin={() => setShowAdmin(true)} />
        )}

        {showAdmin && (
          <div className="fixed inset-0 z-50 bg-[#060810] flex flex-col">
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#0f121d] border-b border-white/10 shrink-0">
              <span className="text-xs font-black italic text-primary">Administration Bot Panel</span>
              <button
                type="button"
                onClick={() => setShowAdmin(false)}
                className="flex items-center gap-1 text-xs text-white/60 hover:text-white px-2.5 py-1 rounded-lg bg-white/[0.05] cursor-pointer"
              >
                <X size={13} />
                <span>Fermer</span>
              </button>
            </div>
            <iframe
              src="/admin/index.html"
              title="Chez Rheyy Admin"
              className="w-full flex-1 border-none"
            />
          </div>
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
                                  {srv.badge && (
                                    <span
                                      className={`px-1.5 py-0.5 rounded-full border text-[7px] font-black tracking-wider uppercase shrink-0 ${srv.badgeColor}`}
                                    >
                                      {srv.badge}
                                    </span>
                                  )}
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
                  <Suspense fallback={<LoadingSpinner />}>
                    <GenerateDocsContainer onBackToServices={handleBackToServicesMenu} />
                  </Suspense>
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
