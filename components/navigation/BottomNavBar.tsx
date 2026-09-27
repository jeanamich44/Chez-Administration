"use client";

import { LayoutGrid, Wallet, Settings2 } from "lucide-react";
import { useTelegram } from "@/components/TelegramContext";

/* ===================================================================== */

export type MainTab = "services" | "recharge" | "settings";

interface BottomNavBarProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
}

/* ===================================================================== */

export default function BottomNavBar({ activeTab, onTabChange }: BottomNavBarProps) {
  const { haptic } = useTelegram();

  const handleSelect = (tab: MainTab) => {
    if (tab !== activeTab) {
      haptic("selection");
      onTabChange(tab);
    }
  };

  const tabs: { id: MainTab; label: string; icon: typeof LayoutGrid }[] = [
    { id: "services", label: "Services", icon: LayoutGrid },
    { id: "recharge", label: "Recharge", icon: Wallet },
    { id: "settings", label: "Réglages", icon: Settings2 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#080b14]/92 backdrop-blur-xl border-t border-white/[0.08] px-4 py-2 pb-4">
      <div className="max-w-md mx-auto flex items-center justify-around gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelect(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 relative ${
                isActive
                  ? "text-primary"
                  : "text-white/40 hover:text-white/70 active:scale-95"
              }`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-primary/10 rounded-2xl border border-primary/20 -z-10" />
              )}
              <Icon size={20} className={isActive ? "stroke-[2.5]" : "stroke-[1.8]"} />
              <span className={`text-[10px] tracking-wider mt-1 ${isActive ? "font-black" : "font-medium text-white/50"}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
