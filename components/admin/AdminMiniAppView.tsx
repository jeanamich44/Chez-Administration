"use client";

import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Shield, 
  LayoutDashboard, 
  Users, 
  Package, 
  FileText, 
  Settings, 
  TrendingUp, 
  Wallet, 
  Activity, 
  RefreshCw,
  Search,
  CheckCircle2,
  Sliders,
  AlertCircle
} from "lucide-react";
import { useTelegram } from "@/components/TelegramContext";
import { useToast } from "@/components/NotificationToast";

/* ===================================================================== */

interface AdminMiniAppViewProps {
  onBack: () => void;
}

type AdminTab = "dashboard" | "users" | "stock" | "docs" | "system";

interface AdminStats {
  users_count: number;
  payments_count: number;
  payments_volume: number;
  generations_count: number;
  timestamp: string;
}

/* ===================================================================== */

export default function AdminMiniAppView({ onBack }: AdminMiniAppViewProps) {
  const { haptic } = useTelegram();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeBank, setActiveBank] = useState<string>("bank2");
  const [maintenance, setMaintenance] = useState<boolean>(false);

  /* ===================================================================== */

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/proxy/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      toast.error("Impossible de joindre le serveur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleTabChange = (tab: AdminTab) => {
    haptic("selection");
    setActiveTab(tab);
  };

  /* ===================================================================== */

  return (
    <div className="space-y-4 pb-24 fade-in">
      <div className="flex items-center justify-between bg-[#0f121d]/90 backdrop-blur-md rounded-2xl p-4 border border-white/[0.08]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              haptic("impact");
              onBack();
            }}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-primary" />
              <h1 className="text-sm font-black tracking-wider text-white uppercase">Panel Admin TMA</h1>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          EN DIRECT
        </div>
      </div>

      <div className="grid grid-cols-5 gap-1.5 bg-[#0a0d16]/80 p-1.5 rounded-2xl border border-white/[0.06]">
        <button
          type="button"
          onClick={() => handleTabChange("dashboard")}
          className={`flex flex-col items-center justify-center py-2.5 rounded-xl transition-all ${
            activeTab === "dashboard"
              ? "bg-primary text-slate-950 font-black shadow-lg shadow-primary/20"
              : "text-white/50 hover:text-white"
          }`}
        >
          <LayoutDashboard size={16} />
          <span className="text-[9px] mt-1 font-bold">Stats</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("users")}
          className={`flex flex-col items-center justify-center py-2.5 rounded-xl transition-all ${
            activeTab === "users"
              ? "bg-primary text-slate-950 font-black shadow-lg shadow-primary/20"
              : "text-white/50 hover:text-white"
          }`}
        >
          <Users size={16} />
          <span className="text-[9px] mt-1 font-bold">Clients</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("stock")}
          className={`flex flex-col items-center justify-center py-2.5 rounded-xl transition-all ${
            activeTab === "stock"
              ? "bg-primary text-slate-950 font-black shadow-lg shadow-primary/20"
              : "text-white/50 hover:text-white"
          }`}
        >
          <Package size={16} />
          <span className="text-[9px] mt-1 font-bold">Services</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("docs")}
          className={`flex flex-col items-center justify-center py-2.5 rounded-xl transition-all ${
            activeTab === "docs"
              ? "bg-primary text-slate-950 font-black shadow-lg shadow-primary/20"
              : "text-white/50 hover:text-white"
          }`}
        >
          <FileText size={16} />
          <span className="text-[9px] mt-1 font-bold">Docs</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("system")}
          className={`flex flex-col items-center justify-center py-2.5 rounded-xl transition-all ${
            activeTab === "system"
              ? "bg-primary text-slate-950 font-black shadow-lg shadow-primary/20"
              : "text-white/50 hover:text-white"
          }`}
        >
          <Settings size={16} />
          <span className="text-[9px] mt-1 font-bold">Système</span>
        </button>
      </div>

      {activeTab === "dashboard" && (
        <div className="space-y-3 fade-in">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0f121d]/80 rounded-2xl p-4 border border-white/[0.08] relative overflow-hidden">
              <div className="flex items-center justify-between text-white/40 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider">Clients TMA</span>
                <Users size={14} className="text-sky-400" />
              </div>
              <div className="text-2xl font-black text-white">
                {loading ? "..." : stats?.users_count ?? 0}
              </div>
            </div>

            <div className="bg-[#0f121d]/80 rounded-2xl p-4 border border-white/[0.08] relative overflow-hidden">
              <div className="flex items-center justify-between text-white/40 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider">Recharges</span>
                <TrendingUp size={14} className="text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white">
                {loading ? "..." : `${(stats?.payments_volume ?? 0).toFixed(2)}€`}
              </div>
              <span className="text-[9px] text-emerald-400 font-bold">
                {stats?.payments_count ?? 0} paiements
              </span>
            </div>

            <div className="bg-[#0f121d]/80 rounded-2xl p-4 border border-white/[0.08] relative overflow-hidden">
              <div className="flex items-center justify-between text-white/40 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider">Documents</span>
                <FileText size={14} className="text-amber-400" />
              </div>
              <div className="text-2xl font-black text-white">
                {loading ? "..." : stats?.generations_count ?? 0}
              </div>
            </div>

            <div className="bg-[#0f121d]/80 rounded-2xl p-4 border border-white/[0.08] relative overflow-hidden">
              <div className="flex items-center justify-between text-white/40 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider">Services</span>
                <Package size={14} className="text-violet-400" />
              </div>
              <div className="text-2xl font-black text-white">Actif</div>
            </div>
          </div>

          <div className="bg-[#0f121d]/80 rounded-2xl p-4 border border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity size={18} className="text-primary" />
              <p className="text-xs font-bold text-white">Statut des services</p>
            </div>
            <button
              type="button"
              onClick={fetchStats}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="space-y-3 fade-in">
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Rechercher par ID Telegram ou @pseudo..."
              className="w-full bg-[#0f121d]/90 border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50"
            />
          </div>
          <div className="bg-[#0f121d]/80 rounded-2xl p-6 border border-white/[0.08] text-center space-y-2">
            <Users size={32} className="mx-auto text-primary/40" />
            <p className="text-xs font-bold text-white">Gestion des Utilisateurs</p>
            <p className="text-[10px] text-white/40 max-w-xs mx-auto">
              Modification de solde en direct, application de sanctions et consultation des logs d'achat.
            </p>
          </div>
        </div>
      )}

      {activeTab === "stock" && (
        <div className="space-y-3 fade-in">
          <div className="bg-[#0f121d]/80 rounded-2xl p-6 border border-white/[0.08] text-center space-y-2">
            <Package size={32} className="mx-auto text-primary/40" />
            <p className="text-xs font-bold text-white">Boutique & Inventaire Stock</p>
            <p className="text-[10px] text-white/40 max-w-xs mx-auto">
              Importation massive de cartes Carrefour au format CODE|PIN|PRIX et gestion des comptes IPTV.
            </p>
          </div>
        </div>
      )}

      {activeTab === "docs" && (
        <div className="space-y-3 fade-in">
          <div className="bg-[#0f121d]/80 rounded-2xl p-6 border border-white/[0.08] text-center space-y-2">
            <FileText size={32} className="mx-auto text-primary/40" />
            <p className="text-xs font-bold text-white">Générateurs de Documents</p>
            <p className="text-[10px] text-white/40 max-w-xs mx-auto">
              Activation et coupure instantanée des formulaires RIB, Fiches de paie, Relevés, Factures et Assurances.
            </p>
          </div>
        </div>
      )}

      {activeTab === "system" && (
        <div className="space-y-3 fade-in">
          <div className="bg-[#0f121d]/80 rounded-2xl p-4 border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Compte Bancaire SumUp Actif</p>
                <p className="text-[10px] text-white/40">Rotation des encaissements</p>
              </div>
              <div className="flex rounded-xl bg-white/5 p-1 border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    haptic("selection");
                    setActiveBank("bank1");
                    toast.success("Banque 1 sélectionnée");
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    activeBank === "bank1" ? "bg-primary text-slate-950" : "text-white/50"
                  }`}
                >
                  Bank 1
                </button>
                <button
                  type="button"
                  onClick={() => {
                    haptic("selection");
                    setActiveBank("bank2");
                    toast.success("Banque 2 sélectionnée");
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    activeBank === "bank2" ? "bg-primary text-slate-950" : "text-white/50"
                  }`}
                >
                  Bank 2
                </button>
              </div>
            </div>

            <div className="h-px bg-white/[0.06]" />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Mode Maintenance</p>
                <p className="text-[10px] text-white/40">Bloque l'accès aux clients</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  haptic("impact");
                  const newState = !maintenance;
                  setMaintenance(newState);
                  if (newState) toast.error("Maintenance activée");
                  else toast.success("Maintenance désactivée");
                }}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  maintenance ? "bg-rose-500" : "bg-white/10"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    maintenance ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
