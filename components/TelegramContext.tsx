"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

// ----------------------------------------------------
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

// ----------------------------------------------------
interface TelegramContextType {
  user: TelegramUser | null;
  initData: string;
  isExpanded: boolean;
  hapticFeedback: (type?: "light" | "medium" | "heavy" | "success" | "error") => void;
  closeApp: () => void;
}

const TelegramContext = createContext<TelegramContextType>({
  user: null,
  initData: "",
  isExpanded: false,
  hapticFeedback: () => {},
  closeApp: () => {}
});

// ----------------------------------------------------
export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [initData, setInitData] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      tg.ready();
      tg.expand();
      setIsExpanded(true);

      if (tg.initDataUnsafe?.user) {
        setUser(tg.initDataUnsafe.user);
      }
      if (tg.initData) {
        setInitData(tg.initData);
      }
    }
  }, []);

  const hapticFeedback = (type: "light" | "medium" | "heavy" | "success" | "error" = "light") => {
    if (typeof window !== "undefined" && (window as any).Telegram?.WebApp?.HapticFeedback) {
      const haptic = (window as any).Telegram.WebApp.HapticFeedback;
      if (type === "success" || type === "error") {
        haptic.notificationOccurred(type);
      } else {
        haptic.impactOccurred(type);
      }
    }
  };

  const closeApp = () => {
    if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
      (window as any).Telegram.WebApp.close();
    }
  };

  return (
    <TelegramContext.Provider
      value={{
        user,
        initData,
        isExpanded,
        hapticFeedback,
        closeApp
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
}

// ----------------------------------------------------
export function useTelegram() {
  return useContext(TelegramContext);
}
