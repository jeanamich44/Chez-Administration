"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Lock, FileText, Eye, Download, Sparkles, RefreshCw, CheckCircle2 } from "lucide-react";
import { useFormSchema } from "@/components/_shared/formSchemaCache";
import { usePreviewCooldown } from "@/components/_shared/usePreviewCooldown";
import CustomDatePicker from "@/components/_shared/CustomDatePicker";
import CustomTimePicker from "@/components/_shared/CustomTimePicker";
import DocumentPreviewViewer from "@/components/_shared/DocumentPreviewViewer";
import { useToast } from "@/components/NotificationToast";
import { BRAND_CATALOG } from "@/data/brands";

/* ===================================================================== */

interface DynamicFormViewProps {
  category: "facture" | "justificatif" | "assurance";
  slug: string;
  onBack: () => void;
}

export default function DynamicFormView({ category, slug, onBack }: DynamicFormViewProps) {
  const { schema, isLoading, error } = useFormSchema(category, slug);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionField, setActiveSuggestionField] = useState<string | null>(null);

  const { cooldown, isBlocked, assertReady, startCooldown, formatTimer } = usePreviewCooldown(category);
  const toast = useToast();

  useEffect(() => {
    if (schema?.defaults && Object.keys(formData).length === 0) {
      setFormData(schema.defaults);
    }
  }, [schema]);

  const handleInputChange = (key: string, value: any, sanitizeType?: string) => {
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
      toast.info("Données d'exemple chargées");
    }
  };

  const handleClear = () => {
    const cleared: Record<string, any> = {};
    if (schema?.sections) {
      schema.sections.forEach((section: any) => {
        section.fields?.forEach((field: any) => {
          cleared[field.key] = "";
        });
      });
    }
    setFormData(cleared);
    toast.info("Champs réinitialisés");
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (schema?.sections) {
      schema.sections.forEach((section: any) => {
        section.fields?.forEach((field: any) => {
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
      toast.error("Veuillez renseigner les champs obligatoires");
      return;
    }
    setIsPreviewing(true);
    try {
      const res = await fetch(`/api/proxy/generate-docs/${category}/${slug}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Erreur de prévisualisation");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      startCooldown();
      toast.success("Aperçu généré avec succès");
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la génération de l'aperçu");
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleGenerate = async () => {
    if (!validate()) {
      toast.error("Veuillez renseigner les champs obligatoires");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/proxy/generate-docs/${category}/${slug}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Erreur de génération");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = meta.filenameTemplate || `${slug.toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Document PDF généré !");
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la génération");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 fade-in">
        <RefreshCw className="w-7 h-7 text-primary animate-spin" />
        <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest">
          Chargement du formulaire...
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
          <h3 className="text-base font-black text-white uppercase italic">Document indisponible</h3>
          <p className="text-xs text-white/50 mt-1">{error || "Ce document n'est pas disponible actuellement."}</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-white/10 text-white font-bold text-xs uppercase tracking-wider hover:bg-white/15"
        >
          Retour
        </button>
      </div>
    );
  }

  const meta = schema.metadata || {};
  const brand = BRAND_CATALOG[slug] || {};
  const logo = meta.logo || brand.logo;
  const headerBg = meta.headerBg || brand.headerBg || "bg-white border-white/20";
  const logoClass = meta.logoClass || brand.logoClass || "";
  const title = meta.title || brand.name || slug.toUpperCase();

  const renderField = (field: any) => {
    const value = formData[field.key] ?? "";
    const isErr = !!errors[field.key];
    const kind = field.kind || field.type || "text";
    const isReq = field.rules?.required || field.required;
    const max = field.rules?.max || field.maxLength;
    const transform = field.rules?.transform || field.sanitize;

    const spanClass = field.span === 2 || field.grid === "full" || kind === "address" || kind === "textarea"
      ? "col-span-2"
      : "col-span-1";

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
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            className={`${baseInputClass} appearance-none cursor-pointer`}
          >
            <option value="" className="bg-[#0e111a]">Sélectionner...</option>
            {field.options?.map((opt: any) => (
              <option key={opt.value} value={opt.value} className="bg-[#0e111a]">
                {opt.label}
              </option>
            ))}
          </select>
        ) : kind === "date" ? (
          <CustomDatePicker
            value={value}
            onChange={(val) => handleInputChange(field.key, val)}
            placeholder={field.placeholder || "JJ/MM/AAAA"}
          />
        ) : kind === "time" ? (
          <CustomTimePicker
            value={value}
            onChange={(val) => handleInputChange(field.key, val)}
            placeholder={field.placeholder || "HH:MM"}
          />
        ) : kind === "textarea" ? (
          <textarea
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value, transform)}
            placeholder={field.placeholder}
            rows={2}
            className={`w-full bg-white/[0.04] border ${
              isErr ? "border-rose-500/80" : "border-white/10"
            } focus:border-primary/80 rounded-xl p-2.5 text-xs text-white transition-colors outline-none resize-none`}
          />
        ) : kind === "toggle" || kind === "checkbox" ? (
          <button
            type="button"
            onClick={() => handleInputChange(field.key, !formData[field.key])}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              formData[field.key] ? "bg-primary" : "bg-white/15"
            }`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                formData[field.key] ? "translate-x-5" : ""
              }`}
            />
          </button>
        ) : (
          <div className="relative">
            <input
              type={kind === "number" ? "number" : "text"}
              value={value}
              onChange={(e) => handleInputChange(field.key, e.target.value, transform)}
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
          <ArrowLeft size={14} /> Retour
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
          <button
            type="button"
            onClick={handleClear}
            title="Effacer champs"
            className="p-2 rounded-xl bg-white/[0.04] border border-white/10 text-white/70 hover:text-white transition-colors"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      <div className="bg-[#0f121d]/80 backdrop-blur-md rounded-2xl p-3.5 border border-white/[0.06] flex items-center gap-3">
        {logo && (
          <div className={`w-12 h-10 rounded-xl border flex items-center justify-center p-1.5 shrink-0 ${headerBg}`}>
            <img src={logo} alt="" className={`max-h-full max-w-full object-contain ${logoClass}`} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-black italic text-white uppercase tracking-tight truncate">
            {title}
          </h2>
          {meta.subtitle && (
            <p className="text-[10px] text-white/40 font-medium truncate">{meta.subtitle}</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {schema.sections?.map((section: any, sIdx: number) => (
          <div key={sIdx} className="bg-[#0f121d]/80 backdrop-blur-md rounded-2xl p-3.5 border border-white/[0.06] space-y-3">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <FileText size={15} className="text-primary" />
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                {section.title}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {section.fields?.map((field: any) => renderField(field))}
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
          title={`Aperçu - ${title}`}
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
