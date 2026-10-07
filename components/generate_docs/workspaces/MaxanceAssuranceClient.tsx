"use client";

import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Car,
  Download,
  Eye,
  RefreshCw,
  Shield,
  Sparkles,
  User
} from "lucide-react";
import { useTelegram } from "@/components/TelegramContext";
import { useToast } from "@/components/NotificationToast";
import ImmatriculationInput from "../_shared/ImmatriculationInput";
import CustomDatePicker, { isValidCalendarDate } from "../_shared/CustomDatePicker";
import DocumentPreviewViewer from "../_shared/DocumentPreviewViewer";
import { usePreviewCooldown } from "../_shared/usePreviewCooldown";
import { slashDate } from "../_shared/exampleDates";

/* ===================================================================== */

const DEFAULT_FORM = {
  civilite: "M.",
  nom: "MARTIN",
  prenom: "Lucas",
  adresse: "12 RUE DES FLEURS",
  cp: "75011",
  ville: "PARIS",

  vehicule_marque_modele: "PEUGEOT 208",
  immatriculation: "FA-120-GM",
  num_formule: "2021FN39201",
  num_serie: "VF3CCMH009218201",
  date_premiere_immat: "15/04/2021",

  num_contrat: "MAX-2024-91024",
  date_effet: slashDate(),
  formule_garantie: "TOUS RISQUES",
  usage: "Prive et Trajet Travail"
};

/* ===================================================================== */

interface MaxanceAssuranceClientProps {
  onBack?: () => void;
}

