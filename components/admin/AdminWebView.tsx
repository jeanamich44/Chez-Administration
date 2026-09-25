"use client";

import { useState, useEffect } from "react";
import { 
  Shield, 
  LayoutDashboard, 
  Users, 
  Package, 
  FileText, 
  Settings, 
  TrendingUp, 
  LogOut, 
  RefreshCw, 
  Search,
  Tv
} from "lucide-react";
import { useToast } from "@/components/NotificationToast";

/* ===================================================================== */

interface AdminWebViewProps {
  onLogout: () => void;
}

type AdminWebTab = "dashboard" | "users" | "stock" | "docs" | "system";

interface AdminStats {
  users_count: number;
  payments_count: number;
  payments_volume: number;
  generations_count: number;
  timestamp: string;
}

/* ===================================================================== */

export default function AdminWebView({ onLogout }: AdminWebViewProps) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<AdminWebTab>("dashboard");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeBank, setActiveBank] = useState<string>("bank2");
  const [maintenance, setMaintenance] = useState<boolean>(false);

  /* ===================================================================== */

  const fetchStats = async () => {
    setLoading(true);
    const token = localStorage.getItem("admin_auth_token") || "";
    try {
      const res = await fetch("/api/proxy/admin/stats", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      toast.error("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  /* ===================================================================== */

  return (
    <div className="min-h-screen bg-[#07090e] text-white flex flex-col font-sans">
      <header className="h-16 border-b border-white/[0.08] bg-[#0c0e17]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-sky-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-primary/20">
            <Shield size={20} />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wider uppercase text-white">ChezRheyy Admin</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-rose-500/20 hover:border-rose-500/30 hover:text-rose-400 text-white/70 text-xs font-bold transition-colors"
          >
            <LogOut size={14} />
            <span>Déconnexion</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex">
        <aside className="w-64 border-r border-white/[0.08] bg-[#090b12] p-4 flex flex-col gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "dashboard"
                ? "bg-primary text-slate-950 shadow-lg shadow-primary/20 font-black"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <LayoutDashboard size={16} />
            <span>Tableau de bord</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "users"
                ? "bg-primary text-slate-950 shadow-lg shadow-primary/20 font-black"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Users size={16} />
            <span>Utilisateurs & Soldes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("stock")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "stock"
                ? "bg-primary text-slate-950 shadow-lg shadow-primary/20 font-black"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Package size={16} />
            <span>Services</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("docs")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "docs"
                ? "bg-primary text-slate-950 shadow-lg shadow-primary/20 font-black"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <FileText size={16} />
            <span>Générateurs de Docs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("system")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "system"
                ? "bg-primary text-slate-950 shadow-lg shadow-primary/20 font-black"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Settings size={16} />
            <span>Système & Passerelles</span>
          </button>
        </aside>

        <main className="flex-1 p-8 overflow-y-auto max-w-7xl">
          {activeTab === "dashboard" && (
            <div className="space-y-6 fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-white">Métriques</h2>
                </div>
                <button
                  type="button"
                  onClick={fetchStats}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white text-xs font-bold"
                >
                  <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                  <span>Actualiser</span>
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="bg-[#0f121d] rounded-2xl p-5 border border-white/[0.08]">
                  <div className="flex items-center justify-between text-white/40 mb-3">
                    <span className="text-xs font-black uppercase tracking-wider">Clients</span>
                    <Users size={16} className="text-sky-400" />
                  </div>
                  <div className="text-3xl font-black text-white">
                    {loading ? "..." : stats?.users_count ?? 0}
                  </div>
                </div>

                <div className="bg-[#0f121d] rounded-2xl p-5 border border-white/[0.08]">
                  <div className="flex items-center justify-between text-white/40 mb-3">
                    <span className="text-xs font-black uppercase tracking-wider">Recharges</span>
                    <TrendingUp size={16} className="text-emerald-400" />
                  </div>
                  <div className="text-3xl font-black text-white">
                    {loading ? "..." : `${(stats?.payments_volume ?? 0).toFixed(2)}€`}
                  </div>
                  <p className="text-[11px] text-emerald-400 font-bold mt-2">
                    {stats?.payments_count ?? 0} paiements
                  </p>
                </div>

                <div className="bg-[#0f121d] rounded-2xl p-5 border border-white/[0.08]">
                  <div className="flex items-center justify-between text-white/40 mb-3">
                    <span className="text-xs font-black uppercase tracking-wider">Documents</span>
                    <FileText size={16} className="text-amber-400" />
                  </div>
                  <div className="text-3xl font-black text-white">
                    {loading ? "..." : stats?.generations_count ?? 0}
                  </div>
                </div>

                <div className="bg-[#0f121d] rounded-2xl p-5 border border-white/[0.08]">
                  <div className="flex items-center justify-between text-white/40 mb-3">
                    <span className="text-xs font-black uppercase tracking-wider">Services</span>
                    <Package size={16} className="text-violet-400" />
                  </div>
                  <div className="text-3xl font-black text-white">Carrefour / IPTV</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-6 fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-white">Utilisateurs</h2>
                </div>
                <div className="relative w-80">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    placeholder="Filtrer par ID Telegram ou @pseudo..."
                    className="w-full bg-[#0f121d] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              <div className="bg-[#0f121d] rounded-2xl p-8 border border-white/[0.08] text-center space-y-3">
                <Users size={40} className="mx-auto text-primary/40" />
                <h3 className="text-sm font-black text-white">Module Utilisateurs</h3>
                <p className="text-xs text-white/40 max-w-md mx-auto">
                  Consultation des comptes, crédits/débits et modération.
                </p>
              </div>
            </div>
          )}

          {activeTab === "stock" && (
            <div className="space-y-6 fade-in">
              <div>
                <h2 className="text-xl font-black text-white">Services</h2>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-[#0f121d] rounded-2xl p-6 border border-white/[0.08] space-y-4">
                  <div className="flex items-center gap-3">
                    <Package size={20} className="text-primary" />
                    <div>
                      <h3 className="text-sm font-black text-white">Stock Carrefour</h3>
                    </div>
                  </div>
                  <p className="text-xs text-white/60">
                    Schéma d'importation en masse <code className="text-primary font-mono">CODE|PIN|VALEUR|PRIX</code>.
                  </p>
                </div>

                <div className="bg-[#0f121d] rounded-2xl p-6 border border-white/[0.08] space-y-4">
                  <div className="flex items-center gap-3">
                    <Tv size={20} className="text-sky-400" />
                    <div>
                      <h3 className="text-sm font-black text-white">Services IPTV</h3>
                    </div>
                  </div>
                  <p className="text-xs text-white/60">
                    Lignes Xtream et quota de démos.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "docs" && (
            <div className="space-y-6 fade-in">
              <div>
                <h2 className="text-xl font-black text-white">Générateurs de Documents</h2>
              </div>

              <div className="bg-[#0f121d] rounded-2xl p-8 border border-white/[0.08] text-center space-y-3">
                <FileText size={40} className="mx-auto text-primary/40" />
                <h3 className="text-sm font-black text-white">Générateurs Raccordés</h3>
                <p className="text-xs text-white/40 max-w-md mx-auto">
                  RIB, Fiches de paie, Relevés, Factures et Assurances.
                </p>
              </div>
            </div>
          )}

          {activeTab === "system" && (
            <div className="space-y-6 fade-in">
              <div>
                <h2 className="text-xl font-black text-white">Système & Passerelles</h2>
              </div>

              <div className="bg-[#0f121d] rounded-2xl p-6 border border-white/[0.08] space-y-6 max-w-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-white">Compte d'Encaissement SumUp Actif</h3>
                  </div>
                  <div className="flex rounded-xl bg-white/5 p-1 border border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveBank("bank1");
                        toast.success("Banque 1 activée");
                      }}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold ${
                        activeBank === "bank1" ? "bg-primary text-slate-950 font-black" : "text-white/50"
                      }`}
                    >
                      Banque 1
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveBank("bank2");
                        toast.success("Banque 2 activée");
                      }}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold ${
                        activeBank === "bank2" ? "bg-primary text-slate-950 font-black" : "text-white/50"
                      }`}
                    >
                      Banque 2
                    </button>
                  </div>
                </div>

                <div className="h-px bg-white/[0.06]" />

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-white">Mode Maintenance Général</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newState = !maintenance;
                      setMaintenance(newState);
                      if (newState) toast.error("Mode maintenance activé");
                      else toast.success("Mode maintenance désactivé");
                    }}
                    className={`w-14 h-7 rounded-full transition-colors relative p-1 ${
                      maintenance ? "bg-rose-500" : "bg-white/10"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        maintenance ? "translate-x-7" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
