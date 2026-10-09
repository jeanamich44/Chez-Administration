"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

/* ===================================================================== */

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  admin?: boolean;
}

interface NavigationState {
  view: "hub" | "category" | "form";
  category?: string;
  slug?: string;
}

interface TelegramContextType {
  webApp: any;
  user: TelegramUser | null;
  initData: string;
  balance: number;
  isLoadingBalance: boolean;
  ready: boolean;
  isTelegram: boolean;
  isAdmin: boolean;
  isInitialized: boolean;
  adminSlug: string | null;
  botName: string | null;
  supportTelegram: string | null;
  supportTelegram2: string | null;
  channelTelegram: string | null;
  marqueeText: string | null;
  marqueeStyle: string;
  services: Record<string, boolean>;
  generateDocsConfig: any;
  isServiceActive: (slug: string) => boolean;
  isCategoryActive: (catSlug: string) => boolean;
  isDocumentActive: (catSlug: string, docSlug: string) => boolean;
  navigation: NavigationState;
  navigateTo: (view: NavigationState["view"], category?: string, slug?: string) => void;
  goBack: () => void;
  haptic: (type?: "impact" | "notification" | "selection") => void;
  refreshBalance: () => Promise<void>;
}

/* ===================================================================== */

const TelegramContext = createContext<TelegramContextType>({
  webApp: null,
  user: null,
  initData: "",
  balance: 0,
  isLoadingBalance: false,
  ready: false,
  isTelegram: false,
  isAdmin: false,
  isInitialized: false,
  adminSlug: null,
  botName: null,
  supportTelegram: null,
  supportTelegram2: null,
  channelTelegram: null,
  marqueeText: null,
  marqueeStyle: "standard",
  services: {},
  generateDocsConfig: null,
  isServiceActive: () => false,
  isCategoryActive: () => false,
  isDocumentActive: () => false,
  navigation: { view: "hub" },
  navigateTo: () => {},
  goBack: () => {},
  haptic: () => {},
  refreshBalance: async () => {},
});

export function useTelegram() {
  return useContext(TelegramContext);
}

