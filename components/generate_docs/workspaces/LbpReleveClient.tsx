"use client";

import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Download,
  Eye,
  FileText,
  PiggyBank,
  RefreshCw,
  Sparkles,
  User,
  Wallet
} from "lucide-react";
import { useTelegram } from "@/components/TelegramContext";
import { useToast } from "@/components/NotificationToast";
import DocumentPreviewViewer from "../_shared/DocumentPreviewViewer";
import { usePreviewCooldown } from "../_shared/usePreviewCooldown";

/* ===================================================================== */

interface DurationOption {
  months: number;
  label: string;
  sublabel: string;
  price: number;
  badge?: string;
}

const DURATION_OPTIONS: DurationOption[] = [
  { months: 1, label: "1 Mois", sublabel: "Relevé unitaire", price: 8 },
  { months: 3, label: "3 Mois", sublabel: "Trimestre standard (Location)", price: 20, badge: "POPULAIRE" },
  { months: 6, label: "6 Mois", sublabel: "Semestre complet", price: 40 },
  { months: 12, label: "12 Mois", sublabel: "Année entière", price: 60, badge: "ÉCONOMIE" }
];

const PROFILES = [
  { id: "normal", label: "Salarié Standard", desc: "Salaire CDI, courses, abonnements, virements" },
  { id: "fonctionnaire", label: "Fonctionnaire", desc: "Traitement DGFIP, mutuelle, prélèvements" },
  { id: "retraite", label: "Retraité", desc: "Pensions CARSAT, pharmacie, mutuelle" },
  { id: "independant", label: "Indépendant", desc: "Virements factures, URSSAF, pro" },
  { id: "locataire", label: "Locataire Sain", desc: "Revenus réguliers, sans découverts" },
  { id: "etudiant", label: "Étudiant", desc: "Bourse CROUS, petits virements" }
];

const WEALTH_PROFILES = [
  { id: "pauvre", label: "Modeste", desc: "Dépenses mesurées, montants bas" },
  { id: "moyen", label: "Standard", desc: "Dépenses courantes de la vie active" },
  { id: "riche", label: "Aisé", desc: "Hauts revenus et soldes confortables" }
];

const FRENCH_MONTHS = [
  { id: 1, name: "Janvier" },
  { id: 2, name: "Février" },
  { id: 3, name: "Mars" },
  { id: 4, name: "Avril" },
  { id: 5, name: "Mai" },
  { id: 6, name: "Juin" },
  { id: 7, name: "Juillet" },
  { id: 8, name: "Août" },
  { id: 9, name: "Septembre" },
  { id: 10, name: "Octobre" },
  { id: 11, name: "Novembre" },
  { id: 12, name: "Décembre" }
];

const DEFAULT_FORM = {
  duree_mois: 3,
  mois_debut: 1,
  annee_debut: 2026,
  profile_id: "normal",
  wealth_level: "moyen",
  mode: "automatique",

  titulaire: "M. LUCAS MARTIN",
  adresse: "12 RUE DES FLEURS",
  cp: "75011",
  ville: "PARIS",

  compte_numero: "0847291B020",
  iban: "FR76 2004 1010 0508 4729 1B02 045",
  bic: "PSSTFRPPPAR",

  solde_initial: "2840,50",
  salaire_montant: "2450,00",
  loyer_montant: "750,00",

  include_epargne: false,
  include_prelevements: true
};

/* ===================================================================== */

interface LbpReleveClientProps {
  onBack?: () => void;
}

