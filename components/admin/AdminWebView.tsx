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

interface IptvAccount {
  name: string;
  pack: string;
  api_key: string;
  api_url: string;
  active: boolean;
}

interface IptvPanelAccount {
  name: string;
  username: string;
  password: string;
  active: boolean;
}

interface SumUpBank {
  name: string;
  pay_to_email: string;
  api_key: string;
  client_id: string;
  client_secret: string;
}

/* ===================================================================== */

export default function AdminWebView({ onLogout }: AdminWebViewProps) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<AdminWebTab>("dashboard");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
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

  const [iptvHost, setIptvHost] = useState<string>("");
  const [iptvType, setIptvType] = useState<string>("");
  const [iptvPrice1m, setIptvPrice1m] = useState<string>("");
  const [iptvPrice3m, setIptvPrice3m] = useState<string>("");
  const [iptvPrice6m, setIptvPrice6m] = useState<string>("");
  const [iptvPrice12m, setIptvPrice12m] = useState<string>("");
  const [iptvFooter, setIptvFooter] = useState<string>("");
  const [iptvAccounts, setIptvAccounts] = useState<IptvAccount[]>([]);
  const [iptvPanelAccounts, setIptvPanelAccounts] = useState<IptvPanelAccount[]>([]);
  const [iptvApiTestResult, setIptvApiTestResult] = useState<string>("");
  const [iptvPanelTestResult, setIptvPanelTestResult] = useState<string>("");
  const [isTestingIptvApi, setIsTestingIptvApi] = useState<boolean>(false);
  const [isTestingIptvPanel, setIsTestingIptvPanel] = useState<boolean>(false);

  const [sumupActive, setSumupActive] = useState<"sumup" | "sumup_bank2">("sumup");
  const [sumupExpiration, setSumupExpiration] = useState<string>("");
  const [sumup1, setSumup1] = useState<SumUpBank>({ name: "", pay_to_email: "", api_key: "", client_id: "", client_secret: "" });
  const [sumup2, setSumup2] = useState<SumUpBank>({ name: "", pay_to_email: "", api_key: "", client_id: "", client_secret: "" });

  const [adminPassword, setAdminPassword] = useState<string>("");
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState<string>("");

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

  const fetchSettings = async () => {
    const token = localStorage.getItem("admin_auth_token") || "";
    try {
      const res = await fetch("/api/proxy/admin/settings", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.iptv) {
          setIptvHost(data.iptv.host || "");
          setIptvType(data.iptv.type || "");
          setIptvFooter(data.iptv.message_footer || "");
          setIptvPrice1m(String(data.iptv.price_1m ?? ""));
          setIptvPrice3m(String(data.iptv.price_3m ?? ""));
          setIptvPrice6m(String(data.iptv.price_6m ?? ""));
          setIptvPrice12m(String(data.iptv.price_12m ?? ""));
          
          if (Array.isArray(data.iptv.accounts) && data.iptv.accounts.length > 0) {
            setIptvAccounts(data.iptv.accounts.map((a: any) => ({
              name: a.name || a.Name || "",
              pack: a.pack || a.Pack || "",
              api_key: a.api_key || a.ApiKey || "",
              api_url: a.api_url || a.ApiUrl || "",
              active: !!(a.active ?? a.Active)
            })));
          } else {
            setIptvAccounts([{ name: "", pack: "", api_key: "", api_url: "", active: true }]);
          }

          if (Array.isArray(data.iptv.panel_accounts) && data.iptv.panel_accounts.length > 0) {
            setIptvPanelAccounts(data.iptv.panel_accounts.map((p: any) => ({
              name: p.name || p.Name || "",
              username: p.username || p.Username || "",
              password: p.password || p.Password || "",
              active: !!(p.active ?? p.Active)
            })));
          } else {
            setIptvPanelAccounts([{ name: "", username: "", password: "", active: true }]);
          }
        }

        if (data.sumup) {
          setSumupActive(data.sumup.active === "sumup_bank2" ? "sumup_bank2" : "sumup");
          setSumupExpiration(String(data.sumup.expiration_minutes ?? ""));
          const b1 = data.sumup.banks?.sumup || {};
          const b2 = data.sumup.banks?.sumup_bank2 || {};
          setSumup1({
            name: b1.name || "",
            pay_to_email: b1.pay_to_email || "",
            api_key: b1.api_key || "",
            client_id: b1.client_id || "",
            client_secret: b1.client_secret || ""
          });
          setSumup2({
            name: b2.name || "",
            pay_to_email: b2.pay_to_email || "",
            api_key: b2.api_key || "",
            client_id: b2.client_id || "",
            client_secret: b2.client_secret || ""
          });
        }
      }
    } catch {}

    try {
      const mRes = await fetch("/api/proxy/admin/maintenance", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (mRes.ok) {
        const mData = await mRes.json();
        setMaintenance(!!mData.maintenance);
      }
    } catch {}
  };

  const fetchStock = async () => {
    const token = localStorage.getItem("admin_auth_token") || "";
    try {
      const res = await fetch("/api/proxy/admin/stock", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.stock)) {
          setCarrefourStock(data.stock.map((s: any) => ({
            id: s.id,
            code: s.code,
            pin: s.pin || "0000",
            val: typeof s.value === "number" ? s.value : (parseFloat(s.value) || 0),
            price: typeof s.price === "number" ? s.price : (parseFloat(s.price) || 0)
          })));
        }
      }
    } catch {}
  };

  const fetchUsers = async () => {
    const token = localStorage.getItem("admin_auth_token") || "";
    try {
      const res = await fetch("/api/proxy/admin/users", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.users)) {
          setUsersList(data.users.map((u: any) => ({
            id: String(u.id),
            username: u.username || "Anonyme",
            balance: typeof u.solde === "number" ? u.solde : (parseFloat(u.solde) || 0),
            ordersCount: u.achats || 0,
            isBanned: !!u.isBanned,
            registeredAt: u.userNumber ? `#${u.userNumber}` : "N/A"
          })));
        }
      }
    } catch {}
  };

  const fetchTransactions = async () => {
    const token = localStorage.getItem("admin_auth_token") || "";
    try {
      const res = await fetch("/api/proxy/admin/transactions", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.transactions)) {
          setTransactionsList(data.transactions.map((t: any) => ({
            id: String(t.id),
            userId: String(t.userId),
            service: t.brand ? t.brand.toUpperCase() : "Achat",
            amount: typeof t.price === "number" ? t.price : (parseFloat(t.price) || 0),
            status: "completed" as const,
            date: t.createdAt ? t.createdAt.replace("T", " ") : "N/A"
          })));
        }
      }
    } catch {}
  };

  const refreshAll = () => {
    fetchStats();
    fetchSettings();
    fetchStock();
    fetchUsers();
    fetchTransactions();
  };

  useEffect(() => {
    refreshAll();
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

  const handleApplyBalance = async (delta: number) => {
    if (!activeModalUser) return;
    const val = parseFloat(balanceAmount);
    if (isNaN(val) || val <= 0) {
      toast.error("Veuillez saisir un montant valide");
      return;
    }

    const token = localStorage.getItem("admin_auth_token") || "";
    try {
      const res = await fetch("/api/proxy/admin/users/solde", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: activeModalUser.id,
          action: delta > 0 ? "add" : "remove",
          amount: val
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Solde de @${activeModalUser.username} mis à jour`);
        setActiveModalUser(null);
        setBalanceAmount("");
        fetchUsers();
      } else {
        toast.error(data.message || "Erreur lors de l'ajustement du solde");
      }
    } catch {
      toast.error("Erreur réseau");
    }
  };

  const handleToggleBan = async (userId: string, currentBanned: boolean) => {
    const token = localStorage.getItem("admin_auth_token") || "";
    try {
      const res = await fetch("/api/proxy/admin/users/ban", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          banned: !currentBanned,
          reason: "Action manuelle administrateur"
        })
      });
      const data = await res.json();
      if (data.success) {
        if (!currentBanned) toast.error(`Utilisateur ${userId} banni`);
        else toast.success(`Utilisateur ${userId} débanni`);
        fetchUsers();
      } else {
        toast.error(data.message || "Erreur ban");
      }
    } catch {
      toast.error("Erreur réseau");
    }
  };

  const handleImportStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockInput.trim()) return;

    const lines = stockInput.trim().split("\n");
    const items: Array<{ brand: string; code: string; pin: string; value: number; price: number }> = [];

    for (const rawLine of lines) {
      const parts = rawLine.trim().split("|");
      if (parts.length >= 3) {
        const code = parts[0].trim();
        const pin = parts.length >= 4 ? parts[1].trim() : "0000";
        const val = parseFloat(parts.length >= 4 ? parts[2] : parts[1]) || 0;
        const price = parseFloat(parts.length >= 4 ? parts[3] : parts[2]) || 0;
        if (code) {
          items.push({
            brand: "carr",
            code,
            pin,
            value: val,
            price
          });
        }
      }
    }

    if (items.length === 0) {
      toast.error("Format invalide. Utilisez CODE|PIN|VALEUR|PRIX");
      return;
    }

    const token = localStorage.getItem("admin_auth_token") || "";
    try {
      const res = await fetch("/api/proxy/admin/stock/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ items })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${data.count} carte(s) Carrefour importée(s)`);
        setStockInput("");
        fetchStock();
      } else {
        toast.error(data.message || "Erreur lors de l'importation");
      }
    } catch {
      toast.error("Erreur réseau");
    }
  };

  const handleDeleteStock = async (id: number) => {
    const token = localStorage.getItem("admin_auth_token") || "";
    try {
      const res = await fetch("/api/proxy/admin/stock/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Carte supprimée");
        fetchStock();
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch {
      toast.error("Erreur réseau");
    }
  };

  const handleSaveIptv = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("admin_auth_token") || "";
    try {
      const res = await fetch("/api/proxy/admin/settings/iptv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          host: iptvHost.trim(),
          type: iptvType.trim(),
          message_footer: iptvFooter,
          price_1m: iptvPrice1m.trim(),
          price_3m: iptvPrice3m.trim(),
          price_6m: iptvPrice6m.trim(),
          price_12m: iptvPrice12m.trim(),
          accounts: iptvAccounts.filter(a => a.api_key && a.api_url && a.pack),
          panel_accounts: iptvPanelAccounts
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Configuration et tarifs IPTV enregistrés");
        fetchSettings();
      } else {
        toast.error(data.message || "Erreur lors de l'enregistrement IPTV");
      }
    } catch {
      toast.error("Erreur réseau");
    }
  };

  const handleTestIptvApi = async () => {
    setIsTestingIptvApi(true);
    setIptvApiTestResult("Connexion en cours…");
    const token = localStorage.getItem("admin_auth_token") || "";
    try {
      const res = await fetch("/api/proxy/admin/iptv/api-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.success) {
        const name = data.stats?.name || "?";
        const pack = data.stats?.pack || "?";
        const type = data.stats?.type || "?";
        const credits = data.stats?.credits;
        let msg = `Connecté. Compte : ${name} — Pack : ${pack} — Type : ${type}`;
        if (credits !== undefined && credits !== null) msg += ` — Crédits : ${credits}`;
        setIptvApiTestResult(msg);
        toast.success("Connexion API OK");
      } else {
        setIptvApiTestResult(data.message || "Échec de la connexion API");
        toast.error(data.message || "Échec de la connexion API");
      }
    } catch {
      setIptvApiTestResult("Erreur réseau");
      toast.error("Erreur réseau");
    } finally {
      setIsTestingIptvApi(false);
    }
  };

  const handleTestIptvPanel = async () => {
    setIsTestingIptvPanel(true);
    setIptvPanelTestResult("Connexion en cours…");
    const token = localStorage.getItem("admin_auth_token") || "";
    try {
      const res = await fetch("/api/proxy/admin/iptv/panel-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.success) {
        const credits = data.stats?.credits ?? "?";
        const demos = data.stats?.remaining_demos ?? "?";
        setIptvPanelTestResult(`Connecté. Crédits : ${credits} — Démos restantes : ${demos}`);
        toast.success("Connexion panel OK");
      } else {
        setIptvPanelTestResult(data.message || "Échec de la connexion panel");
        toast.error(data.message || "Échec de la connexion panel");
      }
    } catch {
      setIptvPanelTestResult("Erreur réseau");
      toast.error("Erreur réseau");
    } finally {
      setIsTestingIptvPanel(false);
    }
  };

  const handleSaveSumup = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("admin_auth_token") || "";
    const payload = {
      active: sumupActive,
      expiration_minutes: sumupExpiration.trim(),
      banks: {
        sumup: {
          name: sumup1.name.trim(),
          pay_to_email: sumup1.pay_to_email.trim(),
          api_key: sumup1.api_key.trim(),
          client_id: sumup1.client_id.trim(),
          client_secret: sumup1.client_secret.trim()
        },
        sumup_bank2: {
          name: sumup2.name.trim(),
          pay_to_email: sumup2.pay_to_email.trim(),
          api_key: sumup2.api_key.trim(),
          client_id: sumup2.client_id.trim(),
          client_secret: sumup2.client_secret.trim()
        }
      }
    };
    try {
      const res = await fetch("/api/proxy/admin/settings/sumup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Comptes SumUp enregistrés");
        fetchSettings();
      } else {
        toast.error(data.message || "Erreur enregistrement SumUp");
      }
    } catch {
      toast.error("Erreur réseau");
    }
  };

  const handleToggleMaintenance = async () => {
    const next = !maintenance;
    const token = localStorage.getItem("admin_auth_token") || "";
    try {
      const res = await fetch("/api/proxy/admin/maintenance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ maintenance: next })
      });
      const data = await res.json();
      if (data.success) {
        setMaintenance(data.maintenance);
        if (data.maintenance) toast.error("Mode maintenance activé");
        else toast.success("Mode maintenance désactivé");
      }
    } catch {
      toast.error("Erreur réseau");
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword !== adminPasswordConfirm) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    const token = localStorage.getItem("admin_auth_token") || "";
    try {
      const res = await fetch("/api/proxy/admin/settings/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ password: adminPassword })
      });
      const data = await res.json();
      if (data.success) {
        if (data.token) {
          localStorage.setItem("admin_auth_token", data.token);
        }
        toast.success("Mot de passe administrateur mis à jour avec succès");
        setAdminPassword("");
        setAdminPasswordConfirm("");
      } else {
        toast.error(data.message || "Erreur lors du changement de mot de passe");
      }
    } catch {
      toast.error("Erreur réseau");
    }
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
              onClick={refreshAll}
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
                <h2 className="admin-card-panel-title">Base Clients ({filteredUsers.length})</h2>
                <div className="flex items-center gap-3">
                  <div className="relative w-72">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => {
                        setUserSearch(e.target.value);
                        setUserPage(1);
                      }}
                      placeholder="Rechercher nom, Telegram ID..."
                      className="admin-form-input pl-9"
                    />
                  </div>
                  <select
                    value={usersPerPage}
                    onChange={(e) => {
                      setUsersPerPage(Number(e.target.value));
                      setUserPage(1);
                    }}
                    className="admin-form-input w-28 text-xs"
                  >
                    <option value={10}>10 / page</option>
                    <option value={25}>25 / page</option>
                    <option value={50}>50 / page</option>
                  </select>
                </div>
              </div>

              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Identifiant</th>
                      <th>Commandes</th>
                      <th>Solde</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-white/30 text-xs">
                          Aucun utilisateur enregistré
                        </td>
                      </tr>
                    ) : (
                      pagedUsers.map((u) => (
                        <tr key={u.id}>
                          <td>
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs text-white">
                                {u.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-white">@{u.username}</div>
                                <div className="text-[11px] text-white/40">{u.registeredAt}</div>
                              </div>
                            </div>
                          </td>
                          <td className="font-mono text-white/70">{u.id}</td>
                          <td className="font-bold text-white">{u.ordersCount}</td>
                          <td>
                            <span className="font-bold text-emerald-400">
                              {u.balance.toFixed(2)} €
                            </span>
                          </td>
                          <td>
                            {u.isBanned ? (
                              <span className="admin-badge admin-badge-danger">Banni</span>
                            ) : (
                              <span className="admin-badge admin-badge-success">Actif</span>
                            )}
                          </td>
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
                                Solde
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleBan(u.id, u.isBanned)}
                                className={`admin-action-btn ${u.isBanned ? "admin-action-btn-success" : "admin-action-btn-danger"}`}
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
                              onClick={() => handleDeleteStock(item.id)}
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
                <h2 className="admin-card-panel-title">Tarifs IPTV & Configuration API</h2>
              </div>
              <form onSubmit={handleSaveIptv} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  <label className="block text-xs font-semibold text-white/60 mb-1.5">Bas du message client (texte + lien)</label>
                  <textarea
                    rows={4}
                    value={iptvFooter}
                    onChange={(e) => setIptvFooter(e.target.value)}
                    className="admin-form-input text-xs"
                    placeholder="Instructions supplémentaires envoyées au client..."
                  />
                  <span className="text-[11px] text-white/40 block mt-1.5">
                    Le haut du message (Host / Username / Password) reste fixe. Ce bloc s’affiche en dessous, en texte brut.
                  </span>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/[0.06]">
                  <label className="block text-xs font-semibold text-white/80">Comptes API (clé + pack liés)</label>
                  <div className="space-y-3">
                    {iptvAccounts.map((acc, index) => (
                      <div key={index} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-white">
                            <input
                              type="radio"
                              name="iptv-acc-active"
                              checked={acc.active}
                              onChange={() => {
                                setIptvAccounts(prev => prev.map((a, i) => ({ ...a, active: i === index })));
                              }}
                              className="accent-[#6366f1]"
                            />
                            <span>Compte actif</span>
                          </label>
                          {iptvAccounts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setIptvAccounts(prev => prev.filter((_, i) => i !== index))}
                              className="text-xs text-rose-400 hover:text-rose-300"
                            >
                              Supprimer
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] text-white/50 mb-1">Nom</label>
                            <input
                              type="text"
                              value={acc.name}
                              onChange={(e) => {
                                const val = e.target.value;
                                setIptvAccounts(prev => prev.map((a, i) => i === index ? { ...a, name: val } : a));
                              }}
                              placeholder="Compte 1"
                              className="admin-form-input text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-white/50 mb-1">Pack</label>
                            <input
                              type="text"
                              value={acc.pack}
                              onChange={(e) => {
                                const val = e.target.value;
                                setIptvAccounts(prev => prev.map((a, i) => i === index ? { ...a, pack: val } : a));
                              }}
                              placeholder="43551"
                              className="admin-form-input text-xs"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] text-white/50 mb-1">Clé API</label>
                            <input
                              type="text"
                              value={acc.api_key}
                              onChange={(e) => {
                                const val = e.target.value;
                                setIptvAccounts(prev => prev.map((a, i) => i === index ? { ...a, api_key: val } : a));
                              }}
                              placeholder="api_key"
                              className="admin-form-input text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-white/50 mb-1">URL API</label>
                            <input
                              type="text"
                              value={acc.api_url}
                              onChange={(e) => {
                                const val = e.target.value;
                                setIptvAccounts(prev => prev.map((a, i) => i === index ? { ...a, api_url: val } : a));
                              }}
                              placeholder="https://4k.cms-only.ru/api..."
                              className="admin-form-input text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIptvAccounts(prev => [...prev, { name: "", pack: "", api_key: "", api_url: "", active: false }])}
                      className="admin-action-btn"
                    >
                      ➕ Ajouter un compte
                    </button>
                    <button
                      type="button"
                      onClick={handleTestIptvApi}
                      disabled={isTestingIptvApi}
                      className="admin-action-btn"
                    >
                      {isTestingIptvApi ? "Test en cours..." : "Tester la connexion API"}
                    </button>
                  </div>
                  {iptvApiTestResult && (
                    <div className="text-xs text-primary font-mono bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.08]">
                      {iptvApiTestResult}
                    </div>
                  )}
                  <span className="text-[11px] text-white/40 block">
                    Coche <b>Compte actif</b> sur un seul compte. Seul celui-là est utilisé. Enregistre d’abord, puis teste (clé API, sans créer de ligne). S’il échoue à l’achat, erreur client et aucun débit.
                  </span>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/[0.06]">
                  <label className="block text-xs font-semibold text-white/80">Comptes panel (user + mot de passe)</label>
                  <div className="space-y-3">
                    {iptvPanelAccounts.map((acc, index) => (
                      <div key={index} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-white">
                            <input
                              type="radio"
                              name="iptv-panel-acc-active"
                              checked={acc.active}
                              onChange={() => {
                                setIptvPanelAccounts(prev => prev.map((a, i) => ({ ...a, active: i === index })));
                              }}
                              className="accent-[#6366f1]"
                            />
                            <span>Compte actif (connexion panel)</span>
                          </label>
                          {iptvPanelAccounts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setIptvPanelAccounts(prev => prev.filter((_, i) => i !== index))}
                              className="text-xs text-rose-400 hover:text-rose-300"
                            >
                              Supprimer
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] text-white/50 mb-1">Nom</label>
                            <input
                              type="text"
                              value={acc.name}
                              onChange={(e) => {
                                const val = e.target.value;
                                setIptvPanelAccounts(prev => prev.map((a, i) => i === index ? { ...a, name: val } : a));
                              }}
                              placeholder="ChezRheyy"
                              className="admin-form-input text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-white/50 mb-1">Utilisateur</label>
                            <input
                              type="text"
                              value={acc.username}
                              onChange={(e) => {
                                const val = e.target.value;
                                setIptvPanelAccounts(prev => prev.map((a, i) => i === index ? { ...a, username: val } : a));
                              }}
                              placeholder="username"
                              className="admin-form-input text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-white/50 mb-1">Mot de passe</label>
                            <input
                              type="text"
                              value={acc.password}
                              onChange={(e) => {
                                const val = e.target.value;
                                setIptvPanelAccounts(prev => prev.map((a, i) => i === index ? { ...a, password: val } : a));
                              }}
                              placeholder="mot de passe"
                              className="admin-form-input text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIptvPanelAccounts(prev => [...prev, { name: "", username: "", password: "", active: false }])}
                      className="admin-action-btn"
                    >
                      ➕ Ajouter un compte panel
                    </button>
                    <button
                      type="button"
                      onClick={handleTestIptvPanel}
                      disabled={isTestingIptvPanel}
                      className="admin-action-btn"
                    >
                      {isTestingIptvPanel ? "Test en cours..." : "Tester la connexion panel"}
                    </button>
                  </div>
                  {iptvPanelTestResult && (
                    <div className="text-xs text-primary font-mono bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.08]">
                      {iptvPanelTestResult}
                    </div>
                  )}
                  <span className="text-[11px] text-white/40 block">
                    Même principe que les clés API : plusieurs comptes, un seul actif. Enregistre d’abord, puis teste la connexion (cms-4k.com + Geetest, comme sur le site). Les achats payants restent sur le compte API actif.
                  </span>
                </div>

                <button type="submit" className="admin-btn-primary">
                  Enregistrer la Configuration IPTV
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
          <div className="fade-in space-y-6 max-w-4xl">
            <div className="admin-card-panel">
              <div className="admin-card-panel-header">
                <h2 className="admin-card-panel-title">Mode Maintenance Général</h2>
                <span className={`admin-badge ${maintenance ? "admin-badge-danger" : "admin-badge-success"}`}>
                  {maintenance ? "Mode Maintenance Actif" : "Mode Normal"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60">
                  Activer ou désactiver la maintenance générale de la boutique et du bot Telegram.
                </span>
                <button
                  type="button"
                  onClick={handleToggleMaintenance}
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

            <div className="admin-card-panel">
              <div className="admin-card-panel-header">
                <h2 className="admin-card-panel-title">Comptes SumUp (CB)</h2>
              </div>
              <form onSubmit={handleSaveSumup} className="space-y-5">
                <p className="text-xs text-white/50">
                  Les deux banques doivent être configurées en base. Coche celle utilisée pour les paiements CB.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-white/60 mb-1.5">Expiration facture (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={sumupExpiration}
                    onChange={(e) => setSumupExpiration(e.target.value)}
                    className="admin-form-input max-w-xs"
                    required
                  />
                  <span className="text-[11px] text-white/40 block mt-1">
                    Durée de validité du lien CB SumUp. Stockée en table (<code>settings.payments.expirationMinutes</code>).
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-white">
                    <input
                      type="radio"
                      name="sumup-active"
                      value="sumup"
                      checked={sumupActive === "sumup"}
                      onChange={() => setSumupActive("sumup")}
                      className="accent-[#6366f1]"
                    />
                    <span>Banque 1 active</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-white/50 mb-1">Nom</label>
                      <input
                        type="text"
                        value={sumup1.name}
                        onChange={(e) => setSumup1({ ...sumup1, name: e.target.value })}
                        placeholder="Nom d'affichage"
                        className="admin-form-input text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-white/50 mb-1">Email marchand</label>
                      <input
                        type="text"
                        value={sumup1.pay_to_email}
                        onChange={(e) => setSumup1({ ...sumup1, pay_to_email: e.target.value })}
                        placeholder="pay_to_email"
                        className="admin-form-input text-xs"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-white/50 mb-1">API Key</label>
                    <input
                      type="text"
                      value={sumup1.api_key}
                      onChange={(e) => setSumup1({ ...sumup1, api_key: e.target.value })}
                      placeholder="api_key"
                      className="admin-form-input text-xs"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-white/50 mb-1">Client ID</label>
                      <input
                        type="text"
                        value={sumup1.client_id}
                        onChange={(e) => setSumup1({ ...sumup1, client_id: e.target.value })}
                        placeholder="client_id"
                        className="admin-form-input text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-white/50 mb-1">Client Secret</label>
                      <input
                        type="text"
                        value={sumup1.client_secret}
                        onChange={(e) => setSumup1({ ...sumup1, client_secret: e.target.value })}
                        placeholder="client_secret"
                        className="admin-form-input text-xs"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-white">
                    <input
                      type="radio"
                      name="sumup-active"
                      value="sumup_bank2"
                      checked={sumupActive === "sumup_bank2"}
                      onChange={() => setSumupActive("sumup_bank2")}
                      className="accent-[#6366f1]"
                    />
                    <span>Banque 2 active</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-white/50 mb-1">Nom</label>
                      <input
                        type="text"
                        value={sumup2.name}
                        onChange={(e) => setSumup2({ ...sumup2, name: e.target.value })}
                        placeholder="Nom d'affichage"
                        className="admin-form-input text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-white/50 mb-1">Email marchand</label>
                      <input
                        type="text"
                        value={sumup2.pay_to_email}
                        onChange={(e) => setSumup2({ ...sumup2, pay_to_email: e.target.value })}
                        placeholder="pay_to_email"
                        className="admin-form-input text-xs"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-white/50 mb-1">API Key</label>
                    <input
                      type="text"
                      value={sumup2.api_key}
                      onChange={(e) => setSumup2({ ...sumup2, api_key: e.target.value })}
                      placeholder="api_key"
                      className="admin-form-input text-xs"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-white/50 mb-1">Client ID</label>
                      <input
                        type="text"
                        value={sumup2.client_id}
                        onChange={(e) => setSumup2({ ...sumup2, client_id: e.target.value })}
                        placeholder="client_id"
                        className="admin-form-input text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-white/50 mb-1">Client Secret</label>
                      <input
                        type="text"
                        value={sumup2.client_secret}
                        onChange={(e) => setSumup2({ ...sumup2, client_secret: e.target.value })}
                        placeholder="client_secret"
                        className="admin-form-input text-xs"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button type="submit" className="admin-btn-primary">
                  Enregistrer SumUp
                </button>
              </form>
            </div>

            <div className="admin-card-panel">
              <div className="admin-card-panel-header">
                <h2 className="admin-card-panel-title">Mot de Passe Admin Panel</h2>
              </div>
              <form onSubmit={handleSavePassword} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg">
                  <div>
                    <label className="block text-xs font-semibold text-white/60 mb-1.5">Nouveau Mot de Passe</label>
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="admin-form-input"
                      placeholder="Nouveau mot de passe"
                      minLength={4}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/60 mb-1.5">Confirmer le Mot de Passe</label>
                    <input
                      type="password"
                      value={adminPasswordConfirm}
                      onChange={(e) => setAdminPasswordConfirm(e.target.value)}
                      className="admin-form-input"
                      placeholder="Confirmer le mot de passe"
                      minLength={4}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="admin-btn-primary">
                  Modifier le Mot de Passe
                </button>
              </form>
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
