"use client";

import { useState, useEffect, FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { ToastProvider } from "@/components/NotificationToast";
import AdminWebView from "@/components/admin/AdminWebView";

/* ===================================================================== */

function SecretAdminContent() {
  const [token, setToken] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);
  const [errorShake, setErrorShake] = useState<boolean>(false);

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
    if (!password.trim() || loading) return;

    setLoading(true);
    setErrorShake(false);

    try {
      const res = await fetch("/api/proxy/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() })
      });

      if (!res.ok) {
        setPassword("");
        setErrorShake(true);
        setTimeout(() => setErrorShake(false), 500);
        return;
      }

      const data = await res.json();
      if (data && data.success && data.token) {
        localStorage.setItem("admin_auth_token", data.token);
        localStorage.setItem("admin_auth_token_time", Date.now().toString());
        setToken(data.token);
      } else {
        setPassword("");
        setErrorShake(true);
        setTimeout(() => setErrorShake(false), 500);
      }
    } catch {
      setPassword("");
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_auth_token");
    localStorage.removeItem("admin_auth_token_time");
    setToken("");
    setPassword("");
  };

  /* ===================================================================== */

  if (checking) {
    return <div className="min-h-screen bg-black" />;
  }

  if (token) {
    return <AdminWebView onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 select-none">
      <form onSubmit={handleLogin} className="w-full max-w-xs">
        <div
          className={`relative flex items-center transition-transform ${
            errorShake ? "translate-x-1 duration-75" : ""
          }`}
        >
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full bg-[#0a0c12] border border-white/[0.08] focus:border-white/20 rounded-xl px-4 py-3 text-xs text-white placeholder-transparent focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="absolute right-2 p-1.5 rounded-lg text-white/30 hover:text-white disabled:opacity-0 transition-all"
          >
            {loading ? (
              <div className="w-3.5 h-3.5 border border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <ArrowRight size={14} />
            )}
          </button>
        </div>
      </form>
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
