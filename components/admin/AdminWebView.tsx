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
  Activity, 
  RefreshCw, 
  Search,
  Server,
  CreditCard,
  Tv,
  CheckCircle2,
  AlertTriangle
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
            <p className="text-[10px] text-white/40 font-mono">Portail Central d'Administration</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Session Web Active (24h)
          </div>

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
          <div className="text-[10px] font-black uppercase tracking-wider text-white/30 px-3 py-2">
            Navigation Système
          </div>

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
            <span>Boutique & Stock Bot</span>
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

          <div className="mt-auto border-t border-white/[0.08] pt-4 px-3 space-y-2">
            <div className="flex items-center gap-2 text-[10px] text-white/40">
              <Server size={12} className="text-primary" />
              <span>Render FastAPI & Railway DB</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-emerald-400">
              <CheckCircle2 size={12} />
              <span>Système Opérationnel</span>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-8 overflow-y-auto max-w-7xl">
          {activeTab === "dashboard" && (
            <div className="space-y-6 fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-white">Métriques Globales Consolidées</h2>
                  <p className="text-xs text-white/50">Vue d'ensemble de l'activité TMA et des services convertis</p>
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
                    <span className="text-xs font-black uppercase tracking-wider">Total Clients TMA</span>
                    <Users size={16} className="text-sky-400" />
                  </div>
                  <div className="text-3xl font-black text-white">
                    {loading ? "..." : stats?.users_count ?? 0}
                  </div>
                  <p className="text-[11px] text-sky-400 font-bold mt-2">Inscrits en BDD PostgreSQL</p>
                </div>

                <div className="bg-[#0f121d] rounded-2xl p-5 border border-white/[0.08]">
                  <div className="flex items-center justify-between text-white/40 mb-3">
                    <span className="text-xs font-black uppercase tracking-wider">CA Recharges SumUp</span>
                    <TrendingUp size={16} className="text-emerald-400" />
                  </div>
                  <div className="text-3xl font-black text-white">
                    {loading ? "..." : `${(stats?.payments_volume ?? 0).toFixed(2)}€`}
                  </div>
                  <p className="text-[11px] text-emerald-400 font-bold mt-2">
                    {stats?.payments_count ?? 0} transactions validées
                  </p>
                </div>

                <div className="bg-[#0f121d] rounded-2xl p-5 border border-white/[0.08]">
                  <div className="flex items-center justify-between text-white/40 mb-3">
                    <span className="text-xs font-black uppercase tracking-wider">Documents Produits</span>
                    <FileText size={16} className="text-amber-400" />
                  </div>
                  <div className="text-3xl font-black text-white">
                    {loading ? "..." : stats?.generations_count ?? 0}
                  </div>
                  <p className="text-[11px] text-amber-400 font-bold mt-2">Générations Weasyprint</p>
                </div>

                <div className="bg-[#0f121d] rounded-2xl p-5 border border-white/[0.08]">
                  <div className="flex items-center justify-between text-white/40 mb-3">
                    <span className="text-xs font-black uppercase tracking-wider">Services Ancien Bot</span>
                    <Package size={16} className="text-violet-400" />
                  </div>
                  <div className="text-3xl font-black text-white">Carrefour / IPTV</div>
                  <p className="text-[11px] text-violet-400 font-bold mt-2">Boutique & Démo prêts</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-6 fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-white">Gestion des Utilisateurs</h2>
                  <p className="text-xs text-white/50">Consultation des comptes, ajustement des soldes et sanctions</p>
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
                <h3 className="text-sm font-black text-white">Module Utilisateurs (Structure Initiale)</h3>
                <p className="text-xs text-white/40 max-w-md mx-auto">
                  La structure de données et la dépendance API sont configurées. Les actions de crédit, débit et banissement direct seront branchées sur ce tableau.
                </p>
              </div>
            </div>
          )}

          {activeTab === "stock" && (
            <div className="space-y-6 fade-in">
              <div>
                <h2 className="text-xl font-black text-white">Inventaire Stock & Services Bot</h2>
                <p className="text-xs text-white/50">Gestion du stock Carrefour et des flux IPTV hérités</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-[#0f121d] rounded-2xl p-6 border border-white/[0.08] space-y-4">
                  <div className="flex items-center gap-3">
                    <Package size={20} className="text-primary" />
                    <div>
                      <h3 className="text-sm font-black text-white">Stock Cartes Carrefour</h3>
                      <p className="text-xs text-white/40">Codes et PINs numériques</p>
                    </div>
                  </div>
                  <p className="text-xs text-white/60">
                    Schéma d'importation en masse <code className="text-primary font-mono">CODE|PIN|VALEUR|PRIX</code> prêt pour raccordement BDD.
                  </p>
                </div>

                <div className="bg-[#0f121d] rounded-2xl p-6 border border-white/[0.08] space-y-4">
                  <div className="flex items-center gap-3">
                    <Tv size={20} className="text-sky-400" />
                    <div>
                      <h3 className="text-sm font-black text-white">Services IPTV</h3>
                      <p className="text-xs text-white/40">Abonnements et tests gratuits</p>
                    </div>
                  </div>
                  <p className="text-xs text-white/60">
                    Schéma de gestion des lignes Xtream et quota de démos prêt pour raccordement API panel.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "docs" && (
            <div className="space-y-6 fade-in">
              <div>
                <h2 className="text-xl font-black text-white">Contrôle des Générateurs de Documents</h2>
                <p className="text-xs text-white/50">Gestion de l'accessibilité des 5 hubs de documents officiels</p>
              </div>

              <div className="bg-[#0f121d] rounded-2xl p-8 border border-white/[0.08] text-center space-y-3">
                <FileText size={40} className="mx-auto text-primary/40" />
                <h3 className="text-sm font-black text-white">Générateurs Raccordés</h3>
                <p className="text-xs text-white/40 max-w-md mx-auto">
                  Les 17 banques RIB, Fiches de paie, Relevés LBP, Factures et Assurances sont monitorés.
                </p>
              </div>
            </div>
          )}

          {activeTab === "system" && (
            <div className="space-y-6 fade-in">
              <div>
                <h2 className="text-xl font-black text-white">Configuration Système & Passerelles</h2>
                <p className="text-xs text-white/50">Paramétrage technique des banques SumUp et maintenance</p>
              </div>

              <div className="bg-[#0f121d] rounded-2xl p-6 border border-white/[0.08] space-y-6 max-w-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-white">Compte d'Encaissement SumUp Actif</h3>
                    <p className="text-xs text-white/40">Bascule de sécurité entre les deux comptes déclarés</p>
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
                    <p className="text-xs text-white/40">Interrompt l'accès public tout en maintenant l'accès admin</p>
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
