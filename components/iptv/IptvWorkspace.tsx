"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTelegram } from "@/components/TelegramContext";
import { useToast } from "@/components/NotificationToast";
import {
  ArrowLeft,
  Tv,
  Zap,
  Clock,
  ShieldCheck,
  Check,
  Copy,
  Radio,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Sparkles,
  PlayCircle
} from "lucide-react";

/* ===================================================================== */

interface IptvPrices {
  prices: Record<string, number>;
  demo_enabled: boolean;
  host: string;
  message_footer: string;
}

interface IptvSubscription {
  id: number;
  username: string;
  password: string;
  months: number;
  price: number;
  url: string | null;
  created_at: string | null;
}

interface IptvWorkspaceProps {
  onBack: () => void;
  onGoRecharge?: () => void;
}

/* ===================================================================== */

export default function IptvWorkspace({ onBack, onGoRecharge }: IptvWorkspaceProps) {
  const { user, balance, refreshBalance, initData, haptic } = useTelegram();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<"buy" | "demo" | "my-subs">("buy");
  const [selectedDuration, setSelectedDuration] = useState<1 | 3 | 6 | 12>(1);

  const [config, setConfig] = useState<IptvPrices>({
    prices: {},
    demo_enabled: false,
    host: "",
    message_footer: "",
  });

  const [mySubs, setMySubs] = useState<IptvSubscription[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [generatedAccount, setGeneratedAccount] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string>("");

  /* ===================================================================== */

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/proxy/iptv/prices", {
        headers: { "X-Telegram-Init-Data": initData },
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch {
      toast.error("Impossible de charger les tarifs IPTV");
    } finally {
      setIsLoading(false);
    }
  }, [initData, toast]);

  const fetchMySubs = useCallback(async () => {
    try {
      const res = await fetch("/api/proxy/iptv/my-subscriptions", {
        headers: { "X-Telegram-Init-Data": initData },
      });
      if (res.ok) {
        const data = await res.json();
        setMySubs(data.subscriptions || []);
      }
    } catch {
      toast.error("Impossible de charger vos abonnements");
    }
  }, [initData, toast]);

  useEffect(() => {
    fetchConfig();
    fetchMySubs();
  }, [fetchConfig, fetchMySubs]);

  /* ===================================================================== */

  const handleCopy = (text: string, field: string) => {
    haptic("selection");
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copié !");
    setTimeout(() => setCopiedField(""), 2000);
  };

  const currentPrice = config.prices[String(selectedDuration)] || 0;
  const demoPrice = config.prices["demo"] || 0;
  const canAfford = balance >= currentPrice;
  const canAffordDemo = balance >= demoPrice;

  const handleConfirmOrder = () => {
    haptic("impact");
    if (!canAfford) {
      toast.error(`Solde insuffisant (${balance.toFixed(2)} € / ${currentPrice.toFixed(2)} €)`);
      return;
    }
    setShowConfirm(true);
  };

  const executeOrder = async () => {
    setIsProcessing(true);
    haptic("impact");
    try {
      const res = await fetch("/api/proxy/iptv/buy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Telegram-Init-Data": initData,
        },
        body: JSON.stringify({
          subscription_type: "m3u",
          sub: selectedDuration,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Échec de génération IPTV");
      }

      setShowConfirm(false);
      setGeneratedAccount(data);
      toast.success("Abonnement IPTV créé avec succès !");
      refreshBalance();
      fetchMySubs();
    } catch (err: any) {
      toast.error(err.message || "Erreur de création IPTV");
    } finally {
      setIsProcessing(false);
    }
  };

  const executeDemo = async () => {
    if (!canAffordDemo) {
      toast.error(`Solde insuffisant pour la démo (${balance.toFixed(2)} € / ${demoPrice.toFixed(2)} €)`);
      return;
    }
    setIsProcessing(true);
    haptic("impact");
    try {
      const res = await fetch("/api/proxy/iptv/buy-demo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Telegram-Init-Data": initData,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Échec de génération de la démo");
      }

      setGeneratedAccount({
        ...data,
        sub: "Démo 24h",
        subscription_type: "m3u",
      });
      toast.success("Démo 24h générée avec succès !");
      refreshBalance();
      fetchMySubs();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la démo");
    } finally {
      setIsProcessing(false);
    }
  };

  /* ===================================================================== */

  return (
    <div className="space-y-4 pb-24 fade-in">
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => {
            haptic("selection");
            onBack();
          }}
          className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-white/60 hover:text-white transition-colors bg-white/[0.04] border border-white/10 px-3 py-1.5 rounded-xl active:scale-95"
        >
          <ArrowLeft size={13} />
          <span>Services</span>
        </button>
      </div>

      <div className="p-4 rounded-2xl bg-gradient-to-r from-red-600/20 via-rose-600/10 to-transparent border border-rose-500/30 flex items-center justify-between shadow-lg">
        <div>
          <span className="text-[9px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1">
            <Sparkles size={11} /> 4K • Full HD • M3U
          </span>
          <h2 className="text-base font-black italic text-white mt-0.5">
            IPTV
          </h2>
          <p className="text-[10px] text-white/50 font-medium">
            Abonnements et tests démo 24h
          </p>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-400 shadow-inner">
          <Tv size={22} />
        </div>
      </div>

      <div className="grid grid-cols-3 p-1 rounded-xl bg-white/[0.03] border border-white/10 gap-1 text-[11px]">
        <button
          type="button"
          onClick={() => {
            haptic("selection");
            setActiveTab("buy");
          }}
          className={`py-2 text-center rounded-lg font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
            activeTab === "buy"
              ? "bg-primary text-slate-950 shadow-md"
              : "text-white/60 hover:text-white"
          }`}
        >
          <Tv size={12} />
          <span>Formules</span>
        </button>
        {config.demo_enabled && (
          <button
            type="button"
            onClick={() => {
              haptic("selection");
              setActiveTab("demo");
            }}
            className={`py-2 text-center rounded-lg font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
              activeTab === "demo"
                ? "bg-primary text-slate-950 shadow-md"
                : "text-white/60 hover:text-white"
            }`}
          >
            <Zap size={12} />
            <span>Démo 24h</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            haptic("selection");
            setActiveTab("my-subs");
            fetchMySubs();
          }}
          className={`py-2 text-center rounded-lg font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
            activeTab === "my-subs"
              ? "bg-primary text-slate-950 shadow-md"
              : "text-white/60 hover:text-white"
          }`}
        >
          <Radio size={12} />
          <span>Mes Lignes</span>
        </button>
      </div>

      {activeTab === "buy" && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#0f121d] border border-white/[0.08] p-4 space-y-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-white/50">
              Durée de l&apos;abonnement
            </span>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { months: 1 as const, label: "1 Mois", badge: null },
                { months: 3 as const, label: "3 Mois", badge: "POPULAIRE" },
                { months: 6 as const, label: "6 Mois", badge: null },
                { months: 12 as const, label: "12 Mois", badge: "MEILLEUR PRIX" },
              ].map((opt) => {
                const price = config.prices[String(opt.months)] || 0;
                const isSelected = selectedDuration === opt.months;

                return (
                  <button
                    key={opt.months}
                    type="button"
                    onClick={() => {
                      haptic("selection");
                      setSelectedDuration(opt.months);
                    }}
                    className={`relative p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? "bg-gradient-to-br from-primary/20 to-primary/5 border-primary shadow-lg scale-[1.01]"
                        : "bg-white/[0.02] border-white/10 text-white/70 hover:border-white/20"
                    }`}
                  >
                    {opt.badge && (
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-[7px] font-black tracking-wider uppercase text-primary">
                        {opt.badge}
                      </span>
                    )}

                    <div>
                      <span className="text-xs font-black italic text-white">
                        {opt.label}
                      </span>
                      <div className="text-xl font-black italic text-white mt-1">
                        {price.toFixed(2).replace(".", ",")} <span className="text-xs text-primary">€</span>
                      </div>
                    </div>

                    <div className="mt-2 text-[8px] font-bold uppercase tracking-wider text-white/40">
                      Flux 4K UHD / Full HD
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60">Total à payer :</span>
              <span className="text-base font-black italic text-primary">
                {currentPrice.toFixed(2).replace(".", ",")} €
              </span>
            </div>

            <button
              type="button"
              disabled={!canAfford || isProcessing}
              onClick={handleConfirmOrder}
              className={`w-full py-3 rounded-xl font-black italic text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                canAfford
                  ? "bg-primary text-slate-950 hover:brightness-110 active:scale-98 shadow-md"
                  : "bg-white/[0.05] border border-white/10 text-white/30 cursor-not-allowed"
              }`}
            >
              <Tv size={14} />
              <span>{canAfford ? "Valider mon abonnement" : "Solde insuffisant"}</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === "demo" && config.demo_enabled && (
        <div className="space-y-4">
          <div className="rounded-3xl bg-gradient-to-br from-[#121626] to-[#0a0d16] border border-white/10 p-5 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary mx-auto flex items-center justify-center shadow-lg">
              <Zap size={28} />
            </div>

            <div>
              <h3 className="text-lg font-black italic text-white">
                Test Démo 24 Heures
              </h3>
              <p className="text-xs text-white/50 max-w-xs mx-auto mt-1.5">
                Profitez d&apos;un accès complet aux films, séries et chaînes du monde entier pendant 24h.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-xs flex justify-between items-center">
              <span className="text-white/60 font-medium">Prix :</span>
              <span className="font-black text-white text-sm">
                {demoPrice > 0 ? `${demoPrice.toFixed(2).replace(".", ",")} €` : "0,00 €"}
              </span>
            </div>

            <button
              type="button"
              disabled={isProcessing || !canAffordDemo}
              onClick={executeDemo}
              className={`w-full py-3 rounded-xl font-black italic text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                canAffordDemo
                  ? "bg-primary text-slate-950 hover:brightness-110 active:scale-98 shadow-lg"
                  : "bg-white/[0.05] border border-white/10 text-white/30 cursor-not-allowed"
              }`}
            >
              {isProcessing ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <PlayCircle size={14} />
              )}
              <span>{isProcessing ? "Création en cours..." : "Lancer le test 24h"}</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === "my-subs" && (
        <div className="space-y-3">
          {mySubs.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#0f121d]/90 border border-white/[0.08] text-center space-y-3">
              <Tv size={32} className="mx-auto text-white/20" />
              <h3 className="text-sm font-black italic text-white">Aucun abonnement actif</h3>
              <p className="text-xs text-white/50 max-w-xs mx-auto">
                Vos abonnements IPTV et démos apparaîtront ici après chaque commande avec vos identifiants d&apos;accès.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("buy")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-slate-950 text-xs font-black uppercase tracking-wider"
              >
                <span>Commander un abonnement</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {mySubs.map((sub) => (
                <div
                  key={sub.id}
                  className="rounded-2xl bg-[#0f121d] border border-white/[0.08] p-4 space-y-3 shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                        <Tv size={15} />
                      </div>
                      <div>
                        <div className="text-xs font-black italic text-white flex items-center gap-1.5">
                          {sub.months > 0 ? `IPTV ${sub.months} Mois` : "Test Démo 24h"}
                        </div>
                        <div className="text-[9px] text-white/40 font-medium">
                          {sub.created_at ? new Date(sub.created_at).toLocaleDateString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "Récemment"}
                        </div>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-black text-emerald-400">
                      ACTIF
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06]">
                    <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                      <div className="text-[9px] text-white/40 uppercase font-bold tracking-wider mb-0.5">
                        Identifiant
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-black text-white truncate max-w-[110px]">
                          {sub.username}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(sub.username, `user_${sub.id}`)}
                          className="text-white/40 hover:text-white"
                        >
                          {copiedField === `user_${sub.id}` ? (
                            <Check size={12} className="text-emerald-400" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                      <div className="text-[9px] text-white/40 uppercase font-bold tracking-wider mb-0.5">
                        Mot de passe
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-black text-primary truncate max-w-[110px]">
                          {sub.password}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(sub.password, `pass_${sub.id}`)}
                          className="text-white/40 hover:text-white"
                        >
                          {copiedField === `pass_${sub.id}` ? (
                            <Check size={12} className="text-emerald-400" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {sub.url && (
                    <button
                      type="button"
                      onClick={() => handleCopy(sub.url || "", `m3u_${sub.id}`)}
                      className="w-full py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[10px] font-bold text-white/70 hover:text-white flex items-center justify-center gap-1.5"
                    >
                      {copiedField === `m3u_${sub.id}` ? (
                        <Check size={12} className="text-emerald-400" />
                      ) : (
                        <Copy size={12} />
                      )}
                      <span>Copier le lien M3U complet</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[#0d111c] border border-white/15 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Tv size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black italic text-white">Confirmation IPTV</h3>
                <p className="text-[10px] text-white/40 font-medium">
                  Prélèvement sur votre solde mini-app
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-white/60">Formule :</span>
                <span className="font-black text-white">{selectedDuration} Mois (M3U)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Montant débité :</span>
                <span className="font-black text-primary">{currentPrice.toFixed(2).replace(".", ",")} €</span>
              </div>
              <div className="border-t border-white/[0.06] pt-2 flex justify-between">
                <span className="text-white/40">Solde restant après achat :</span>
                <span className="font-black text-white/80">
                  {(balance - currentPrice).toFixed(2).replace(".", ",")} €
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setShowConfirm(false)}
                className="py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-black uppercase tracking-wider text-white/70 hover:text-white"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={executeOrder}
                className="py-2.5 rounded-xl bg-primary text-slate-950 text-xs font-black italic uppercase tracking-wider hover:brightness-110 flex items-center justify-center gap-2 shadow-lg"
              >
                {isProcessing ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <Check size={13} />
                )}
                <span>{isProcessing ? "Création..." : "Confirmer"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {generatedAccount && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 fade-in overflow-y-auto">
          <div className="w-full max-w-sm rounded-3xl bg-[#0b0e18] border border-emerald-500/30 p-5 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center shadow-lg">
              <ShieldCheck size={24} />
            </div>

            <div className="text-center">
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
                Ligne IPTV Active
              </span>
              <h3 className="text-base font-black italic text-white mt-0.5">
                {generatedAccount.sub ? `Abonnement ${generatedAccount.sub}` : "Identifiants d'accès"}
              </h3>
              <p className="text-[10px] text-white/50 font-medium">
                À renseigner dans IPTV Smarters Pro
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                <div className="text-[8px] text-white/40 uppercase font-bold tracking-wider mb-0.5">
                  Host / Serveur
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-white break-all select-all leading-normal">
                    {generatedAccount.host || config.host}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(generatedAccount.host || config.host, "res_host")}
                    className="text-white/40 hover:text-white shrink-0 p-1"
                  >
                    {copiedField === "res_host" ? (
                      <Check size={12} className="text-emerald-400" />
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>
                </div>
              </div>

              {generatedAccount.username && (
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                  <div className="text-[8px] text-white/40 uppercase font-bold tracking-wider mb-0.5">
                    Identifiant (Username)
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-black text-white break-all select-all leading-normal">
                      {generatedAccount.username}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(generatedAccount.username, "res_user")}
                      className="text-white/40 hover:text-white shrink-0 p-1"
                    >
                      {copiedField === "res_user" ? (
                        <Check size={12} className="text-emerald-400" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {generatedAccount.password && (
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                  <div className="text-[8px] text-white/40 uppercase font-bold tracking-wider mb-0.5">
                    Mot de passe (Password)
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-black text-primary break-all select-all leading-normal">
                      {generatedAccount.password}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(generatedAccount.password, "res_pass")}
                      className="text-white/40 hover:text-white shrink-0 p-1"
                    >
                      {copiedField === "res_pass" ? (
                        <Check size={12} className="text-emerald-400" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                haptic("selection");
                setGeneratedAccount(null);
              }}
              className="w-full py-2.5 rounded-xl bg-primary text-slate-950 font-black italic text-xs uppercase tracking-wider hover:brightness-110 shadow-md"
            >
              Fermer & Voir mes abonnements
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
