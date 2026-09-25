"use client";

import { useState, useEffect, FormEvent } from "react";
import { Shield, KeyRound, ArrowRight, Lock } from "lucide-react";
import { ToastProvider, useToast } from "@/components/NotificationToast";
import AdminWebView from "@/components/admin/AdminWebView";

/* ===================================================================== */

function SecretAdminContent() {
  const toast = useToast();
  const [token, setToken] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);

  /* ===================================================================== */

  useEffect(() => {
    const savedToken = localStorage.getItem("admin_auth_token") || "";
    const savedTime = parseInt(localStorage.getItem("admin_auth_token_time") || "0", 10);
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    if (savedToken && savedTime && Date.now() - savedTime < TWENTY_FOUR_HOURS) {
      setToken(savedToken);
    } else {
      localStorage.removeItem("admin_auth_token");
      localStorage.removeItem("admin_auth_token_time");
      setToken("");
    }
    setChecking(false);
  }, []);

  /* ===================================================================== */

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/proxy/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() })
      });

      if (!res.ok) {
        toast.error("Mot de passe incorrect");
        setPassword("");
        return;
      }

      const data = await res.json();
      if (data && data.success && data.token) {
        localStorage.setItem("admin_auth_token", data.token);
        localStorage.setItem("admin_auth_token_time", Date.now().toString());
        setToken(data.token);
        toast.success("Authentification réussie");
      } else {
        toast.error("Échec de session");
      }
    } catch {
      toast.error("Accès refusé");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_auth_token");
    localStorage.removeItem("admin_auth_token_time");
    setToken("");
    setPassword("");
    toast.success("Session clôturée");
  };

  /* ===================================================================== */

  if (checking) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (token) {
    return <AdminWebView onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-[#07090e] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#0e111b] border border-white/[0.08] rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-sky-400 mx-auto flex items-center justify-center text-slate-950 font-black shadow-lg shadow-primary/20">
            <Lock size={24} />
          </div>
          <h1 className="text-base font-black uppercase tracking-wider text-white">Espace Sécurisé</h1>
          <p className="text-xs text-white/40 font-mono">ChezRheyy Web Administration</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
              Clé d'authentification
            </label>
            <div className="relative">
              <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="password"
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-slate-950 font-black text-xs tracking-wider uppercase hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
            ) : (
              <>
                <span>Déverrouiller</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        <p className="text-[10px] text-center text-white/20 font-mono">
          Accès restreint • Connexion tracée et chiffrée
        </p>
      </div>
    </div>
  );
}

/* ===================================================================== */

export default function SecretAdminPage() {
  return (
    <ToastProvider>
      <SecretAdminContent />
    </ToastProvider>
  );
}