export default function LbpReleveClient({ onBack }: LbpReleveClientProps) {
  const { user, balance, refreshBalance, initData, haptic } = useTelegram();
  const toast = useToast();

  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const previewUrlRef = useRef<string | null>(null);
  const { cooldown, isBlocked, assertReady, startCooldown, formatTimer } = usePreviewCooldown("releve", initData);
  const [durationPrices, setDurationPrices] = useState<Record<number, number>>({
    1: 8,
    3: 20,
    6: 40,
    12: 60
  });

  useEffect(() => {
    async function loadPrices() {
      try {
        const headers: Record<string, string> = {};
        if (initData) headers["x-telegram-init-data"] = initData;
        const res = await fetch("/api/proxy/generate-docs/config", { headers });
        if (res.ok) {
          const cfg = await res.json();
          if (cfg.prices) {
            setDurationPrices(prev => ({
              1: Number(cfg.prices.releve_lbp_1m ?? cfg.prices.releve_lbp ?? prev[1]),
              3: Number(cfg.prices.releve_lbp_3m ?? prev[3]),
              6: Number(cfg.prices.releve_lbp_6m ?? prev[6]),
              12: Number(cfg.prices.releve_lbp_12m ?? prev[12])
            }));
          }
        }
      } catch {}
    }
    loadPrices();
  }, [initData]);

  const selectedDuration = DURATION_OPTIONS.find(d => d.months === formData.duree_mois) || DURATION_OPTIONS[1];
  const totalPrice = durationPrices[formData.duree_mois] ?? selectedDuration.price;

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateAll = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!formData.titulaire.trim()) nextErrors.titulaire = "Nom du titulaire requis";
    if (!formData.adresse.trim()) nextErrors.adresse = "Adresse requise";
    if (!formData.cp.trim() || formData.cp.length !== 5) nextErrors.cp = "Code postal (5 chiffres) requis";
    if (!formData.ville.trim()) nextErrors.ville = "Ville requise";
    if (!formData.iban.trim() || formData.iban.replace(/\s/g, "").length < 15) nextErrors.iban = "IBAN valide requis";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handlePreview = async () => {
    if (!assertReady(msg => toast.error(msg))) return;
    if (!validateAll()) {
      toast.error("Veuillez corriger les champs requis.");
      return;
    }
    haptic("impact");
    setIsPreviewLoading(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (initData) headers["x-telegram-init-data"] = initData;

      const res = await fetch("/api/proxy/generate-docs/releve/lbp/preview", {
        method: "POST",
        headers,
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Erreur de prévisualisation");
      }
      const blob = await res.blob();
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      const url = URL.createObjectURL(blob);
      previewUrlRef.current = url;
      setPreviewUrl(url);
      startCooldown();
      toast.success("Aperçu généré avec succès !");
    } catch (e: any) {
      toast.error(e.message || "Impossible de générer l'aperçu");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!validateAll()) {
      toast.error("Veuillez corriger les champs requis.");
      return;
    }
    if (balance < totalPrice) {
      toast.error(`Solde insuffisant (${balance.toFixed(2)} € / ${totalPrice.toFixed(2)} €)`);
      return;
    }
    haptic("impact");
    setIsGenerating(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (initData) headers["x-telegram-init-data"] = initData;

      const res = await fetch("/api/proxy/generate-docs/releve/lbp/generate", {
        method: "POST",
        headers,
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Erreur de génération");
      }

      const contentDisposition = res.headers.get("content-disposition");
      let filename = formData.duree_mois === 1
        ? `Releve_LBP_${formData.mois_debut}_${formData.annee_debut}.pdf`
        : `Releves_LBP_${formData.duree_mois}_mois.zip`;
      if (contentDisposition && contentDisposition.includes("filename=")) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      await refreshBalance();
      toast.success("Relevés bancaires générés et téléchargés !");
    } catch (e: any) {
      toast.error(e.message || "Erreur de génération");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4 pb-20 fade-in">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-white/60 hover:text-white transition-colors bg-white/[0.04] border border-white/10 px-3 py-1.5 rounded-xl active:scale-95"
        >
          <ArrowLeft size={13} />
          <span>Relevés</span>
        </button>

        <span className="text-[11px] font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-xl">
          {totalPrice.toFixed(2).replace(".", ",")} €
        </span>
      </div>

      <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/40 to-slate-950/80 border border-blue-500/30 flex items-center gap-3.5 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
          <FileText size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-black italic text-white uppercase tracking-tight truncate">Relevé La Banque Postale</h2>
          <p className="text-[10px] text-white/50 font-medium truncate">Relevé de compte officiel avec historique des opérations</p>
        </div>
      </div>

      <div className="bg-[#0f121d]/80 border border-white/[0.06] rounded-2xl p-3.5 space-y-3">
        <h3 className="text-xs font-black italic text-white/90 uppercase tracking-wider flex items-center gap-2 border-b border-white/[0.04] pb-2">
          <Calendar size={13} className="text-primary" />
          <span>Durée & Période</span>
        </h3>

        <div className="grid grid-cols-2 gap-2">
          {DURATION_OPTIONS.map(opt => (
            <button
              key={opt.months}
              type="button"
              onClick={() => handleChange("duree_mois", opt.months)}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                formData.duree_mois === opt.months
                  ? "bg-primary/20 border-primary shadow-sm"
                  : "bg-white/5 border-white/10 text-white/70 hover:border-white/20"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white">{opt.label}</span>
                <span className="text-[10px] font-mono font-bold text-primary">
                  {durationPrices[opt.months] ?? opt.price} €
                </span>
              </div>
              <p className="text-[9px] text-white/40 truncate mt-0.5">{opt.sublabel}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-white/50 uppercase">Mois de départ</label>
            <select
              value={formData.mois_debut}
              onChange={e => handleChange("mois_debut", parseInt(e.target.value, 10))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary"
            >
              {FRENCH_MONTHS.map(m => (
                <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-white/50 uppercase">Année</label>
            <select
              value={formData.annee_debut}
              onChange={e => handleChange("annee_debut", parseInt(e.target.value, 10))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary"
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y} className="bg-slate-900 text-white">
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-[#0f121d]/80 border border-white/[0.06] rounded-2xl p-3.5 space-y-3">
        <h3 className="text-xs font-black italic text-white/90 uppercase tracking-wider flex items-center gap-2 border-b border-white/[0.04] pb-2">
          <Sparkles size={13} className="text-primary" />
          <span>Profil & Train de vie</span>
        </h3>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-white/50 uppercase">Situation professionnelle</label>
          <div className="grid grid-cols-2 gap-1.5">
            {PROFILES.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleChange("profile_id", p.id)}
                className={`p-2 rounded-xl border text-left transition-all ${
                  formData.profile_id === p.id
                    ? "bg-primary/20 border-primary text-white"
                    : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                }`}
              >
                <div className="text-xs font-bold truncate">{p.label}</div>
                <div className="text-[9px] text-white/40 truncate">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <label className="text-[10px] font-bold text-white/50 uppercase">Niveau de revenu</label>
          <div className="grid grid-cols-3 gap-1.5">
            {WEALTH_PROFILES.map(w => (
              <button
                key={w.id}
                type="button"
                onClick={() => handleChange("wealth_level", w.id)}
                className={`py-2 px-2 rounded-xl border text-center transition-all ${
                  formData.wealth_level === w.id
                    ? "bg-primary/20 border-primary text-white font-bold"
                    : "bg-white/5 border-white/10 text-white/60 hover:text-white text-xs font-medium"
                }`}
              >
                <div className="text-xs font-bold">{w.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#0f121d]/80 border border-white/[0.06] rounded-2xl p-3.5 space-y-3">
        <h3 className="text-xs font-black italic text-white/90 uppercase tracking-wider flex items-center gap-2 border-b border-white/[0.04] pb-2">
          <User size={13} className="text-primary" />
          <span>Titulaire & Compte</span>
        </h3>

        <div className="space-y-2.5">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-white/50 uppercase">Nom & Prénom titulaire *</label>
            <input
              type="text"
              value={formData.titulaire}
              onChange={e => handleChange("titulaire", e.target.value.toUpperCase())}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono focus:border-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-white/50 uppercase">Adresse postale *</label>
            <input
              type="text"
              value={formData.adresse}
              onChange={e => handleChange("adresse", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/50 uppercase">Code postal *</label>
              <input
                type="text"
                value={formData.cp}
                onChange={e => handleChange("cp", e.target.value)}
                maxLength={5}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/50 uppercase">Ville *</label>
              <input
                type="text"
                value={formData.ville}
                onChange={e => handleChange("ville", e.target.value.toUpperCase())}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-white/50 uppercase">IBAN La Banque Postale *</label>
            <input
              type="text"
              value={formData.iban}
              onChange={e => handleChange("iban", e.target.value.toUpperCase())}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/50 uppercase">Solde initial (€)</label>
              <input
                type="text"
                value={formData.solde_initial}
                onChange={e => handleChange("solde_initial", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/50 uppercase">Salaire perçu (€)</label>
              <input
                type="text"
                value={formData.salaire_montant}
                onChange={e => handleChange("salaire_montant", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2 space-y-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePreview}
            disabled={isPreviewLoading || isBlocked}
            className="flex-1 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isPreviewLoading ? (
              <RefreshCw size={14} className="animate-spin text-primary" />
            ) : (
              <Eye size={14} className="text-primary" />
            )}
            <span>
              {isBlocked ? `Aperçu (${formatTimer(cooldown)})` : "Aperçu gratuit"}
            </span>
          </button>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex-1 py-3 rounded-xl bg-primary text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 active:scale-[0.98] disabled:opacity-50 hover:bg-primary/90"
          >
            {isGenerating ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            <span>Générer ({totalPrice.toFixed(2).replace(".", ",")} €)</span>
          </button>
        </div>
      </div>

      {previewUrl && (
        <DocumentPreviewViewer
          url={previewUrl}
          title="Aperçu Relevé LBP"
          onClose={() => setPreviewUrl(null)}
          onAction={handleGenerate}
          actionLabel={`Acheter (${totalPrice.toFixed(2).replace(".", ",")} €)`}
          isActionLoading={isGenerating}
        />
      )}
    </div>
  );
}
