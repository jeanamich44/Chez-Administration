"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTelegram } from "@/components/TelegramContext";
import { useToast } from "@/components/NotificationToast";
import Barcode128 from "./Barcode128";
import {
  ArrowLeft,
  ShoppingCart,
  CreditCard,
  Sparkles,
  Check,
  Copy,
  RefreshCw,
  AlertCircle,
  Tag,
  ShieldCheck,
  Zap,
  ExternalLink
} from "lucide-react";

/* ===================================================================== */

interface StockGroup {
  value: number;
  price: number;
  count: number;
  id: number;
}

interface PurchasedCard {
  id: number;
  code: string;
  pin: string;
  value: number;
  price: number;
  created_at: string | null;
}

interface CarrefourWorkspaceProps {
  onBack: () => void;
  onGoRecharge?: () => void;
}

/* ===================================================================== */

export default function CarrefourWorkspace({ onBack, onGoRecharge }: CarrefourWorkspaceProps) {
  const { user, balance, refreshBalance, initData, haptic } = useTelegram();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<"shop" | "my-cards">("shop");
  const [stockList, setStockList] = useState<StockGroup[]>([]);
  const [myCards, setMyCards] = useState<PurchasedCard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBuying, setIsBuying] = useState<boolean>(false);

  const [confirmCard, setConfirmCard] = useState<StockGroup | null>(null);
  const [boughtResult, setBoughtResult] = useState<PurchasedCard | null>(null);
  const [selectedBarcodeCard, setSelectedBarcodeCard] = useState<PurchasedCard | null>(null);
  const [copiedKey, setCopiedKey] = useState<string>("");

  /* ===================================================================== */

  const fetchStock = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/proxy/carrefour/stock", {
        headers: { "X-Telegram-Init-Data": initData },
      });
      if (res.ok) {
        const data = await res.json();
        setStockList(data.stock || []);
      }
    } catch {
      toast.error("Erreur lors de la récupération du stock");
    } finally {
      setIsLoading(false);
    }
  }, [initData, toast]);

  const fetchMyCards = useCallback(async () => {
    try {
      const res = await fetch("/api/proxy/carrefour/my-cards", {
        headers: { "X-Telegram-Init-Data": initData },
      });
      if (res.ok) {
        const data = await res.json();
        setMyCards(data.cards || []);
      }
    } catch {
      toast.error("Impossible de charger vos cartes");
    }
  }, [initData, toast]);

  useEffect(() => {
    fetchStock();
    fetchMyCards();
  }, [fetchStock, fetchMyCards]);

  /* ===================================================================== */

  const handleCopy = (text: string, key: string) => {
    haptic("selection");
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copié dans le presse-papier");
    setTimeout(() => setCopiedKey(""), 2000);
  };

  const handleOpenConfirm = (item: StockGroup) => {
    haptic("impact");
    if (balance < item.price) {
      toast.error(`Solde insuffisant (${balance.toFixed(2)} € / ${item.price.toFixed(2)} €)`);
      return;
    }
    setConfirmCard(item);
  };

  const executePurchase = async () => {
    if (!confirmCard) return;
    setIsBuying(true);
    haptic("impact");
    try {
      const res = await fetch("/api/proxy/carrefour/buy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Telegram-Init-Data": initData,
        },
        body: JSON.stringify({
          value: confirmCard.value,
          stock_id: confirmCard.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Échec de l'achat");
      }

      setConfirmCard(null);
      setBoughtResult(data.item);
      toast.success("Carte Carrefour obtenue avec succès !");
      refreshBalance();
      fetchStock();
      fetchMyCards();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'achat");
    } finally {
      setIsBuying(false);
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

      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600/20 via-sky-600/10 to-transparent border border-blue-500/30 flex items-center justify-between shadow-lg">
        <div>
          <span className="text-[9px] font-black uppercase tracking-wider text-sky-400 flex items-center gap-1">
            <Tag size={11} /> Stock Instantané
          </span>
          <h2 className="text-base font-black italic text-white mt-0.5">
            Carrefour
          </h2>
          <p className="text-[10px] text-white/50 font-medium">
            Cartes en stock avec code et code-barres
          </p>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-sky-400 shadow-inner">
          <ShoppingCart size={22} />
        </div>
      </div>

      <div className="grid grid-cols-2 p-1 rounded-xl bg-white/[0.03] border border-white/10 gap-1">
        <button
          type="button"
          onClick={() => {
            haptic("selection");
            setActiveTab("shop");
          }}
          className={`py-2 text-center rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "shop"
              ? "bg-primary text-slate-950 shadow-md"
              : "text-white/60 hover:text-white"
          }`}
        >
          <Zap size={13} />
          <span>Acheter ({stockList.reduce((acc, s) => acc + s.count, 0)})</span>
        </button>
        <button
          type="button"
          onClick={() => {
            haptic("selection");
            setActiveTab("my-cards");
            fetchMyCards();
          }}
          className={`py-2 text-center rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "my-cards"
              ? "bg-primary text-slate-950 shadow-md"
              : "text-white/60 hover:text-white"
          }`}
        >
          <CreditCard size={13} />
          <span>Mes Cartes ({myCards.length})</span>
        </button>
      </div>

      {activeTab === "shop" && (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-7 h-7 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                Recherche des stocks...
              </p>
            </div>
          ) : stockList.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#0f121d]/90 border border-white/[0.08] text-center space-y-3">
              <AlertCircle size={32} className="mx-auto text-amber-400 opacity-80" />
              <h3 className="text-sm font-black italic text-white">Stock épuisé</h3>
              <p className="text-xs text-white/50 max-w-xs mx-auto">
                Toutes les cartes Carrefour ont été vendues. Les réapprovisionnements sont réguliers.
              </p>
              <button
                type="button"
                onClick={fetchStock}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs font-bold text-white hover:border-white/20 active:scale-95"
              >
                <RefreshCw size={12} />
                <span>Actualiser</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {stockList.map((item) => {
                const discount = Math.round(((item.value - item.price) / item.value) * 100);
                const canAfford = balance >= item.price;

                return (
                  <div
                    key={`${item.value}-${item.price}`}
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#12192c] via-[#0d1322] to-[#070a13] border border-blue-500/20 p-4 shadow-xl flex flex-col justify-between group hover:border-blue-400/50 transition-all"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-lg bg-blue-600/30 border border-blue-400/30 flex items-center justify-center font-black text-[10px] text-sky-300">
                            C
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-sky-300">
                            CARREFOUR
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {discount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-black text-emerald-400">
                              -{discount}%
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-[9px] font-bold text-white/70">
                            {item.count} dispo{item.count > 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>

                      <div className="my-2">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-white/40">
                          Valeur faciale
                        </div>
                        <div className="text-3xl font-black italic text-white tracking-tight flex items-baseline gap-1">
                          {item.value.toFixed(0)} <span className="text-lg text-sky-400">€</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs py-2 border-y border-white/[0.06] my-3">
                        <span className="text-white/60 font-medium">Prix d&apos;achat :</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="line-through text-white/30 text-[11px]">
                            {item.value.toFixed(2)} €
                          </span>
                          <span className="font-black italic text-white text-sm">
                            {item.price.toFixed(2).replace(".", ",")} €
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => handleOpenConfirm(item)}
                      className={`w-full py-2.5 rounded-xl font-black italic text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                        canAfford
                          ? "bg-primary text-slate-950 hover:brightness-110 active:scale-98 shadow-md"
                          : "bg-white/[0.05] border border-white/10 text-white/30 cursor-not-allowed"
                      }`}
                    >
                      <ShoppingCart size={13} />
                      <span>{canAfford ? "Acheter" : "Solde insuffisant"}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "my-cards" && (
        <div className="space-y-3">
          {myCards.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#0f121d]/90 border border-white/[0.08] text-center space-y-3">
              <CreditCard size={32} className="mx-auto text-white/20" />
              <h3 className="text-sm font-black italic text-white">Aucune carte achetée</h3>
              <p className="text-xs text-white/50 max-w-xs mx-auto">
                Vos cartes Carrefour apparaîtront ici avec leurs codes et codes-barres dès validation d&apos;un achat.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("shop")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-slate-950 text-xs font-black uppercase tracking-wider"
              >
                <span>Accéder à la boutique</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myCards.map((card) => (
                <div
                  key={card.id}
                  className="rounded-2xl bg-[#0f121d] border border-white/[0.08] p-4 space-y-3 shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-sky-400 font-black text-xs">
                        C
                      </div>
                      <div>
                        <div className="text-xs font-black italic text-white flex items-center gap-1.5">
                          Carte Carrefour {card.value.toFixed(0)} €
                        </div>
                        <div className="text-[9px] text-white/40 font-medium">
                          {card.created_at ? new Date(card.created_at).toLocaleDateString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "Récemment"}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        haptic("selection");
                        setSelectedBarcodeCard(card);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-sky-400 text-[10px] font-black uppercase tracking-wider hover:bg-blue-500/20 active:scale-95"
                    >
                      <span>Code-barres</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06]">
                    <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                      <div className="text-[9px] text-white/40 uppercase font-bold tracking-wider mb-0.5">
                        Numéro de carte
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-black text-white tracking-wider">
                          {card.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(card.code, `code_${card.id}`)}
                          className="text-white/40 hover:text-white transition-colors"
                        >
                          {copiedKey === `code_${card.id}` ? (
                            <Check size={12} className="text-emerald-400" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                      <div className="text-[9px] text-white/40 uppercase font-bold tracking-wider mb-0.5">
                        Code PIN
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-black text-primary tracking-widest">
                          {card.pin}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(card.pin, `pin_${card.id}`)}
                          className="text-white/40 hover:text-white transition-colors"
                        >
                          {copiedKey === `pin_${card.id}` ? (
                            <Check size={12} className="text-emerald-400" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {confirmCard && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[#0d111c] border border-white/15 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-sky-400">
                <ShoppingCart size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black italic text-white">Confirmation d&apos;achat</h3>
                <p className="text-[10px] text-white/40 font-medium">
                  Prélèvement sur votre solde mini-app
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-white/60">Carte cadeau :</span>
                <span className="font-black text-white">Carrefour {confirmCard.value.toFixed(0)} €</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Montant débité :</span>
                <span className="font-black text-primary">{confirmCard.price.toFixed(2).replace(".", ",")} €</span>
              </div>
              <div className="border-t border-white/[0.06] pt-2 flex justify-between">
                <span className="text-white/40">Solde restant après achat :</span>
                <span className="font-black text-white/80">
                  {(balance - confirmCard.price).toFixed(2).replace(".", ",")} €
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                disabled={isBuying}
                onClick={() => setConfirmCard(null)}
                className="py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-black uppercase tracking-wider text-white/70 hover:text-white"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isBuying}
                onClick={executePurchase}
                className="py-2.5 rounded-xl bg-primary text-slate-950 text-xs font-black italic uppercase tracking-wider hover:brightness-110 flex items-center justify-center gap-2 shadow-lg"
              >
                {isBuying ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <Check size={13} />
                )}
                <span>{isBuying ? "Paiement..." : "Confirmer"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {boughtResult && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[#0b0e18] border border-emerald-500/30 p-5 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center shadow-lg">
              <ShieldCheck size={24} />
            </div>

            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
                Paiement validé
              </span>
              <h3 className="text-base font-black italic text-white mt-0.5">
                Carte Carrefour {boughtResult.value.toFixed(0)} €
              </h3>
              <p className="text-[11px] text-white/50 font-medium">
                Votre carte est prête à être présentée en caisse
              </p>
            </div>

            <Barcode128 value={boughtResult.code} height={60} />

            <div className="grid grid-cols-2 gap-2 text-left">
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                <div className="text-[8px] text-white/40 uppercase font-bold tracking-wider mb-0.5">
                  Numéro
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-white">{boughtResult.code}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(boughtResult.code, "modal_code")}
                    className="text-white/40 hover:text-white"
                  >
                    {copiedKey === "modal_code" ? (
                      <Check size={12} className="text-emerald-400" />
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                <div className="text-[8px] text-white/40 uppercase font-bold tracking-wider mb-0.5">
                  Code PIN
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-primary">{boughtResult.pin}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(boughtResult.pin, "modal_pin")}
                    className="text-white/40 hover:text-white"
                  >
                    {copiedKey === "modal_pin" ? (
                      <Check size={12} className="text-emerald-400" />
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                haptic("selection");
                setBoughtResult(null);
              }}
              className="w-full py-2.5 rounded-xl bg-primary text-slate-950 font-black italic text-xs uppercase tracking-wider hover:brightness-110 shadow-md"
            >
              Fermer & Voir mes cartes
            </button>
          </div>
        </div>
      )}

      {selectedBarcodeCard && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[#0b0e18] border border-white/15 p-5 space-y-4 shadow-2xl text-center">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <div className="text-left">
                <span className="text-[8px] font-black uppercase tracking-wider text-sky-400">
                  Pass Caisse
                </span>
                <h4 className="text-xs font-black italic text-white">
                  Carrefour {selectedBarcodeCard.value.toFixed(0)} €
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBarcodeCard(null)}
                className="text-xs font-black text-white/40 hover:text-white px-2 py-1 rounded-lg bg-white/[0.05]"
              >
                ✕
              </button>
            </div>

            <Barcode128 value={selectedBarcodeCard.code} height={70} />

            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between text-xs">
              <span className="text-white/60 font-medium">Code PIN :</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-primary text-sm tracking-widest">
                  {selectedBarcodeCard.pin}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(selectedBarcodeCard.pin, "pin_viewer")}
                  className="text-white/40 hover:text-white"
                >
                  {copiedKey === "pin_viewer" ? (
                    <Check size={12} className="text-emerald-400" />
                  ) : (
                    <Copy size={12} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedBarcodeCard(null)}
              className="w-full py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white font-black italic text-xs uppercase tracking-wider"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