export default function MaxanceAssuranceClient({ onBack }: MaxanceAssuranceClientProps) {
  const { user, balance, refreshBalance, initData, haptic } = useTelegram();
  const toast = useToast();

  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [documentPrice, setDocumentPrice] = useState<number>(1.0);

  const previewUrlRef = useRef<string | null>(null);
  const { cooldown, isBlocked, assertReady, startCooldown, formatTimer } = usePreviewCooldown("assurance", initData);

  useEffect(() => {
    async function loadPrice() {
      try {
        const headers: Record<string, string> = {};
        if (initData) headers["x-telegram-init-data"] = initData;
        const res = await fetch("/api/proxy/generate-docs/config", { headers });
        if (res.ok) {
          const cfg = await res.json();
          if (cfg.prices && cfg.prices.maxance) {
            setDocumentPrice(Number(cfg.prices.maxance));
          }
        }
      } catch {}
    }
    loadPrice();
  }, [initData]);

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
    if (!formData.nom.trim()) nextErrors.nom = "Nom requis";
    if (!formData.prenom.trim()) nextErrors.prenom = "Prénom requis";
    if (!formData.adresse.trim()) nextErrors.adresse = "Adresse requise";
    if (!formData.cp.trim() || formData.cp.length !== 5) nextErrors.cp = "Code postal (5 chiffres) requis";
    if (!formData.ville.trim()) nextErrors.ville = "Ville requise";
    if (!formData.vehicule_marque_modele.trim()) nextErrors.vehicule_marque_modele = "Véhicule requis";
    if (!formData.immatriculation.trim()) nextErrors.immatriculation = "Immatriculation requise";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const getPayload = () => {
    const civ = formData.civilite ? `${formData.civilite} ` : "";
    const fullTitulaire = `${civ}${formData.nom} ${formData.prenom}`.trim().toUpperCase();
    const fullCpVille = `${formData.cp} ${formData.ville}`.trim().toUpperCase();
    return {
      ...formData,
      titulaire: fullTitulaire,
      cp_ville: fullCpVille,
      vehicule: formData.vehicule_marque_modele
    };
  };

  const downloadBlob = (blob: Blob, name: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const handlePreview = async () => {
    if (!assertReady(msg => toast.error(msg))) return;
    if (!validateAll()) {
      toast.error("Veuillez remplir correctement les champs.");
      return;
    }
    haptic("impact");
    setIsPreviewLoading(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (initData) headers["x-telegram-init-data"] = initData;

      const res = await fetch("/api/proxy/generate-docs/assurance/maxance/preview", {
        method: "POST",
        headers,
        body: JSON.stringify(getPayload())
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || "Erreur de prévisualisation");
      }
      const blob = await res.blob();
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      const url = URL.createObjectURL(blob);
      previewUrlRef.current = url;
      setPreviewUrl(url);
      startCooldown();
      toast.success("Aperçu généré avec succès !");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'aperçu");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!validateAll()) {
      toast.error("Veuillez remplir correctement les champs.");
      return;
    }
    if (balance < documentPrice) {
      toast.error(`Solde insuffisant (${balance.toFixed(2)} € / ${documentPrice.toFixed(2)} €)`);
      return;
    }
    haptic("impact");
    setIsGenerating(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (initData) headers["x-telegram-init-data"] = initData;

      const res = await fetch("/api/proxy/generate-docs/assurance/maxance/generate", {
        method: "POST",
        headers,
        body: JSON.stringify(getPayload())
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || "Erreur lors de la génération");
      }
      const blob = await res.blob();
      const immatClean = (formData.immatriculation || "vehicule").replace(/[^A-Za-z0-9]/g, "_");
      downloadBlob(blob, `Memo_Vehicule_Assure_Maxance_${immatClean}.pdf`);
      await refreshBalance();
      toast.success("Mémo Véhicule Assuré généré et téléchargé !");
    } catch (err: any) {
      toast.error(err.message || "Impossible de générer le document");
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
          <span>Assurances</span>
        </button>

        <span className="text-[11px] font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-xl">
          {documentPrice.toFixed(2).replace(".", ",")} €
        </span>
      </div>

      <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-950/80 border border-emerald-500/30 flex items-center gap-3.5 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 p-1.5 flex items-center justify-center shrink-0 overflow-hidden">
          <img src="/logos/maxance.png" alt="" className="max-h-full max-w-full object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-black italic text-white uppercase tracking-tight truncate">Maxance Assurance</h2>
          <p className="text-[10px] text-white/50 font-medium truncate">Mémo Véhicule Assuré officiel</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-[#0f121d]/80 border border-white/[0.06] rounded-2xl p-3.5 space-y-3">
          <h3 className="text-xs font-black italic text-white/90 uppercase tracking-wider flex items-center gap-2 border-b border-white/[0.04] pb-2">
            <User size={13} className="text-primary" />
            <span>Assuré / Titulaire</span>
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
              <label className="text-[10px] font-bold text-white/50 uppercase">Adresse *</label>
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
          </div>
        </div>

        <div className="bg-[#0f121d]/80 border border-white/[0.06] rounded-2xl p-3.5 space-y-3">
          <h3 className="text-xs font-black italic text-white/90 uppercase tracking-wider flex items-center gap-2 border-b border-white/[0.04] pb-2">
            <Car size={13} className="text-primary" />
            <span>Véhicule</span>
          </h3>

          <div className="space-y-2.5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/50 uppercase">Marque & Modèle *</label>
              <input
                type="text"
                value={formData.vehicule_marque_modele}
                onChange={e => handleChange("vehicule_marque_modele", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/50 uppercase">Immatriculation *</label>
              <ImmatriculationInput
                value={formData.immatriculation}
                onChange={val => handleChange("immatriculation", val)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-white/50 uppercase">N° Formule</label>
                <input
                  type="text"
                  value={formData.num_formule}
                  onChange={e => handleChange("num_formule", e.target.value.toUpperCase())}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-white/50 uppercase">N° Série (VIN)</label>
                <input
                  type="text"
                  value={formData.num_serie}
                  onChange={e => handleChange("num_serie", e.target.value.toUpperCase())}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/50 uppercase">Date 1ère Immatriculation</label>
              <CustomDatePicker
                value={formData.date_premiere_immat}
                onChange={val => handleChange("date_premiere_immat", val)}
              />
            </div>
          </div>
        </div>

        <div className="bg-[#0f121d]/80 border border-white/[0.06] rounded-2xl p-3.5 space-y-3">
          <h3 className="text-xs font-black italic text-white/90 uppercase tracking-wider flex items-center gap-2 border-b border-white/[0.04] pb-2">
            <Shield size={13} className="text-primary" />
            <span>Contrat & Garantie</span>
          </h3>

          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-white/50 uppercase">N° Contrat</label>
                <input
                  type="text"
                  value={formData.num_contrat}
                  onChange={e => handleChange("num_contrat", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-white/50 uppercase">Date d'effet</label>
                <CustomDatePicker
                  value={formData.date_effet}
                  onChange={val => handleChange("date_effet", val)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-white/50 uppercase">Formule garantie</label>
                <select
                  value={formData.formule_garantie}
                  onChange={e => handleChange("formule_garantie", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-xs text-white outline-none focus:border-primary"
                >
                  <option value="TIERS SIMPLE">Tiers Simple</option>
                  <option value="TIERS ETENDU">Tiers Étendu</option>
                  <option value="TOUS RISQUES">Tous Risques</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-white/50 uppercase">Usage</label>
                <input
                  type="text"
                  value={formData.usage}
                  onChange={e => handleChange("usage", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>
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
            <span>Générer ({documentPrice.toFixed(2).replace(".", ",")} €)</span>
          </button>
        </div>
      </div>

      {previewUrl && (
        <DocumentPreviewViewer
          url={previewUrl}
          title="Aperçu Mémo Maxance"
          onClose={() => setPreviewUrl(null)}
          onAction={handleGenerate}
          actionLabel={`Acheter (${documentPrice.toFixed(2).replace(".", ",")} €)`}
          isActionLoading={isGenerating}
        />
      )}
    </div>
  );
}
