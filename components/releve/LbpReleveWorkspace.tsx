"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Calendar, User, Wallet, Sparkles, RefreshCw, Eye, Download, Building2 } from "lucide-react";
import { useToast } from "@/components/NotificationToast";
import DocumentPreviewViewer from "@/components/_shared/DocumentPreviewViewer";

/* ===================================================================== */

interface LbpReleveWorkspaceProps {
  onBack: () => void;
}

export default function LbpReleveWorkspace({ onBack }: LbpReleveWorkspaceProps) {
  const toast = useToast();
  const [mode, setMode] = useState<"facile" | "custom">("facile");
  const [duree, setDuree] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [form, setForm] = useState({
    moisDebut: new Date().getMonth() + 1,
    anneeDebut: new Date().getFullYear(),
    numeroReleve: "1",
    civilite: "M",
    nom: "",
    prenom: "",
    adresse: "",
    cp: "",
    ville: "",
    identifiant: "",
    iban: "",
    profil: "normal",
    richesse: "moyen",
    soldeInitial: "1500",
    employeur: "",
    salaireNet: "2000",
    jourSalaire: "1",
    loyer: "600",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    }
  };

  const handleCpChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const cp = e.target.value;
    handleChange(e);
    if (cp.length === 5) {
      try {
        const res = await fetch(`https://geo.api.gouv.fr/communes?codePostal=${cp}`);
        const data = await res.json();
        if (data && data.length > 0) {
          setForm((prev) => ({ ...prev, ville: data[0].nom }));
        }
      } catch {}
    }
  };

  const generateAutoIds = () => {
    setForm((prev) => ({
      ...prev,
      identifiant: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
      iban: "FR76" + Math.floor(10000000000000000000000 + Math.random() * 9000000000000000000000).toString(),
    }));
    toast.info("Identifiants et IBAN générés");
  };

  const handleFillExample = () => {
    setForm({
      moisDebut: new Date().getMonth() + 1,
      anneeDebut: new Date().getFullYear(),
      numeroReleve: "1",
      civilite: "M",
      nom: "BERNARD",
      prenom: "Thomas",
      adresse: "8 Boulevard Voltaire",
      cp: "75011",
      ville: "Paris",
      identifiant: "3892019482",
      iban: "FR7620041010050500013M02606",
      profil: "normal",
      richesse: "moyen",
      soldeInitial: "2450.80",
      employeur: "AIRBUS FRANCE",
      salaireNet: "2600",
      jourSalaire: "28",
      loyer: "720",
    });
    toast.info("Exemple de relevé bancaire chargé");
  };

  const validateAll = () => {
    const newErrors: Record<string, string> = {};
    if (!form.nom) newErrors.nom = "Requis";
    if (!form.prenom) newErrors.prenom = "Requis";
    if (!form.identifiant) newErrors.identifiant = "Requis";
    if (!form.iban) newErrors.iban = "Requis";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePreview = async () => {
    if (!validateAll()) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }
    setIsPreviewing(true);
    try {
      const res = await fetch("/api/proxy/generate-docs/releve/lbp/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, duree, mode }),
      });
      if (!res.ok) throw new Error("Erreur lors de la prévisualisation");
      const blob = await res.blob();
      setPreviewUrl(URL.createObjectURL(blob));
      toast.success("Aperçu généré !");
    } catch (err: any) {
      toast.error(err.message || "Erreur de prévisualisation");
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleGenerate = async () => {
    if (!validateAll()) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/proxy/generate-docs/releve/lbp/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, duree, mode }),
      });
      if (!res.ok) throw new Error("Erreur de génération");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Releve_LBP_${form.nom}_${duree}mois.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Relevé de compte généré !");
    } catch (err: any) {
      toast.error(err.message || "Erreur de génération du relevé");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (err?: string) =>
    `w-full h-10 bg-white/[0.04] border ${
      err ? "border-rose-500/80" : "border-white/10"
    } focus:border-primary/80 rounded-xl px-3 text-xs text-white transition-colors outline-none placeholder:text-white/20`;

  return (
    <div className="space-y-4 pb-32 fade-in">
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} /> Retour relevés
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleFillExample}
            title="Remplir exemple"
            className="p-2 rounded-xl bg-white/[0.04] border border-white/10 text-white/70 hover:text-primary transition-colors"
          >
            <Sparkles size={13} className="text-amber-400" />
          </button>
          <div className="flex items-center gap-1 bg-white/[0.04] border border-white/10 p-0.5 rounded-xl">
            <button
              type="button"
              onClick={() => setMode("facile")}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                mode === "facile" ? "bg-primary text-slate-950" : "text-white/50"
              }`}
            >
              Facile
            </button>
            <button
              type="button"
              onClick={() => setMode("custom")}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                mode === "custom" ? "bg-primary text-slate-950" : "text-white/50"
              }`}
            >
              Avancé
            </button>
          </div>
        </div>
      </div>

      <div className="bg-[#0f121d]/80 backdrop-blur-md rounded-2xl p-3.5 border border-white/[0.06] space-y-3">
        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
          <Calendar size={15} className="text-primary" />
          <h3 className="text-xs font-black uppercase tracking-wider text-white">
            1. Période du relevé
          </h3>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {[1, 3, 6, 12].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setDuree(m)}
              className={`py-2 rounded-xl border text-center transition-all ${
                duree === m
                  ? "bg-primary/20 border-primary text-primary font-black"
                  : "bg-white/[0.03] border-white/5 text-white/70 hover:bg-white/[0.06] text-xs font-bold"
              }`}
            >
              <div className="text-xs">{m} {m > 1 ? "mois" : "mois"}</div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Mois début</label>
            <input
              type="number"
              name="moisDebut"
              value={form.moisDebut}
              onChange={handleChange}
              min={1}
              max={12}
              className={inputClass()}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Année début</label>
            <input
              type="number"
              name="anneeDebut"
              value={form.anneeDebut}
              onChange={handleChange}
              min={2020}
              max={2026}
              className={inputClass()}
            />
          </div>
        </div>
      </div>

      <div className="bg-[#0f121d]/80 backdrop-blur-md rounded-2xl p-3.5 border border-white/[0.06] space-y-3">
        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
          <User size={15} className="text-primary" />
          <h3 className="text-xs font-black uppercase tracking-wider text-white">
            2. Titulaire du compte
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Civilité</label>
            <select
              name="civilite"
              value={form.civilite}
              onChange={handleChange}
              className={`${inputClass()} appearance-none cursor-pointer`}
            >
              <option value="M" className="bg-[#0e111a]">Monsieur</option>
              <option value="MME" className="bg-[#0e111a]">Madame</option>
            </select>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Nom *</label>
              {errors.nom && <span className="text-rose-400 text-[9px]">{errors.nom}</span>}
            </div>
            <input
              type="text"
              name="nom"
              value={form.nom}
              onChange={handleChange}
              className={inputClass(errors.nom)}
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Prénom *</label>
              {errors.prenom && <span className="text-rose-400 text-[9px]">{errors.prenom}</span>}
            </div>
            <input
              type="text"
              name="prenom"
              value={form.prenom}
              onChange={handleChange}
              className={inputClass(errors.prenom)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Code Postal</label>
            <input
              type="text"
              name="cp"
              maxLength={5}
              value={form.cp}
              onChange={handleCpChange}
              className={inputClass()}
            />
          </div>

          <div className="space-y-1 col-span-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Adresse</label>
            <input
              type="text"
              name="adresse"
              value={form.adresse}
              onChange={handleChange}
              className={inputClass()}
            />
          </div>

          <div className="space-y-1 col-span-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Ville</label>
            <input
              type="text"
              name="ville"
              value={form.ville}
              onChange={handleChange}
              className={inputClass()}
            />
          </div>
        </div>
      </div>

      <div className="bg-[#0f121d]/80 backdrop-blur-md rounded-2xl p-3.5 border border-white/[0.06] space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex items-center gap-2">
            <Wallet size={15} className="text-primary" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              3. Données bancaires
            </h3>
          </div>
          <button
            type="button"
            onClick={generateAutoIds}
            className="text-[9px] font-black uppercase tracking-wider text-primary hover:underline"
          >
            Auto Générer
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1 col-span-2 sm:col-span-1">
            <div className="flex justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Identifiant *</label>
              {errors.identifiant && <span className="text-rose-400 text-[9px]">{errors.identifiant}</span>}
            </div>
            <input
              type="text"
              name="identifiant"
              value={form.identifiant}
              onChange={handleChange}
              className={inputClass(errors.identifiant)}
            />
          </div>

          <div className="space-y-1 col-span-2 sm:col-span-1">
            <div className="flex justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">IBAN *</label>
              {errors.iban && <span className="text-rose-400 text-[9px]">{errors.iban}</span>}
            </div>
            <input
              type="text"
              name="iban"
              value={form.iban}
              onChange={handleChange}
              className={inputClass(errors.iban)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Solde Initial (€)</label>
            <input
              type="text"
              name="soldeInitial"
              value={form.soldeInitial}
              onChange={handleChange}
              className={inputClass()}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Salaire (€)</label>
            <input
              type="text"
              name="salaireNet"
              value={form.salaireNet}
              onChange={handleChange}
              className={inputClass()}
            />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#080b14]/95 backdrop-blur-2xl border-t border-white/10 px-4 py-2.5 pb-[max(0.6rem,env(safe-area-inset-bottom))]">
        <div className="max-w-md mx-auto flex items-center gap-2">
          <button
            type="button"
            onClick={handlePreview}
            disabled={isPreviewing}
            className="flex-1 h-11 rounded-xl bg-white/10 border border-white/15 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-white/15 disabled:opacity-50 transition-all"
          >
            {isPreviewing ? <RefreshCw size={14} className="animate-spin" /> : <Eye size={14} />}
            <span>Aperçu</span>
          </button>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="flex-[1.5] h-11 rounded-xl bg-primary text-slate-950 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-lg shadow-primary/25 hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
            <span>Générer PDF</span>
          </button>
        </div>
      </div>

      {previewUrl && (
        <DocumentPreviewViewer
          imageUrl={previewUrl}
          title={`Aperçu Relevé LBP - ${form.nom || "COMPTE"}`}
          onClose={() => {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
          }}
          onAction={handleGenerate}
          isActionLoading={loading}
          actionLabel="Télécharger le relevé"
        />
      )}
    </div>
  );
}
