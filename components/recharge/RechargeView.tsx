"use client";

import { useState } from "react";
import { Wallet, ShieldCheck, Zap, ArrowRight, CheckCircle2, Copy, ExternalLink, QrCode } from "lucide-react";
import { useTelegram } from "@/components/TelegramContext";
import { useToast } from "@/components/NotificationToast";

/* ===================================================================== */

interface RechargeViewProps {
  onBackToServices?: () => void;
}


const PAYMENT_METHODS = [
  {
    id: "card",
    name: "Carte Bancaire / Apple Pay",
    badge: "INSTANTANÉ • SÉCURISÉ",
    icon: "💳",
    color: "text-violet-400 border-violet-500/20 bg-violet-500/10",
    address: "https://pay.chezrheyy.xyz",
  },
  {
    id: "crypto_ltc",
    name: "Litecoin (LTC)",
    badge: "RECOMMANDÉ • FRAIS MINIMES",
    icon: "Ł",
    color: "text-sky-400 border-sky-500/20 bg-sky-500/10",
    address: "ltc1q9x3j7kvw9h6s2a0z5m9d4l8c3x7v6u1p2e3r4",
  },
  {
    id: "crypto_usdt",
    name: "USDT (TRC-20)",
    badge: "INSTANTANÉ",
    icon: "₮",
    color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
    address: "TXYZ9876543210AbCdEfGhIjKlMnOpQrSt",
  },
  {
    id: "crypto_btc",
    name: "Bitcoin (BTC)",
    badge: "SÉCURISÉ",
    icon: "₿",
    color: "text-amber-400 border-amber-500/20 bg-amber-500/10",
    address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  },
];

/* ===================================================================== */

export default function RechargeView({ onBackToServices }: RechargeViewProps) {
  const { user, haptic } = useTelegram();
  const toast = useToast();

  const [amount, setAmount] = useState<string>("");
  const [selectedMethod, setSelectedMethod] = useState<string>("card");
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);

  const activeAmount = parseFloat(amount) || 0;
  const currentMethod = PAYMENT_METHODS.find((m) => m.id === selectedMethod) || PAYMENT_METHODS[0];

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    setAmount(val);
  };

  const handleCopy = (text: string) => {
    haptic("notification");
    navigator.clipboard.writeText(text);
    toast.success("Adresse copiée dans le presse-papier !");
  };

  const handleProceed = () => {
    if (activeAmount < 5) {
      toast.error("Le montant minimum de recharge est de 5 €");
      return;
    }
    haptic("impact");
    setShowPaymentModal(true);
  };

  return (
    <div className="space-y-4 pb-24 fade-in">
      <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-[#12162a] to-[#0a0d18] border border-white/10 shadow-xl">
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Wallet size={16} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-black tracking-widest text-white/40">Solde disponible</p>
              <h2 className="text-2xl font-black italic text-white tracking-tight">0,00 €</h2>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[9px] font-black tracking-wider uppercase">
              <ShieldCheck size={10} /> Compte Actif
            </span>
            <span className="text-[9px] text-white/40 mt-1 font-medium">
              ID: {user?.id || "9283741"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[11px] text-white/60">
          <span className="flex items-center gap-1.5 font-medium">
            <Zap size={12} className="text-amber-400" /> Crédit automatique 24/7
          </span>
          <span className="text-primary font-bold">Sans frais de réseau</span>
        </div>
      </div>

      <div className="bg-[#0f121d]/80 backdrop-blur-md rounded-2xl p-4 border border-white/[0.06] space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-white/50 block">
          1. Montant à recharger
        </label>
        <div className="relative flex items-center">
          <input
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={amount}
            onChange={handleAmountChange}
            className="w-full h-12 rounded-xl px-4 text-base font-black text-white bg-white/[0.03] border border-white/10 focus:border-primary/80 transition-colors outline-none placeholder:text-white/20"
          />
          <span className="absolute right-4 text-sm font-black text-white/40 pointer-events-none">
            € EUR
          </span>
        </div>
      </div>

      <div className="bg-[#0f121d]/80 backdrop-blur-md rounded-2xl p-4 border border-white/[0.06] space-y-3">
        <label className="text-[10px] font-black uppercase tracking-widest text-white/50 block">
          2. Mode de paiement
        </label>

        <div className="space-y-2">
          {PAYMENT_METHODS.map((method) => {
            const isSelected = selectedMethod === method.id;
            return (
              <button
                key={method.id}
                type="button"
                onClick={() => {
                  haptic("selection");
                  setSelectedMethod(method.id);
                }}
                className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all ${
                  isSelected
                    ? "bg-white/[0.07] border-primary/60 shadow-sm"
                    : "bg-white/[0.02] border-white/5 text-white hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm border ${method.color}`}>
                    {method.icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{method.name}</h4>
                    <span className="text-[9px] font-black tracking-wider uppercase text-white/40">
                      {method.badge}
                    </span>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? "border-primary bg-primary" : "border-white/20"}`}>
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={handleProceed}
          disabled={activeAmount <= 0}
          className="w-full h-12 rounded-2xl bg-primary text-slate-950 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary/25 active:scale-[0.99] disabled:opacity-50 transition-all"
        >
          <span>{activeAmount > 0 ? `Recharger ${activeAmount} €` : "Saisir un montant"}</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4 fade-in">
          <div className="w-full max-w-sm bg-[#111422] border border-white/10 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <QrCode size={18} className="text-primary" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  Paiement {currentMethod.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 text-xs hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="text-center py-2">
              <p className="text-[11px] text-white/50 uppercase tracking-wider font-bold">Montant net à transférer</p>
              <h2 className="text-3xl font-black italic text-primary mt-0.5">{activeAmount} €</h2>
            </div>

            {currentMethod.id !== "card" ? (
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 block">
                  Adresse de versement
                </label>
                <div className="p-3 bg-white/[0.04] border border-white/10 rounded-xl flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-white/80 break-all select-all">
                    {currentMethod.address}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(currentMethod.address)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white shrink-0"
                  >
                    <Copy size={14} />
                  </button>
                </div>
                <p className="text-[10px] text-amber-300/80 font-medium">
                  Le crédit est appliqué dès 1 confirmation blockchain sur le réseau.
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-center py-2">
                <p className="text-xs text-white/70">
                  Cliquez ci-dessous pour ouvrir la page de paiement sécurisée par carte.
                </p>
                <a
                  href={currentMethod.address}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-11 rounded-xl bg-white text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  Ouvrir la page de paiement <ExternalLink size={14} />
                </a>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setShowPaymentModal(false);
                toast.info("Demande de paiement enregistrée");
              }}
              className="w-full h-10 rounded-xl bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-wider hover:bg-white/15"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
