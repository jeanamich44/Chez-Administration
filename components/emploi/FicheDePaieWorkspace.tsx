"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Calendar, Building2, User, Wallet, Sparkles, RefreshCw, Eye, Download, MapPin } from "lucide-react";
import { useToast } from "@/components/NotificationToast";
import DocumentPreviewViewer from "@/components/_shared/DocumentPreviewViewer";

/* ===================================================================== */

interface FicheDePaieWorkspaceProps {
  onBack: () => void;
}

export default function FicheDePaieWorkspace({ onBack }: FicheDePaieWorkspaceProps) {
  const toast = useToast();
  const [mode, setMode] = useState<"normal" | "custom">("normal");
  const [duree, setDuree] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [form, setForm] = useState({
    mois: new Date().getMonth() + 1,
    annee: new Date().getFullYear(),
    raisonSociale: "",
    siret: "",
    codeNaf: "6201Z",
    conventionCollective: "",
    entrepriseAdresse: "",
    entrepriseCp: "",
    entrepriseVille: "",
    civilite: "M",
    nom: "",
    prenom: "",
    emploi: "",
    nir: "",
    salarieAdresse: "",
    salarieCp: "",
    salarieVille: "",
    matricule: "001",
    qualification: "Employé",
    anciennete: "01/01/2020",
    netAPayer: "2000",
    heures: "151.67",
    tauxPas: "0",
    prime: "0",
    frais: "0",
    mutuelle: "50",
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
          setForm((prev) => ({ ...prev, salarieVille: data[0].nom }));
        }
      } catch {}
    }
  };

  const handleFillExample = () => {
    setForm({
      mois: new Date().getMonth() + 1,
      annee: new Date().getFullYear(),
      raisonSociale: "TECH SERVICES SAS",
      siret: "80012345600021",
      codeNaf: "6201Z",
      conventionCollective: "Syntec",
      entrepriseAdresse: "14 Rue de la Paix",
      entrepriseCp: "75002",
      entrepriseVille: "Paris",
      civilite: "M",
      nom: "DUPONT",
      prenom: "Alexandre",
      emploi: "Développeur Full Stack",
      nir: "189047512345678",
      salarieAdresse: "25 Avenue des Champs",
      salarieCp: "75008",
      salarieVille: "Paris",
      matricule: "042",
      qualification: "Cadre",
      anciennete: "15/03/2021",
      netAPayer: "2850",
      heures: "151.67",
      tauxPas: "4.5",
      prime: "200",
      frais: "50",
      mutuelle: "45",
    });
    toast.info("Exemple de fiche de paie chargé");
  };

  const validateAll = () => {
    const newErrors: Record<string, string> = {};
    if (!form.raisonSociale) newErrors.raisonSociale = "Requis";
    if (form.siret.length !== 14) newErrors.siret = "14 chiffres requis";
    if (!form.nom) newErrors.nom = "Requis";
    if (!form.prenom) newErrors.prenom = "Requis";
    if (!form.emploi) newErrors.emploi = "Requis";
    if (!form.nir) newErrors.nir = "15 chiffres requis";
    if (!form.netAPayer) newErrors.netAPayer = "Requis";
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
      const res = await fetch("/api/proxy/generate-docs/emploi/fiche_de_paie/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, duree, mode }),
      });
      if (!res.ok) throw new Error("Erreur lors de la prévisualisation");
      const blob = await res.blob();
      setPreviewUrl(URL.createObjectURL(blob));
      toast.success("Aperçu généré !");
    } catch (err: any) {
      toast.error(err.message || "Erreur d'aperçu");
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
      const res = await fetch("/api/proxy/generate-docs/emploi/fiche_de_paie/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, duree, mode }),
      });
      if (!res.ok) throw new Error("Erreur de génération");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Fiche_de_paie_${form.nom}_${duree}mois.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Bulletin de salaire généré avec succès !");
    } catch (err: any) {
      toast.error(err.message || "Erreur de génération du bulletin");
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
          <ArrowLeft size={14} /> Retour emploi
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
              onClick={() => setMode("normal")}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                mode === "normal" ? "bg-primary text-slate-950" : "text-white/50"
              }`}
            >
              Normal
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
            1. Période & Durée
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
            <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Mois</label>
            <input
              type="number"
              name="mois"
              value={form.mois}
              onChange={handleChange}
              min={1}
              max={12}
              className={inputClass()}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Année</label>
            <input
              type="number"
              name="annee"
              value={form.annee}
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
          <Building2 size={15} className="text-primary" />
          <h3 className="text-xs font-black uppercase tracking-wider text-white">
            2. Entreprise
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1 col-span-2 sm:col-span-1">
            <div className="flex justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Raison Sociale *</label>
              {errors.raisonSociale && <span className="text-rose-400 text-[9px]">{errors.raisonSociale}</span>}
            </div>
            <input
              type="text"
              name="raisonSociale"
              value={form.raisonSociale}
              onChange={handleChange}
              placeholder="ex: SAS EXEMPLO"
              className={inputClass(errors.raisonSociale)}
            />
          </div>

          <div className="space-y-1 col-span-2 sm:col-span-1">
            <div className="flex justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">SIRET (14 chiffres) *</label>
              {errors.siret && <span className="text-rose-400 text-[9px]">{errors.siret}</span>}
            </div>
            <input
              type="text"
              name="siret"
              maxLength={14}
              value={form.siret}
              onChange={handleChange}
              placeholder="14 chiffres"
              className={inputClass(errors.siret)}
            />
          </div>

          {mode === "custom" && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Code NAF</label>
                <input
                  type="text"
                  name="codeNaf"
                  value={form.codeNaf}
                  onChange={handleChange}
                  className={inputClass()}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Convention</label>
                <input
                  type="text"
                  name="conventionCollective"
                  value={form.conventionCollective}
                  onChange={handleChange}
                  placeholder="ex: Syntec"
                  className={inputClass()}
                />
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Adresse Entreprise</label>
                <input
                  type="text"
                  name="entrepriseAdresse"
                  value={form.entrepriseAdresse}
                  onChange={handleChange}
                  className={inputClass()}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-[#0f121d]/80 backdrop-blur-md rounded-2xl p-3.5 border border-white/[0.06] space-y-3">
        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
          <User size={15} className="text-primary" />
          <h3 className="text-xs font-black uppercase tracking-wider text-white">
            3. Salarié
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
            <div className="flex justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Poste / Emploi *</label>
              {errors.emploi && <span className="text-rose-400 text-[9px]">{errors.emploi}</span>}
            </div>
            <input
              type="text"
              name="emploi"
              value={form.emploi}
              onChange={handleChange}
              className={inputClass(errors.emploi)}
            />
          </div>

          <div className="space-y-1 col-span-2">
            <div className="flex justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">NIR (N° Sécurité Sociale) *</label>
              {errors.nir && <span className="text-rose-400 text-[9px]">{errors.nir}</span>}
            </div>
            <input
              type="text"
              name="nir"
              maxLength={15}
              value={form.nir}
              onChange={handleChange}
              placeholder="15 chiffres"
              className={inputClass(errors.nir)}
            />
          </div>

          <div className="space-y-1 col-span-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Adresse Salarié</label>
            <input
              type="text"
              name="salarieAdresse"
              value={form.salarieAdresse}
              onChange={handleChange}
              className={inputClass()}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Code Postal</label>
            <input
              type="text"
              name="salarieCp"
              maxLength={5}
              value={form.salarieCp}
              onChange={handleCpChange}
              className={inputClass()}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Ville</label>
            <input
              type="text"
              name="salarieVille"
              value={form.salarieVille}
              onChange={handleChange}
              className={inputClass()}
            />
          </div>
        </div>
      </div>

      <div className="bg-[#0f121d]/80 backdrop-blur-md rounded-2xl p-3.5 border border-white/[0.06] space-y-3">
        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
          <Wallet size={15} className="text-primary" />
          <h3 className="text-xs font-black uppercase tracking-wider text-white">
            4. Salaire & Rémunération
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Net à Payer (€) *</label>
              {errors.netAPayer && <span className="text-rose-400 text-[9px]">{errors.netAPayer}</span>}
            </div>
            <input
              type="number"
              name="netAPayer"
              value={form.netAPayer}
              onChange={handleChange}
              className={inputClass(errors.netAPayer)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Heures</label>
            <input
              type="text"
              name="heures"
              value={form.heures}
              onChange={handleChange}
              className={inputClass()}
            />
          </div>

          {mode === "custom" && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Taux PAS (%)</label>
                <input
                  type="text"
                  name="tauxPas"
                  value={form.tauxPas}
                  onChange={handleChange}
                  className={inputClass()}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">Prime (€)</label>
                <input
                  type="text"
                  name="prime"
                  value={form.prime}
                  onChange={handleChange}
                  className={inputClass()}
                />
              </div>
            </>
          )}
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
          title={`Aperçu Fiche de Paie - ${form.nom || "BULLETIN"}`}
          onClose={() => {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
          }}
          onAction={handleGenerate}
          isActionLoading={loading}
          actionLabel="Télécharger le bulletin"
        />
      )}
    </div>
  );
}
