"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Shield, 
  LayoutDashboard, 
  Users, 
  ShoppingCart, 
  Tv, 
  FileText, 
  Settings, 
  LogOut, 
  RefreshCw, 
  Search,
  X
} from "lucide-react";
import { useToast } from "@/components/NotificationToast";

/* ===================================================================== */

interface AdminWebViewProps {
  onLogout: () => void;
}

type AdminWebTab = "dashboard" | "users" | "carrefour" | "iptv" | "docs" | "system";

interface AdminStats {
  users_count: number;
  payments_count: number;
  payments_volume: number;
  generations_count: number;
  timestamp: string;
}

interface AdminUser {
  id: string;
  username: string;
  balance: number;
  ordersCount: number;
  isBanned: boolean;
  registeredAt: string;
}

interface AdminTransaction {
  id: string;
  userId: string;
  service: string;
  amount: number;
  status: "completed" | "pending";
  date: string;
}

/* ===================================================================== */

export default function AdminWebView({ onLogout }: AdminWebViewProps) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<AdminWebTab>("dashboard");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeBank, setActiveBank] = useState<string>("bank2");
  const [maintenance, setMaintenance] = useState<boolean>(false);

  const [userSearch, setUserSearch] = useState<string>("");
  const [userPage, setUserPage] = useState<number>(1);
  const [usersPerPage, setUsersPerPage] = useState<number>(10);

  const [txSearch, setTxSearch] = useState<string>("");
  const [txPage, setTxPage] = useState<number>(1);
  const [txPerPage, setTxPerPage] = useState<number>(10);

  const [stockInput, setStockInput] = useState<string>("");
  const [carrefourStock, setCarrefourStock] = useState<Array<{ id: number; code: string; pin: string; val: number; price: number }>>([]);
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [transactionsList, setTransactionsList] = useState<AdminTransaction[]>([]);

  const [iptvHost, setIptvHost] = useState<string>("http://cf.business-cloud-neo.com");
  const [iptvType, setIptvType] = useState<string>("m3u");
  const [iptvPrice1m, setIptvPrice1m] = useState<string>("10");
  const [iptvPrice3m, setIptvPrice3m] = useState<string>("25");
  const [iptvPrice6m, setIptvPrice6m] = useState<string>("45");
  const [iptvPrice12m, setIptvPrice12m] = useState<string>("70");
  const [iptvFooter, setIptvFooter] = useState<string>("");

  const [activeModalUser, setActiveModalUser] = useState<AdminUser | null>(null);
  const [balanceAmount, setBalanceAmount] = useState<string>("");

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

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return usersList;
    const query = userSearch.toLowerCase();
    return usersList.filter(u => 
      u.id.toLowerCase().includes(query) || 
      u.username.toLowerCase().includes(query)
    );
  }, [usersList, userSearch]);

  const pagedUsers = useMemo(() => {
    const start = (userPage - 1) * usersPerPage;
    return filteredUsers.slice(start, start + usersPerPage);
  }, [filteredUsers, userPage, usersPerPage]);

  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));

  /* ===================================================================== */

  const filteredTx = useMemo(() => {
    if (!txSearch.trim()) return transactionsList;
    const query = txSearch.toLowerCase();
    return transactionsList.filter(t => 
      t.id.toLowerCase().includes(query) || 
      t.userId.toLowerCase().includes(query) ||
      t.service.toLowerCase().includes(query)
    );
  }, [transactionsList, txSearch]);

  const pagedTx = useMemo(() => {
    const start = (txPage - 1) * txPerPage;
    return filteredTx.slice(start, start + txPerPage);
  }, [filteredTx, txPage, txPerPage]);

  const totalTxPages = Math.max(1, Math.ceil(filteredTx.length / txPerPage));

  /* ===================================================================== */

  const handleApplyBalance = (delta: number) => {
    if (!activeModalUser) return;
    const val = parseFloat(balanceAmount);
    if (isNaN(val) || val <= 0) {
      toast.error("Veuillez saisir un montant valide");
      return;
    }

    setUsersList(prev => prev.map(u => {
      if (u.id === activeModalUser.id) {
        const updated = Math.max(0, u.balance + (delta * val));
        return { ...u, balance: updated };
      }
      return u;
    }));

    toast.success(`Solde de @${activeModalUser.username} mis à jour`);
    setActiveModalUser(null);
    setBalanceAmount("");
  };

  const handleToggleBan = (userId: string) => {
    setUsersList(prev => prev.map(u => {
      if (u.id === userId) {
        const nextState = !u.isBanned;
        if (nextState) toast.error(`Utilisateur ${u.id} banni`);
        else toast.success(`Utilisateur ${u.id} débanni`);
        return { ...u, isBanned: nextState };
      }
      return u;
    }));
  };

  const handleImportStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockInput.trim()) return;

    const lines = stockInput.trim().split("\n");
    let count = 0;
    const newItems: Array<{ id: number; code: string; pin: string; val: number; price: number }> = [];

    for (const rawLine of lines) {
      const parts = rawLine.trim().split("|");
      if (parts.length >= 3) {
        const code = parts[0].trim();
        const pin = parts.length >= 4 ? parts[1].trim() : "0000";
        const val = parseFloat(parts.length >= 4 ? parts[2] : parts[1]) || 0;
        const price = parseFloat(parts.length >= 4 ? parts[3] : parts[2]) || 0;
        newItems.push({
          id: Date.now() + count,
          code,
          pin,
          val,
          price
        });
        count++;
      }
    }

    if (count > 0) {
      setCarrefourStock(prev => [...newItems, ...prev]);
      setStockInput("");
      toast.success(`${count} carte(s) Carrefour importée(s)`);
    } else {
      toast.error("Format invalide. Utilisez CODE|PIN|VALEUR|PRIX");
    }
  };

  const handleSaveIptv = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Configuration IPTV enregistrée");
  };

  /* ===================================================================== */

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6366f1] to-[#a855f7] flex items-center justify-center text-white font-black shadow-lg shadow-[#6366f1]/25 text-base">
            ⚡
          </div>
          <span className="admin-sidebar-brand">ChezRheyy Admin</span>
        </div>

        <nav className="admin-nav-menu">
          <button
            type="button"
            onClick={() => setActiveTab("dashboard")}
            className={`admin-nav-item ${activeTab === "dashboard" ? "active" : ""}`}
          >
            <LayoutDashboard size={16} />
            <span>Vue d'Ensemble</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={`admin-nav-item ${activeTab === "users" ? "active" : ""}`}
          >
            <Users size={16} />
            <span>Utilisateurs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("carrefour")}
            className={`admin-nav-item ${activeTab === "carrefour" ? "active" : ""}`}
          >
            <ShoppingCart size={16} />
            <span>Carrefour</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("iptv")}
            className={`admin-nav-item ${activeTab === "iptv" ? "active" : ""}`}
          >
            <Tv size={16} />
            <span>IPTV</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("docs")}
            className={`admin-nav-item ${activeTab === "docs" ? "active" : ""}`}
          >
            <FileText size={16} />
            <span>Générateurs Docs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("system")}
            className={`admin-nav-item ${activeTab === "system" ? "active" : ""}`}
          >
            <Settings size={16} />
            <span>Configuration</span>
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <button
            type="button"
            onClick={onLogout}
            className="admin-btn-logout"
          >
            <LogOut size={14} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      <main className="admin-main-content">
        <header className="admin-header-bar">
          <div>
            <h1 className="admin-page-title">
              {activeTab === "dashboard" && "Vue d'Ensemble"}
              {activeTab === "users" && "Gestion des Utilisateurs"}
              {activeTab === "carrefour" && "Carrefour"}
              {activeTab === "iptv" && "IPTV"}
              {activeTab === "docs" && "Générateurs de Documents"}
              {activeTab === "system" && "Configuration Système"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchStats}
              className="admin-action-btn"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              <span>Actualiser</span>
            </button>
          </div>
        </header>

        {activeTab === "dashboard" && (
          <div className="fade-in space-y-6">
            <div className="admin-stats-grid">
              <div 
                className="admin-stat-card admin-stat-card-interactive"
                onClick={() => setActiveTab("dashboard")}
              >
                <div className="admin-stat-icon" style={{ background: "rgba(99, 102, 241, 0.15)", color: "#6366f1" }}>
                  💶
                </div>
                <div>
                  <div className="admin-stat-val">
                    {loading ? "..." : `${(stats?.payments_volume ?? 0).toFixed(2)} €`}
                  </div>
                  <div className="admin-stat-lbl">Chiffre d'Affaires Total</div>
                </div>
              </div>

              <div 
                className="admin-stat-card admin-stat-card-interactive"
                onClick={() => setActiveTab("dashboard")}
              >
                <div className="admin-stat-icon" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
                  🛒
                </div>
                <div>
                  <div className="admin-stat-val">
                    {loading ? "..." : stats?.payments_count ?? 0}
                  </div>
                  <div className="admin-stat-lbl">Paiements Validés</div>
                </div>
              </div>

              <div 
                className="admin-stat-card admin-stat-card-interactive"
                onClick={() => setActiveTab("users")}
              >
                <div className="admin-stat-icon" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}>
                  👥
                </div>
                <div>
                  <div className="admin-stat-val">
                    {loading ? "..." : stats?.users_count ?? 0}
                  </div>
                  <div className="admin-stat-lbl">Clients Enregistrés</div>
                </div>
              </div>

              <div 
                className="admin-stat-card admin-stat-card-interactive"
                onClick={() => setActiveTab("docs")}
              >
                <div className="admin-stat-icon" style={{ background: "rgba(14, 165, 233, 0.15)", color: "#0ea5e9" }}>
                  📄
                </div>
                <div>
                  <div className="admin-stat-val">
                    {loading ? "..." : stats?.generations_count ?? 0}
                  </div>
                  <div className="admin-stat-lbl">Documents Produits</div>
                </div>
              </div>
            </div>

            <div className="admin-card-panel">
              <div className="admin-card-panel-header">
                <h2 className="admin-card-panel-title">Dernières Activités Enregistrées</h2>
                <div className="relative w-72">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={txSearch}
                    onChange={(e) => {
                      setTxSearch(e.target.value);
                      setTxPage(1);
                    }}
                    placeholder="Rechercher ID, Service..."
                    className="admin-form-input pl-9"
                  />
                </div>
              </div>

              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID Transaction</th>
                      <th>Client Telegram</th>
                      <th>Service</th>
                      <th>Montant</th>
                      <th>Statut</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedTx.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-white/30 text-xs">
                          Aucune activité enregistrée
                        </td>
                      </tr>
                    ) : (
                      pagedTx.map((tx) => (
                        <tr key={tx.id}>
                          <td className="font-mono text-white/80">{tx.id}</td>
                          <td className="font-mono text-primary">{tx.userId}</td>
                          <td className="font-semibold text-white">{tx.service}</td>
                          <td className="font-bold text-emerald-400">{tx.amount.toFixed(2)} €</td>
                          <td>
                            <span className="admin-badge admin-badge-success">Validé</span>
                          </td>
                          <td className="text-white/50">{tx.date}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center mt-5 pt-4 border-t border-white/[0.06] text-xs text-white/60">
                <span>
                  Affichage {pagedTx.length > 0 ? (txPage - 1) * txPerPage + 1 : 0} à {Math.min(txPage * txPerPage, filteredTx.length)} sur {filteredTx.length} activité(s)
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={txPage <= 1}
                    onClick={() => setTxPage(p => Math.max(1, p - 1))}
                    className="admin-action-btn disabled:opacity-40"
                  >
                    ◀ Précédent
                  </button>
                  <span className="font-bold text-white">Page {txPage} / {totalTxPages}</span>
                  <button
                    type="button"
                    disabled={txPage >= totalTxPages}
                    onClick={() => setTxPage(p => Math.min(totalTxPages, p + 1))}
                    className="admin-action-btn disabled:opacity-40"
                  >
                    Suivant ▶
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="fade-in space-y-6">
            <div className="admin-card-panel">
              <div className="admin-card-panel-header">
                <h2 className="admin-card-panel-title">Comptes Clients Telegram</h2>
                <div className="relative w-80">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setUserPage(1);
                    }}
                    placeholder="Filtrer par ID Telegram ou @pseudo..."
                    className="admin-form-input pl-9"
                  />
                </div>
              </div>

              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID Telegram</th>
                      <th>Pseudo</th>
                      <th>Solde Actuel</th>
                      <th>Commandes</th>
                      <th>Statut</th>
                      <th>Inscription</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-white/30 text-xs">
                          Aucun utilisateur enregistré
                        </td>
                      </tr>
                    ) : (
                      pagedUsers.map((u) => (
                        <tr key={u.id}>
                          <td className="font-mono text-white/80">{u.id}</td>
                          <td className="font-bold text-white">@{u.username}</td>
                          <td className="font-bold text-emerald-400">{u.balance.toFixed(2)} €</td>
                          <td>{u.ordersCount}</td>
                          <td>
                            {u.isBanned ? (
                              <span className="admin-badge admin-badge-danger">Banni</span>
                            ) : (
                              <span className="admin-badge admin-badge-success">Actif</span>
                            )}
                          </td>
                          <td className="text-white/50">{u.registeredAt}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveModalUser(u);
                                  setBalanceAmount("");
                                }}
                                className="admin-action-btn"
                              >
                                💳 Solde
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleBan(u.id)}
                                className={`admin-action-btn ${u.isBanned ? "" : "admin-action-btn-danger"}`}
                              >
                                {u.isBanned ? "Débannir" : "Bannir"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center mt-5 pt-4 border-t border-white/[0.06] text-xs text-white/60">
                <span>
                  Affichage {pagedUsers.length > 0 ? (userPage - 1) * usersPerPage + 1 : 0} à {Math.min(userPage * usersPerPage, filteredUsers.length)} sur {filteredUsers.length} utilisateur(s)
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={userPage <= 1}
                    onClick={() => setUserPage(p => Math.max(1, p - 1))}
                    className="admin-action-btn disabled:opacity-40"
                  >
                    ◀ Précédent
                  </button>
                  <span className="font-bold text-white">Page {userPage} / {totalUserPages}</span>
                  <button
                    type="button"
                    disabled={userPage >= totalUserPages}
                    onClick={() => setUserPage(p => Math.min(totalUserPages, p + 1))}
                    className="admin-action-btn disabled:opacity-40"
                  >
                    Suivant ▶
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "carrefour" && (
          <div className="fade-in space-y-6">
            <div className="admin-card-panel">
              <div className="admin-card-panel-header">
                <h2 className="admin-card-panel-title">Ajout de Stock en Masse (Carrefour)</h2>
              </div>
              <form onSubmit={handleImportStock} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white/60 mb-2">
                    Format : CODE|PIN|VALEUR|PRIX (un code par ligne)
                  </label>
                  <textarea
                    rows={4}
                    value={stockInput}
                    onChange={(e) => setStockInput(e.target.value)}
                    placeholder="9876543210125|4321|50|25&#10;9876543210126|8899|100|50"
                    className="admin-form-input font-mono text-xs"
                    required
                  />
                </div>
                <button type="submit" className="admin-btn-primary">
                  📥 Importer le Stock
                </button>
              </form>
            </div>

            <div className="admin-card-panel">
              <div className="admin-card-panel-header">
                <h2 className="admin-card-panel-title">Stock Cartes Carrefour Actif ({carrefourStock.length})</h2>
              </div>

              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Code Carte</th>
                      <th>PIN</th>
                      <th>Valeur Nominale</th>
                      <th>Prix Vente</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {carrefourStock.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-white/30 text-xs">
                          Aucune carte en stock
                        </td>
                      </tr>
                    ) : (
                      carrefourStock.map((item) => (
                        <tr key={item.id}>
                          <td className="font-mono text-white/60">#{item.id}</td>
                          <td className="font-mono font-bold text-white">{item.code}</td>
                          <td className="font-mono text-white/60">{item.pin}</td>
                          <td className="font-bold text-emerald-400">{item.val} €</td>
                          <td className="font-bold text-primary">{item.price} €</td>
                          <td>
                            <button
                              type="button"
                              onClick={() => {
                                setCarrefourStock(prev => prev.filter(c => c.id !== item.id));
                                toast.success("Carte supprimée");
                              }}
                              className="admin-action-btn admin-action-btn-danger"
                            >
                              Supprimer
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "iptv" && (
          <div className="fade-in space-y-6">
            <div className="admin-card-panel">
              <div className="admin-card-panel-header">
                <h2 className="admin-card-panel-title">Tarifs IPTV & Configuration</h2>
              </div>
              <form onSubmit={handleSaveIptv} className="space-y-4 max-w-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/60 mb-1.5">Host affiché au client</label>
                    <input
                      type="text"
                      value={iptvHost}
                      onChange={(e) => setIptvHost(e.target.value)}
                      className="admin-form-input"
                      placeholder="http://cf.business-cloud-neo.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/60 mb-1.5">Type Flux</label>
                    <input
                      type="text"
                      value={iptvType}
                      onChange={(e) => setIptvType(e.target.value)}
                      className="admin-form-input"
                      placeholder="m3u"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/60 mb-1.5">Prix 1 Mois (€)</label>
                    <input
                      type="number"
                      value={iptvPrice1m}
                      onChange={(e) => setIptvPrice1m(e.target.value)}
                      className="admin-form-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/60 mb-1.5">Prix 3 Mois (€)</label>
                    <input
                      type="number"
                      value={iptvPrice3m}
                      onChange={(e) => setIptvPrice3m(e.target.value)}
                      className="admin-form-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/60 mb-1.5">Prix 6 Mois (€)</label>
                    <input
                      type="number"
                      value={iptvPrice6m}
                      onChange={(e) => setIptvPrice6m(e.target.value)}
                      className="admin-form-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/60 mb-1.5">Prix 12 Mois (€)</label>
                    <input
                      type="number"
                      value={iptvPrice12m}
                      onChange={(e) => setIptvPrice12m(e.target.value)}
                      className="admin-form-input"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/60 mb-1.5">Bas du message client</label>
                  <textarea
                    rows={3}
                    value={iptvFooter}
                    onChange={(e) => setIptvFooter(e.target.value)}
                    className="admin-form-input text-xs"
                    placeholder="Instructions supplémentaires envoyées au client..."
                  />
                </div>

                <button type="submit" className="admin-btn-primary">
                  Enregistrer IPTV
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === "docs" && (
          <div className="fade-in space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="admin-card-panel mb-0 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">RIB Bancaires</span>
                  <span className="admin-badge admin-badge-success">17 Banques</span>
                </div>
                <div className="text-xs text-white/50">Banques Physiques & Néobanques</div>
              </div>

              <div className="admin-card-panel mb-0 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">Fiches de Paie</span>
                  <span className="admin-badge admin-badge-success">Actif</span>
                </div>
                <div className="text-xs text-white/50">Bulletins 1 à 12 mois</div>
              </div>

              <div className="admin-card-panel mb-0 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">Relevés Bancaires</span>
                  <span className="admin-badge admin-badge-success">LBP Actif</span>
                </div>
                <div className="text-xs text-white/50">Comptes CCP & Livrets</div>
              </div>

              <div className="admin-card-panel mb-0 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">Factures Officielles</span>
                  <span className="admin-badge admin-badge-success">18 Modèles</span>
                </div>
                <div className="text-xs text-white/50">Luxe, Commerce & Énergie</div>
              </div>

              <div className="admin-card-panel mb-0 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">Attestations</span>
                  <span className="admin-badge admin-badge-success">Actif</span>
                </div>
                <div className="text-xs text-white/50">Maxance, AXA, Conduite</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "system" && (
          <div className="fade-in space-y-6">
            <div className="admin-card-panel max-w-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Compte d'Encaissement SumUp Actif</h3>
                </div>
                <div className="flex rounded-xl bg-white/5 p-1 border border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveBank("bank1");
                      toast.success("Banque 1 activée");
                    }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      activeBank === "bank1" ? "bg-[#6366f1] text-white" : "text-white/50"
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
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      activeBank === "bank2" ? "bg-[#6366f1] text-white" : "text-white/50"
                    }`}
                  >
                    Banque 2
                  </button>
                </div>
              </div>

              <div className="h-px bg-white/[0.06]" />

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Mode Maintenance Général</h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !maintenance;
                    setMaintenance(next);
                    if (next) toast.error("Mode maintenance activé");
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

      {activeModalUser && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-box">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.08]">
              <h3 className="text-base font-bold text-white">
                Ajuster le Solde (@{activeModalUser.username})
              </h3>
              <button
                type="button"
                onClick={() => setActiveModalUser(null)}
                className="text-white/40 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl text-xs">
                <span className="text-white/60">Solde actuel :</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {activeModalUser.balance.toFixed(2)} €
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/60 mb-1.5">
                  Montant en euros (€)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  placeholder="Ex : 20.00"
                  className="admin-form-input text-sm"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleApplyBalance(1)}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-xs hover:bg-emerald-500/30 transition-colors"
                >
                  ➕ Créditer
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyBalance(-1)}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs hover:bg-rose-500/30 transition-colors"
                >
                  ➖ Débiter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
