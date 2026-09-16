"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface NavigationState {
  view: "hub" | "category" | "form";
  category?: string;
  slug?: string;
}

interface TelegramContextType {
  webApp: any;
  user: TelegramUser | null;
  ready: boolean;
  navigation: NavigationState;
  navigateTo: (view: NavigationState["view"], category?: string, slug?: string) => void;
  goBack: () => void;
  haptic: (type?: "impact" | "notification" | "selection") => void;
}

const TelegramContext = createContext<TelegramContextType>({
  webApp: null,
  user: null,
  ready: false,
  navigation: { view: "hub" },
  navigateTo: () => {},
  goBack: () => {},
  haptic: () => {},
});

export function useTelegram() {
  return useContext(TelegramContext);
}

/* ===================================================================== */

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [webApp, setWebApp] = useState<any>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [ready, setReady] = useState(false);
  const [navigation, setNavigation] = useState<NavigationState>({ view: "hub" });
  const historyRef = useRef<NavigationState[]>([{ view: "hub" }]);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      tg.setHeaderColor("#060710");
      tg.setBackgroundColor("#060710");
      setWebApp(tg);
      setUser(tg.initDataUnsafe?.user || null);
      setReady(true);
    } else {
      setReady(true);
    }
  }, []);

  const updateBackButton = useCallback((nav: NavigationState) => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg?.BackButton) return;
    if (nav.view === "hub") {
      tg.BackButton.hide();
    } else {
      tg.BackButton.show();
    }
  }, []);

  const navigateTo = useCallback((view: NavigationState["view"], category?: string, slug?: string) => {
    const newState: NavigationState = { view, category, slug };
    historyRef.current.push(newState);
    setNavigation(newState);
    updateBackButton(newState);
    window.scrollTo(0, 0);
  }, [updateBackButton]);

  const goBack = useCallback(() => {
    if (historyRef.current.length > 1) {
      historyRef.current.pop();
      const prev = historyRef.current[historyRef.current.length - 1];
      setNavigation(prev);
      updateBackButton(prev);
      window.scrollTo(0, 0);
    }
  }, [updateBackButton]);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg?.BackButton) return;
    const handler = () => goBack();
    tg.BackButton.onClick(handler);
    return () => tg.BackButton.offClick(handler);
  }, [goBack]);

  const haptic = useCallback((type: "impact" | "notification" | "selection" = "impact") => {
    const tg = (window as any).Telegram?.WebApp?.HapticFeedback;
    if (!tg) return;
    if (type === "impact") tg.impactOccurred("light");
    else if (type === "notification") tg.notificationOccurred("success");
    else tg.selectionChanged();
  }, []);

  return (
    <TelegramContext.Provider value={{ webApp, user, ready, navigation, navigateTo, goBack, haptic }}>
      {children}
    </TelegramContext.Provider>
  );
}
