"use client";

import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Download,
  Eye,
  RefreshCw,
  Sparkles,
  User,
  Wallet
} from "lucide-react";
import { useTelegram } from "@/components/TelegramContext";
import { useToast } from "@/components/NotificationToast";
import { isValidCalendarDate } from "../_shared/CustomDatePicker";
import MultiPagePreviewViewer from "../_shared/MultiPagePreviewViewer";
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
  { months: 1, label: "1 Mois", sublabel: "Bulletin unitaire", price: 8 },
  { months: 3, label: "3 Mois", sublabel: "Trimestre standard (Dossier locatif)", price: 20, badge: "POPULAIRE" },
  { months: 6, label: "6 Mois", sublabel: "Semestre complet (Crédit)", price: 40 },
  { months: 12, label: "12 Mois", sublabel: "Année entière (Bilan complet)", price: 60, badge: "ÉCONOMIE" }
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
  mode: "facile" as "facile" | "personnalise",
  duree_mois: 3,
  mois_debut: 1,
  annee_debut: 2026,

  raison_sociale: "GROUPE EUROPE HANDLING",
  adresse: "3 RUE DU REMBLAI",
  code_postal: "93290",
  ville: "TREMBLAY-EN-FRANCE",
  siret: "40114427400040",
  code_naf: "5223Z",
  etablissement: "Siège social",
  convention_collective: "Convention collective nationale du personnel au sol des entreprises de transport aérien",
  convention_collective_court: "PERSONNEL AU SOL DU TRANSPORT AERIEN",

  civilite: "M.",
  nom: "MARTIN",
  prenom: "Lucas",
  nom_complet: "MARTIN LUCAS",
  salarie_adresse: "12 RUE DES FLEURS",
  salarie_cp: "75011",
  salarie_ville: "PARIS",
  nir: "1950475111001",
  matricule: "05984",
  emploi: "SUPERVISEUR COMMERCIAL",
  qualification: "EMPLOYE",
  echelon: "2",
  coefficient: "215",
  date_anciennete: "18/03/2023",

  net_a_payer_cible: "2460,00",
  salaire_base: "",
  heures_mensuelles: "151,67",
  prime_habillage: "210,42",
  frais_professionnels: "94,00",
  mutuelle_salarie: "33,59",
  mutuelle_patronale: "64,45",
  allegement_cotisations: "63,15",
  taux_pas: "5,00",

  net_imposable: "",
  brut_mensuel: "",
  total_cotisations_salariales: "",
  total_cotisations_patronales: "",
  cout_global: ""
};

/* ===================================================================== */

interface FicheDePaieClientProps {
  onBack?: () => void;
}

