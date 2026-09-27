"use client";

import React, { useState, useEffect, useCallback } from "react";
import { RefreshCw, Lock, Eye, Download, Sparkles, ArrowLeft, Building2, MapPin, User, FileText, Briefcase, Hash, CheckCircle2 } from "lucide-react";
import { BANKS } from "@/data/rib-banks";
import { RibMode, NormalField } from "./types";
import { useFormSchema } from "@/components/_shared/formSchemaCache";
import { usePreviewCooldown } from "@/components/_shared/usePreviewCooldown";
import { useToast } from "@/components/NotificationToast";
import CustomDatePicker from "@/components/_shared/CustomDatePicker";
import CustomTimePicker from "@/components/_shared/CustomTimePicker";
import DocumentPreviewViewer from "@/components/_shared/DocumentPreviewViewer";

/* ===================================================================== */

interface RibWorkspaceProps {
  slug: string;
  onBack: () => void;
}

export default function RibWorkspace({ slug, onBack }: RibWorkspaceProps) {
  const { schema, isLoading, error } = useFormSchema("rib", slug);
  const toast = useToast();
  const bank = BANKS.find((b) => b.slug === slug);
  const { cooldown, isBlocked, assertReady, startCooldown, formatTimer } = usePreviewCooldown("rib");

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<RibMode>("normal");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionField, setActiveSuggestionField] = useState<string | null>(null);

  useEffect(() => {
    if (schema?.defaults && Object.keys(formData).length === 0) {
      setFormData(schema.defaults);
    }
  }, [schema]);

  const handleChange = (key: string, value: any, sanitizeType?: string) => {
    let sanitizedValue = value;
    if (typeof value === "string" && sanitizeType) {
      switch (sanitizeType) {
        case "digits":
          sanitizedValue = value.replace(/\D/g, "");
          break;
        case "upper":
        case "uppercase":
          sanitizedValue = value.toUpperCase();
          break;
        case "cp":
          sanitizedValue = value.replace(/\D/g, "").slice(0, 5);
          break;
        case "alnum":
          sanitizedValue = value.replace(/[^a-zA-Z0-9]/g, "");
          break;
      }
    }
    setFormData((prev) => ({ ...prev, [key]: sanitizedValue }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }

    if ((sanitizeType === "address" || key.includes("adresse")) && value.length > 3) {
      fetchAddressSuggestions(value, key);
    } else if ((sanitizeType === "ville" || key.includes("ville")) && value.length > 2) {
      fetchCitySuggestions(value, key);
    } else {
      setShowSuggestions(false);
    }
  };

  const fetchAddressSuggestions = async (query: string, fieldKey: string) => {
    try {
      const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`);
      const data = await res.json();
      setSuggestions(data.features || []);
      setActiveSuggestionField(fieldKey);
      setShowSuggestions(true);
    } catch {
      setShowSuggestions(false);
    }
  };

  const fetchCitySuggestions = async (query: string, fieldKey: string) => {
    try {
      const res = await fetch(`https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(query)}&fields=nom,codesPostaux&format=json&geometry=centre`);
      const data = await res.json();
      setSuggestions(data.slice(0, 5));
      setActiveSuggestionField(fieldKey);
      setShowSuggestions(true);
    } catch {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion: any, type: string) => {
    if (type === "address" || activeSuggestionField?.includes("adresse")) {
      const { name, postcode, city } = suggestion.properties;
      setFormData((prev) => ({
        ...prev,
        [activeSuggestionField || "adresse"]: name,
        cp: postcode || prev.cp,
        ville: city || prev.ville,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [activeSuggestionField || "ville"]: suggestion.nom,
        cp: suggestion.codesPostaux?.[0] || prev.cp,
      }));
    }
    setShowSuggestions(false);
    setActiveSuggestionField(null);
  };

  const handleFillExample = () => {
    if (schema?.defaults) {
      setFormData(schema.defaults);
      toast.info("Exemple chargé");
    }
  };

  const handleReset = () => {
    const cleared: Record<string, any> = {};
    if (schema?.sections) {
      schema.sections.forEach((sec: any) => {
        sec.fields?.forEach((f: any) => {
          cleared[f.key] = "";
        });
      });
    }
    setFormData(cleared);
    toast.info("Champs réinitialisés");
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (schema?.sections) {
      schema.sections.forEach((sec: any) => {
        sec.fields.forEach((field: any) => {
          const isReq = field.rules?.required || field.required;
          if (isReq && !formData[field.key]) {
            newErrors[field.key] = "Requis";
          }
        });
      });
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePreview = async () => {
    if (!assertReady()) {
      toast.error(`Attendez ${formatTimer(cooldown)} avant l'aperçu`);
      return;
    }
    if (!validate()) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }
    setIsPreviewing(true);
    try {
      startCooldown();
      const res = await fetch(`/api/proxy/generate-docs/rib/${slug}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, mode }),
      });
      if (!res.ok) throw new Error("Erreur de prévisualisation");
      const blob = await res.blob();
      setPreviewUrl(URL.createObjectURL(blob));
      toast.success("Aperçu généré !");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'aperçu");
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleGenerate = async () => {
    if (!validate()) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/proxy/generate-docs/rib/${slug}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, mode }),
      });
      if (!res.ok) throw new Error("Erreur de génération");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `RIB_${slug.toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("RIB généré et téléchargé !");
    } catch (err: any) {
      toast.error(err.message || "Erreur de génération du PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 fade-in">
        <RefreshCw className="w-7 h-7 text-primary animate-spin" />
        <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest">
          Chargement du RIB {bank?.name || slug}...
        </p>
      </div>
    );
  }

  if (error || !schema) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4 fade-in">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
          <Lock size={24} />
        </div>
        <div>
          <h3 className="text-base font-black text-white uppercase italic">RIB Indisponible</h3>
          <p className="text-xs text-white/50 mt-1">{error || "Schéma de formulaire introuvable"}</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-white/10 text-white font-bold text-xs uppercase tracking-wider hover:bg-white/15"
        >
          Retour aux banques
        </button>
      </div>
    );
  }

  const getSectionIcon = (iconName?: string) => {
    switch (iconName) {
      case "user": return <User size={15} className="text-primary" />;
      case "map-pin": return <MapPin size={15} className="text-primary" />;
      case "building": return <Building2 size={15} className="text-primary" />;
      case "briefcase": return <Briefcase size={15} className="text-primary" />;
      case "hash": return <Hash size={15} className="text-primary" />;
      default: return <FileText size={15} className="text-primary" />;
    }
  };

  const renderField = (field: any) => {
    const value = formData[field.key] ?? "";
    const isErr = !!errors[field.key];
    const kind = field.kind || field.type || "text";
    const isReq = field.rules?.required || field.required;
    const max = field.rules?.max || field.maxLength;
    const transform = field.rules?.transform || field.sanitize;

    const spanClass = field.span === 2 || kind === "address" || kind === "textarea" ? "col-span-2" : "col-span-1";

    const baseInputClass = `w-full h-10 bg-white/[0.04] border ${
      isErr ? "border-rose-500/80" : "border-white/10"
    } focus:border-primary/80 rounded-xl px-3 text-xs text-white transition-colors outline-none placeholder:text-white/20`;

    return (
      <div key={field.key} className={`flex flex-col space-y-1 relative ${spanClass}`}>
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">
            {field.label} {isReq && <span className="text-primary">*</span>}
          </label>
          {isErr && <span className="text-rose-400 text-[9px] font-medium">{errors[field.key]}</span>}
        </div>

        {kind === "select" ? (
          <select
            value={value}
            onChange={(e) => handleChange(field.key, e.target.value)}
            className={`${baseInputClass} appearance-none cursor-pointer`}
          >
            <option value="" className="bg-[#0e111a]">Sélectionner...</option>
            {field.options?.map((o: any) => (
              <option key={o.value} value={o.value} className="bg-[#0e111a]">
                {o.label}
              </option>
            ))}
          </select>
        ) : kind === "date" ? (
          <CustomDatePicker
            value={value}
            onChange={(v) => handleChange(field.key, v)}
            placeholder={field.placeholder || "JJ/MM/AAAA"}
          />
        ) : kind === "time" ? (
          <CustomTimePicker
            value={value}
            onChange={(v) => handleChange(field.key, v)}
            placeholder={field.placeholder || "HH:MM"}
          />
        ) : kind === "textarea" ? (
          <textarea
            value={value}
            onChange={(e) => handleChange(field.key, e.target.value, transform)}
            placeholder={field.placeholder}
            rows={2}
            className={`w-full bg-white/[0.04] border ${
              isErr ? "border-rose-500/80" : "border-white/10"
            } focus:border-primary/80 rounded-xl p-2.5 text-xs text-white transition-colors outline-none resize-none`}
          />
        ) : (
          <div className="relative">
            <input
              type={kind === "number" ? "number" : "text"}
              value={value}
              onChange={(e) => handleChange(field.key, e.target.value, transform)}
              placeholder={field.placeholder}
              maxLength={max}
              className={baseInputClass}
            />

            {showSuggestions && activeSuggestionField === field.key && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#121625] border border-white/15 rounded-xl overflow-hidden z-50 shadow-2xl">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectSuggestion(s, kind)}
                    className="w-full text-left px-3 py-2 text-xs text-white/90 hover:bg-white/10 border-b border-white/5 last:border-0"
                  >
                    {s.properties ? s.properties.label : `${s.nom} (${s.codesPostaux?.[0] || ""})`}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-32 fade-in">
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} /> Retour banques
        </button>

        <div className="flex items-center gap-1 bg-white/[0.04] border border-white/10 p-0.5 rounded-xl">
          <button
            type="button"
            onClick={() => setMode("normal")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
              mode === "normal" ? "bg-primary text-slate-950 shadow-sm" : "text-white/50 hover:text-white"
            }`}
          >
            Normal
          </button>
          <button
            type="button"
            onClick={() => setMode("custom")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
              mode === "custom" ? "bg-primary text-slate-950 shadow-sm" : "text-white/50 hover:text-white"
            }`}
          >
            Avancé
          </button>
        </div>
      </div>

      <div className="bg-[#0f121d]/80 backdrop-blur-md rounded-2xl p-3.5 border border-white/[0.06] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {bank?.logo && (
            <div className={`w-12 h-10 rounded-xl border flex items-center justify-center p-1.5 shrink-0 ${bank.headerBg || "bg-white border-white/20"}`}>
              <img src={bank.logo} alt={bank.name} className={`max-h-full max-w-full object-contain ${bank.logoClass || ""}`} />
            </div>
          )}
          <div>
            <h2 className="text-sm font-black italic text-white uppercase tracking-tight">
              RIB {bank?.name}
            </h2>
            <p className="text-[10px] text-white/40 font-medium">Relevé d'identité bancaire officiel</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleFillExample}
            title="Remplir exemple"
            className="p-2 rounded-xl bg-white/[0.04] border border-white/10 text-white/70 hover:text-primary transition-colors"
          >
            <Sparkles size={13} className="text-amber-400" />
          </button>
          <button
            type="button"
            onClick={handleReset}
            title="Effacer les champs"
            className="p-2 rounded-xl bg-white/[0.04] border border-white/10 text-white/70 hover:text-white transition-colors"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {schema.sections?.map((section: any, sIdx: number) => (
          <div key={sIdx} className="bg-[#0f121d]/80 backdrop-blur-md rounded-2xl p-3.5 border border-white/[0.06] space-y-3">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              {getSectionIcon(section.icon)}
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                {section.title}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {section.fields?.map((f: any) => renderField(f))}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#080b14]/95 backdrop-blur-2xl border-t border-white/10 px-4 py-2.5 pb-[max(0.6rem,env(safe-area-inset-bottom))]">
        <div className="max-w-md mx-auto flex items-center gap-2">
          <button
            type="button"
            onClick={handlePreview}
            disabled={isPreviewing || isBlocked}
            className="flex-1 h-11 rounded-xl bg-white/10 border border-white/15 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-white/15 disabled:opacity-50 transition-all"
          >
            {isPreviewing ? <RefreshCw size={14} className="animate-spin" /> : <Eye size={14} />}
            <span>{cooldown > 0 ? `(${formatTimer(cooldown)})` : "Aperçu"}</span>
          </button>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex-[1.5] h-11 rounded-xl bg-primary text-slate-950 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-lg shadow-primary/25 hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {isGenerating ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
            <span>Générer PDF</span>
          </button>
        </div>
      </div>

      {previewUrl && (
        <DocumentPreviewViewer
          imageUrl={previewUrl}
          title={`Aperçu RIB - ${bank?.name || slug.toUpperCase()}`}
          onClose={() => {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
          }}
          onAction={handleGenerate}
          isActionLoading={isGenerating}
          actionLabel="Télécharger le PDF"
        />
      )}
    </div>
  );
}