/* ===================================================================== */

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [webApp, setWebApp] = useState<any>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [initData, setInitData] = useState<string>("");
  const [balance, setBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(false);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [adminSlug, setAdminSlug] = useState<string | null>(null);
  const [botName, setBotName] = useState<string | null>(null);
  const [supportTelegram, setSupportTelegram] = useState<string | null>(null);
  const [supportTelegram2, setSupportTelegram2] = useState<string | null>("@NtRheyyTech");
  const [channelTelegram, setChannelTelegram] = useState<string | null>(null);
  const [marqueeText, setMarqueeText] = useState<string | null>(null);
  const [marqueeStyle, setMarqueeStyle] = useState<string>("standard");
  const [services, setServices] = useState<Record<string, boolean>>({});
  const [generateDocsConfig, setGenerateDocsConfig] = useState<any>(null);
  const [navigation, setNavigation] = useState<NavigationState>({ view: "hub" });
  const historyRef = useRef<NavigationState[]>([{ view: "hub" }]);

  const refreshBalance = useCallback(async () => {
    const rawData = initData || (window as any).Telegram?.WebApp?.initData || "";
    if (!rawData) return;
    setIsLoadingBalance(true);
    try {
      const res = await fetch("/api/proxy/api/me", {
        headers: {
          "x-telegram-init-data": rawData,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.balance === "number") {
          setBalance(data.balance);
        }
        setIsAdmin(Boolean(data.admin));
        setAdminSlug(data.admin_slug || null);
        if (data.bot_name !== undefined) {
          const bName = data.bot_name || null;
          setBotName(bName);
          if (bName && typeof document !== "undefined") {
            document.title = bName;
          }
        }
        setSupportTelegram(data.support_telegram || null);
        if (data.support_telegram2 !== undefined) {
          setSupportTelegram2(data.support_telegram2 || null);
        }
        setChannelTelegram(data.channel_telegram || null);
        if (data.marquee_text !== undefined) {
          setMarqueeText(data.marquee_text || null);
        }
        if (data.marquee_style) {
          setMarqueeStyle(data.marquee_style);
        }
        if (data.services && typeof data.services === "object") {
          setServices(data.services);
        }
        if (data.generateDocs && typeof data.generateDocs === "object") {
          setGenerateDocsConfig(data.generateDocs);
        }
        if (data.username || data.first_name) {
          setUser((prev) => ({
            id: data.id || prev?.id || 0,
            first_name: data.first_name || prev?.first_name || "",
            username: data.username || prev?.username,
            admin: Boolean(data.admin),
          }));
        }
      }
    } catch {
    } finally {
      setIsLoadingBalance(false);
      setIsInitialized(true);
    }
  }, [initData]);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      tg.setHeaderColor("#060710");
      tg.setBackgroundColor("#060710");
      setWebApp(tg);
      setUser(tg.initDataUnsafe?.user || null);
      const raw = tg.initData || "";
      setInitData(raw);
      setReady(true);
    } else {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (initData) {
      refreshBalance();
    }
  }, [initData, refreshBalance]);

  const navigateTo = useCallback(
    (view: NavigationState["view"], category?: string, slug?: string) => {
      const nextState: NavigationState = { view, category, slug };
      historyRef.current.push(nextState);
      setNavigation(nextState);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    []
  );

  const goBack = useCallback(() => {
    if (historyRef.current.length > 1) {
      historyRef.current.pop();
      const prev = historyRef.current[historyRef.current.length - 1];
      setNavigation(prev);
    } else {
      const hubState: NavigationState = { view: "hub" };
      historyRef.current = [hubState];
      setNavigation(hubState);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const tg = webApp || (window as any).Telegram?.WebApp;
    if (!tg?.BackButton) return;

    if (navigation.view !== "hub") {
      tg.BackButton.show();
      const handleBackClick = () => goBack();
      tg.BackButton.onClick(handleBackClick);
      return () => {
        tg.BackButton.offClick(handleBackClick);
      };
    } else {
      tg.BackButton.hide();
    }
  }, [navigation, webApp, goBack]);

  const haptic = useCallback((type: "impact" | "notification" | "selection" = "impact") => {
    const tg = (window as any).Telegram?.WebApp?.HapticFeedback;
    if (!tg) return;
    if (type === "impact") tg.impactOccurred("light");
    else if (type === "notification") tg.notificationOccurred("success");
    else tg.selectionChanged();
  }, []);

  const isServiceActive = useCallback(
    (slug: string): boolean => {
      if (slug === "generate-docs") {
        return Boolean(services["generate-docs"] && generateDocsConfig?.isActive);
      }
      if (services[slug] === false) return false;
      return true;
    },
    [services, generateDocsConfig]
  );

  const isCategoryActive = useCallback(
    (catSlug: string): boolean => {
      if (!isServiceActive("generate-docs")) return false;
      if (!generateDocsConfig?.subcategories) return true;
      const cat = generateDocsConfig.subcategories[catSlug];
      if (!cat) return true;
      if (cat.active === false || cat.enabled === false) return false;
      return true;
    },
    [isServiceActive, generateDocsConfig]
  );

  const isDocumentActive = useCallback(
    (catSlug: string, docSlug: string): boolean => {
      if (!isCategoryActive(catSlug)) return false;
      if (!generateDocsConfig?.subcategories) return true;
      const cat = generateDocsConfig.subcategories[catSlug];
      if (!cat || !cat.documents) return true;
      if (cat.documents[docSlug] === false) return false;
      return true;
    },
    [isCategoryActive, generateDocsConfig]
  );

  const isTelegram = Boolean(initData && initData.length > 0);

  return (
    <TelegramContext.Provider
      value={{
        webApp,
        user,
        initData,
        balance,
        isLoadingBalance,
        ready,
        isTelegram,
        isAdmin,
        isInitialized,
        adminSlug,
        botName,
        supportTelegram,
        supportTelegram2,
        channelTelegram,
        marqueeText,
        marqueeStyle,
        services,
        generateDocsConfig,
        isServiceActive,
        isCategoryActive,
        isDocumentActive,
        navigation,
        navigateTo,
        goBack,
        haptic,
        refreshBalance,
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
}