export default function FicheDePaieClient({ onBack }: FicheDePaieClientProps) {
  const { user, balance, refreshBalance, initData, haptic } = useTelegram();
  const toast = useToast();

  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewPages, setPreviewPages] = useState<string[]>([]);

  const { cooldown, isBlocked, assertReady, startCooldown, formatTimer } = usePreviewCooldown("emploi", initData);
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
              1: Number(cfg.prices.fiche_de_paie_1m ?? cfg.prices.fiche_de_paie ?? prev[1]),
              3: Number(cfg.prices.fiche_de_paie_3m ?? prev[3]),
              6: Number(cfg.prices.fiche_de_paie_6m ?? prev[6]),
              12: Number(cfg.prices.fiche_de_paie_12m ?? prev[12])
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
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === "nom" || field === "prenom") {
        next.nom_complet = `${next.nom || ""} ${next.prenom || ""}`.trim().toUpperCase();
      }
      return next;
    });
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
    if (!formData.raison_sociale.trim()) nextErrors.raison_sociale = "Raison sociale requise";
    if (!formData.siret.trim()) nextErrors.siret = "SIRET requis";
    if (!formData.nom.trim()) nextErrors.nom = "Nom requis";
    if (!formData.prenom.trim()) nextErrors.prenom = "Prénom requis";
    if (!formData.emploi.trim()) nextErrors.emploi = "Poste requis";

    const netRaw = formData.net_a_payer_cible.replace("€", "").replace(/\s/g, "").replace(",", ".").trim();
    const netVal = parseFloat(netRaw);
    if (isNaN(netVal) || netVal <= 0) {
      nextErrors.net_a_payer_cible = "Salaire net invalide (> 0 €)";
    }

    if (formData.date_anciennete && formData.date_anciennete.trim()) {
      const check = isValidCalendarDate(formData.date_anciennete);
      if (!check.valid) {
        nextErrors.date_anciennete = check.message || "Date invalide.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handlePreview = async () => {
    if (!assertReady(msg => toast.error(msg))) return;
    if (!validateAll()) {
      toast.error("Veuillez corriger les champs obligatoires.");
      return;
    }
    haptic("impact");
    setIsPreviewLoading(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (initData) headers["x-telegram-init-data"] = initData;

      const res = await fetch("/api/proxy/generate-docs/emploi/fiche_de_paie/preview", {
        method: "POST",
        headers,
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Erreur de prévisualisation");
      }
      const data = await res.json();
      setPreviewPages(data.pages || []);
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
      toast.error("Veuillez corriger les champs obligatoires.");
      return;
    }
    if (balance < totalPrice) {
      toast.error(`Solde insuffisant (${balance.toFixed(2)} € / ${totalPrice.toFixed(2)} € requis)`);
      return;
    }
    haptic("impact");
    setIsGenerating(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (initData) headers["x-telegram-init-data"] = initData;

      const res = await fetch("/api/proxy/generate-docs/emploi/fiche_de_paie/generate", {
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
        ? `Fiche_de_paie_${formData.mois_debut}_${formData.annee_debut}.pdf`
        : `Fiches_de_paie_${formData.duree_mois}_mois.zip`;
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
      toast.success("Bulletins de paie générés et téléchargés !");
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
          <span>Emploi</span>
        </button>

        <span className="text-[11px] font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-xl">
          {totalPrice.toFixed(2).replace(".", ",")} €
        </span>
      </div>

      <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-950/80 border border-indigo-500/30 flex items-center gap-3.5 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
          <Briefcase size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-black italic text-white uppercase tracking-tight truncate">Bulletin de Salaire Officiel</h2>
          <p className="text-[10px] text-white/50 font-medium truncate">Norme française conforme avec calculs URSSAF</p>
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
          <Building2 size={13} className="text-primary" />
          <span>Entreprise Employeur</span>
        </h3>

        <div className="space-y-2.5">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-white/50 uppercase">Raison sociale *</label>
            <input
              type="text"
              value={formData.raison_sociale}
              onChange={e => handleChange("raison_sociale", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/50 uppercase">SIRET (14 chiffres) *</label>
              <input
                type="text"
                value={formData.siret}
                onChange={e => handleChange("siret", e.target.value)}
                maxLength={14}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/50 uppercase">Code NAF</label>
              <input
                type="text"
                value={formData.code_naf}
                onChange={e => handleChange("code_naf", e.target.value.toUpperCase())}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-white/50 uppercase">Adresse entreprise</label>
            <input
              type="text"
              value={formData.adresse}
              onChange={e => handleChange("adresse", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/50 uppercase">Code postal</label>
              <input
                type="text"
                value={formData.code_postal}
                onChange={e => handleChange("code_postal", e.target.value)}
                maxLength={5}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/50 uppercase">Ville</label>
              <input
                type="text"
                value={formData.ville}
                onChange={e => handleChange("ville", e.target.value.toUpperCase())}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#0f121d]/80 border border-white/[0.06] rounded-2xl p-3.5 space-y-3">
        <h3 className="text-xs font-black italic text-white/90 uppercase tracking-wider flex items-center gap-2 border-b border-white/[0.04] pb-2">
          <User size={13} className="text-primary" />
          <span>Salarié</span>
        </h3>

        <div className="space-y-2.5">
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/50 uppercase">Civilité</label>
              <select
                value={formData.civilite}
                onChange={e => handleChange("civilite", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-xs text-white outline-none focus:border-primary"
              >
                <option value="M.">M.</option>
                <option value="MME">Mme</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/50 uppercase">Nom *</label>
              <input
                type="text"
                value={formData.nom}
                onChange={e => handleChange("nom", e.target.value.toUpperCase())}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/50 uppercase">Prénom *</label>
              <input
                type="text"
                value={formData.prenom}
                onChange={e => handleChange("prenom", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-white/50 uppercase">Adresse salarié</label>
            <input
              type="text"
              value={formData.salarie_adresse}
              onChange={e => handleChange("salarie_adresse", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/50 uppercase">Code postal</label>
              <input
                type="text"
                value={formData.salarie_cp}
                onChange={e => handleChange("salarie_cp", e.target.value)}
                maxLength={5}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/50 uppercase">Ville</label>
              <input
                type="text"
                value={formData.salarie_ville}
                onChange={e => handleChange("salarie_ville", e.target.value.toUpperCase())}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/50 uppercase">N° Sécurité Sociale (NIR)</label>
              <input
                type="text"
                value={formData.nir}
                onChange={e => handleChange("nir", e.target.value.replace(/\D/g, ""))}
                maxLength={15}
                placeholder="1950475111001"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/50 uppercase">Matricule</label>
              <input
                type="text"
                value={formData.matricule}
                onChange={e => handleChange("matricule", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/50 uppercase">Emploi / Poste *</label>
              <input
                type="text"
                value={formData.emploi}
                onChange={e => handleChange("emploi", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/50 uppercase">Date d'ancienneté</label>
              <input
                type="text"
                value={formData.date_anciennete}
                onChange={e => handleChange("date_anciennete", e.target.value)}
                placeholder="18/03/2023"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono focus:border-primary"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#0f121d]/80 border border-white/[0.06] rounded-2xl p-3.5 space-y-3">
        <h3 className="text-xs font-black italic text-white/90 uppercase tracking-wider flex items-center gap-2 border-b border-white/[0.04] pb-2">
          <Wallet size={13} className="text-primary" />
          <span>Rémunération & Net à payer</span>
        </h3>

        <div className="space-y-2.5">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-white/50 uppercase">Net à payer cible mensuel (€) *</label>
            <input
              type="text"
              value={formData.net_a_payer_cible}
              onChange={e => handleChange("net_a_payer_cible", e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-primary outline-none"
              placeholder="2460,00"
            />
            <p className="text-[9px] text-white/40">Le moteur rétro-calcule automatiquement le brut, le net fiscal et toutes les cotisations sociales.</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/50 uppercase">Heures mensuelles</label>
              <input
                type="text"
                value={formData.heures_mensuelles}
                onChange={e => handleChange("heures_mensuelles", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/50 uppercase">Taux PAS (%)</label>
              <input
                type="text"
                value={formData.taux_pas}
                onChange={e => handleChange("taux_pas", e.target.value)}
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

      {previewPages.length > 0 && (
        <MultiPagePreviewViewer
          pages={previewPages}
          title="Aperçu Bulletin de Salaire"
          onClose={() => setPreviewPages([])}
          onAction={handleGenerate}
          actionLabel={`Acheter (${totalPrice.toFixed(2).replace(".", ",")} €)`}
          isActionLoading={isGenerating}
        />
      )}
    </div>
  );
}
