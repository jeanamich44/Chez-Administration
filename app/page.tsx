"use client";

import React, { useState } from "react";
import {
  Briefcase,
  CreditCard,
  FileText,
  Shield,
  FileCheck,
  ChevronRight,
  Sparkles,
  Smartphone
} from "lucide-react";
import { CATEGORIES_DATA, CategoryMeta, DocSubItem } from "@/types";
import { TelegramProvider, useTelegram } from "@/components/TelegramContext";
import { ToastProvider } from "@/components/NotificationToast";
import DocumentForm from "@/components/DocumentForm";

// ----------------------------------------------------
function AppContent() {
  const { user, hapticFeedback } = useTelegram();
  const [selectedCategory, setSelectedCategory] = useState<string>("rib");
  const [activeItem, setActiveItem] = useState<DocSubItem | null>(null);

  const getCategoryIcon = (id: string) => {
    switch (id) {
      case "rib":
        return <CreditCard className="w-5 h-5 text-emerald-400" />;
      case "emploi":
        return <Briefcase className="w-5 h-5 text-sky-400" />;
      case "releve":
        return <FileText className="w-5 h-5 text-amber-400" />;
      case "assurance":
        return <Shield className="w-5 h-5 text-indigo-400" />;
      case "facture":
        return <FileText className="w-5 h-5 text-rose-400" />;
      case "justificatif":
        return <FileCheck className="w-5 h-5 text-teal-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-emerald-400" />;
    }
  };

  const currentCategoryData = CATEGORIES_DATA.find((c) => c.id === selectedCategory) || CATEGORIES_DATA[0];

  if (activeItem) {
    return <DocumentForm item={activeItem} onBack={() => setActiveItem(null)} />;
  }

  return (
    <div className="flex flex-col min-h-screen px-4 pt-4 pb-12 max-w-lg mx-auto w-full">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-wider text-white">CHEZ RHEYY</h1>
            <p className="text-[10px] uppercase font-bold text-emerald-400 tracking-widest">
              Documents Officiels
            </p>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-xs font-semibold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{user.username ? `@${user.username}` : user.first_name}</span>
          </div>
        )}
      </div>

      <div className="mt-4 overflow-x-auto no-scrollbar flex items-center gap-2 pb-2">
        {CATEGORIES_DATA.map((cat) => {
          const isSelected = cat.id === selectedCategory;
          return (
            <button
              key={cat.id}
              onClick={() => {
                hapticFeedback("light");
                setSelectedCategory(cat.id);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 scale-100"
                  : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5"
              }`}
            >
              {getCategoryIcon(cat.id)}
              <span>{cat.title}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        <div className="mb-3">
          <h2 className="text-sm font-black text-white uppercase tracking-wider">
            {currentCategoryData.title}
          </h2>
          <p className="text-xs text-slate-400">{currentCategoryData.subtitle}</p>
        </div>

        <div className="space-y-2.5">
          {currentCategoryData.items.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                hapticFeedback("medium");
                setActiveItem(item);
              }}
              className="group flex items-center justify-between p-4 rounded-2xl bg-[#120f26] hover:bg-[#191436] border border-white/10 hover:border-emerald-500/40 transition-all cursor-pointer shadow-lg active:scale-98"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-white/5 group-hover:bg-emerald-500/10 border border-white/5 group-hover:border-emerald-500/20 text-slate-300 group-hover:text-emerald-400 transition-colors">
                  {getCategoryIcon(item.category)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-1">{item.description}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-transform group-hover:translate-x-0.5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
export default function Home() {
  return (
    <TelegramProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </TelegramProvider>
  );
}
