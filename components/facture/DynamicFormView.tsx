"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Lock, FileText, Eye, Download, Sparkles, RefreshCw } from "lucide-react";
import { useFormSchema } from "@/components/_shared/formSchemaCache";
import { usePreviewCooldown } from "@/components/_shared/usePreviewCooldown";
import CustomDatePicker from "@/components/_shared/CustomDatePicker";
import CustomTimePicker from "@/components/_shared/CustomTimePicker";
import DocumentPreviewViewer from "@/components/_shared/DocumentPreviewViewer";
import { useToast } from "@/components/NotificationToast";
import { BRAND_CATALOG } from "@/data/brands";

interface DynamicFormViewProps {
  category: "facture" | "justificatif" | "assurance";
  slug: string;
  onBack: () => void;
}

/* ===================================================================== */

export default function DynamicFormView({ category, slug, onBack }: DynamicFormViewProps) {
  const { schema, isLoading, error } = useFormSchema(category, slug);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const { cooldown, isBlocked, assertReady, startCooldown, formatTimer } = usePreviewCooldown(category);
  const toast = useToast();

  useEffect(() => {
    if (schema?.defaults) {
      setFormData(schema.defaults);
    }
  }, [schema]);

  /* ===================================================================== */

  if (isLoading) {
    return (
      <main className="min-h-screen pt-6 pb-12 px-4 max-w-5xl mx-auto">
        <button type="button" onClick={onBack} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/40 hover:text-primary transition-colors mb-6">
          <ArrowLeft size={14} /> Retour
        </button>
        <div className="flex flex-col items-center justify-center py-32 gap-4 fade-in">
          <RefreshCw className="text-primary animate-spin w-8 h-8" />
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Chargement du formulaire...</p>
        </div>
      </main>
    );
  }

  if (error || !schema) {
    return (
      <main className="min-h-screen pt-6 pb-12 px-4 max-w-5xl mx-auto fade-in">
        <button type="button" onClick={onBack} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/40 hover:text-primary transition-colors mb-6">
          <ArrowLeft size={14} /> Retour
        </button>
        <div className="glass p-8 rounded-3xl border border-rose-500/20 flex flex-col items-center justify-center text-center max-w-lg mx-auto my-12 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <Lock size={32} />
          </div>
          <h2 className="text-xl font-black text-white uppercase italic tracking-wider">Document indisponible</h2>
          <p className="text-sm text-white/60 leading-relaxed font-medium">{error || "Ce document n'est pas disponible."}</p>
          <button type="button" onClick={onBack} className="mt-4 px-6 py-2.5 rounded-xl bg-primary text-black font-black text-xs uppercase tracking-widest transition-all">
            Retour au catalogue
          </button>
        </div>
      </main>
    );
  }

  /* ===================================================================== */

  const meta = schema.metadata || {};

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleFillExample = () => {
    if (schema.defaults) {
      setFormData(schema.defaults);
      toast.info("Formulaire rempli avec les données d'exemple");
    }
  };

  const handleClear = () => {
    const cleared: Record<string, any> = {};
    if (schema.sections) {
      schema.sections.forEach((section: any) => {
        section.fields?.forEach((field: any) => {
          cleared[field.key] = "";
        });
      });
    }
    setFormData(cleared);
    toast.info("Champs effacés");
  };

  const handlePreview = async () => {
    if (!assertReady()) {
      toast.error(`Attendez ${formatTimer(cooldown)} avant le prochain aperçu`);
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
      toast.success("Aperçu généré !");
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la génération de l'aperçu");
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleGenerate = async () => {
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
      a.download = meta.filenameTemplate || `${slug}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Document généré avec succès");
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la génération");
    } finally {
      setIsGenerating(false);
    }
  };

  /* ===================================================================== */

  const backLabel = category === "facture" ? "Retour aux factures" : category === "assurance" ? "Retour aux assurances" : "Retour aux justificatifs";
  const brand = BRAND_CATALOG[slug] || {};
  const logo = meta.logo || brand.logo;
  const headerBg = meta.headerBg || brand.headerBg || "bg-white border-white/20";
  const logoClass = meta.logoClass || brand.logoClass || "";
  const title = meta.title || brand.name || slug.toUpperCase();

  return (
    <main className="min-h-screen pt-6 pb-12 px-4 max-w-5xl mx-auto fade-in">
      <button type="button" onClick={onBack} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/40 hover:text-primary transition-colors mb-6">
        <ArrowLeft size={14} /> {backLabel}
      </button>

      <div className="flex items-center gap-4 mb-8">
        {logo && (
          <div className={`px-5 py-3.5 border rounded-2xl backdrop-blur-md flex items-center justify-center overflow-hidden shrink-0 shadow-lg ${headerBg}`}>
            <img src={logo} alt="" className={`h-8 sm:h-10 w-auto max-w-[140px] object-contain ${logoClass}`} />
          </div>
        )}
        <div>
          <h1 className="text-2xl sm:text-4xl font-black italic text-white tracking-tight">
            {title}
          </h1>
          {meta.subtitle && <p className="text-white/50 text-xs font-medium uppercase tracking-wider mt-0.5">{meta.subtitle}</p>}
        </div>
      </div>

      <div className="space-y-6">
        {schema.sections?.map((section: any, sIdx: number) => (
          <section key={sIdx} className="glass p-5 md:p-8 space-y-5">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="text-base font-black uppercase tracking-wider text-white">{section.title}</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {section.fields?.map((field: any) => (
                <div key={field.key} className={field.grid === "full" ? "sm:col-span-2" : ""}>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                    {field.label} {field.required && <span className="text-rose-400">*</span>}
                  </label>

                  {(field.type === "text" || field.type === "number" || field.type === "email" || !field.type) && (
                    <input
                      type={field.type || "text"}
                      value={formData[field.key] || ""}
                      onChange={e => handleInputChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      maxLength={field.maxLength}
                      className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors"
                    />
                  )}

                  {field.type === "textarea" && (
                    <textarea
                      value={formData[field.key] || ""}
                      onChange={e => handleInputChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors resize-none"
                    />
                  )}

                  {field.type === "select" && (
                    <select
                      value={formData[field.key] || ""}
                      onChange={e => handleInputChange(field.key, e.target.value)}
                      className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors appearance-none"
                    >
                      <option value="" disabled className="bg-slate-900">Sélectionner...</option>
                      {field.options?.map((opt: any) => (
                        <option key={opt.value} value={opt.value} className="bg-slate-900">{opt.label}</option>
                      ))}
                    </select>
                  )}

                  {field.type === "date" && (
                    <CustomDatePicker
                      value={formData[field.key] || ""}
                      onChange={val => handleInputChange(field.key, val)}
                      placeholder={field.placeholder}
                    />
                  )}

                  {field.type === "time" && (
                    <CustomTimePicker
                      value={formData[field.key] || ""}
                      onChange={val => handleInputChange(field.key, val)}
                      placeholder={field.placeholder}
                    />
                  )}

                  {field.type === "toggle" && (
                    <button
                      type="button"
                      onClick={() => handleInputChange(field.key, !formData[field.key])}
                      className={`relative w-11 h-6 rounded-full transition-colors ${formData[field.key] ? "bg-primary" : "bg-white/15"}`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${formData[field.key] ? "translate-x-5" : ""}`} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* ===================================================================== */}

      <div className="flex flex-wrap items-center justify-between gap-4 pt-6">
        <div className="flex gap-3">
          <button type="button" onClick={handleFillExample} className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider text-white/80 hover:bg-white/10 transition-colors flex items-center gap-2">
            <Sparkles size={14} className="text-amber-400" /> Exemple
          </button>
          <button type="button" onClick={handleClear} className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider text-white/80 hover:bg-white/10 transition-colors flex items-center gap-2">
            <RefreshCw size={14} /> Effacer
          </button>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={handlePreview} disabled={isPreviewing || isBlocked} className="px-5 py-3 rounded-xl bg-slate-800 border border-slate-700 text-xs font-black uppercase tracking-wider text-white hover:bg-slate-700 disabled:opacity-50 transition-all flex items-center gap-2">
            {isPreviewing ? <RefreshCw className="animate-spin" size={16} /> : <Eye size={16} />}
            {cooldown > 0 ? `Aperçu (${formatTimer(cooldown)})` : "Aperçu gratuit"}
          </button>
          <button type="button" onClick={handleGenerate} disabled={isGenerating} className="px-6 py-3 rounded-xl bg-primary text-slate-950 font-black text-xs uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
            {isGenerating ? <RefreshCw className="animate-spin" size={16} /> : <Download size={16} />}
            Générer le PDF
          </button>
        </div>
      </div>

      {previewUrl && (
        <DocumentPreviewViewer
          imageUrl={previewUrl}
          title={`Aperçu - ${(meta.title || slug).toUpperCase()}`}
          onClose={() => { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }}
          onAction={handleGenerate}
          isActionLoading={isGenerating}
          actionLabel="Générer le PDF"
        />
      )}
    </main>
  );
}
