"use client";

import { useMemo, useState, useEffect } from "react";
import { ArrowLeft, Lock, RefreshCw } from "lucide-react";
import PdfIssuerClient from "@/components/generate_docs/_shared/PdfIssuerClient";
import { useFormSchema } from "@/components/generate_docs/_shared/formSchemaCache";

export interface DynamicFormViewProps {
  category: "facture" | "justificatif" | "assurance";
  slug: string;
  applyDynamicDates?: (defaults: Record<string, any>) => Record<string, any>;
  onToggle?: (key: string, value: any, prev: Record<string, any>) => Record<string, any>;
  onBack?: () => void;
  defaultBackLabel?: string;
}

export default function DynamicFormView({
  category,
  slug,
  applyDynamicDates,
  onToggle,
  onBack,
  defaultBackLabel
}: DynamicFormViewProps) {
  const [mounted, setMounted] = useState(false);
  const { schema, version, isLoading, error } = useFormSchema(category, slug);

  useEffect(() => {
    setMounted(true);
  }, []);

    const backLabel = defaultBackLabel || (category === "facture" ? "Retour aux factures" : category === "assurance" ? "Retour aux assurances" : "Retour aux justificatifs");

  const formData = useMemo(() => {
    if (!schema?.defaults) return {};
    return applyDynamicDates ? applyDynamicDates(schema.defaults) : schema.defaults;
  }, [schema, applyDynamicDates]);

  const schemaHash = useMemo(() => {
    return JSON.stringify([
      schema?.version,
      schema?.defaults,
      schema?.sections?.map((s: any) => [s.title, s.fields?.map((f: any) => f.key)])
    ]);
  }, [schema]);

  if (error) {
    return (
      <main className="min-h-screen pt-6 md:pt-36 pb-32 md:pb-20 px-4 md:px-6 max-w-5xl mx-auto select-none">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack} type="button"
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/40 hover:text-primary transition-colors"
          >
            <ArrowLeft size={14} /> {backLabel}
          </button>
        </div>
        <div className="glass p-4 md:p-8 rounded-3xl border border-rose-500/20 flex flex-col items-center justify-center text-center max-w-lg mx-auto my-12 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <Lock size={32} />
          </div>
          <h2 className="text-lg md:text-xl font-black text-white uppercase italic tracking-wider">
            Document indisponible
          </h2>
          <p className="text-sm text-white/60 leading-relaxed font-medium">
            {error}
          </p>
          <button
            onClick={onBack} type="button"
            className="mt-4 px-6 py-2.5 rounded-xl bg-primary text-black font-black text-xs uppercase tracking-widest hover:scale-105 transition-all"
          >
            Retour au catalogue
          </button>
        </div>
      </main>
    );
  }

  if (!mounted || isLoading || !schema) {
    return (
      <main className="min-h-screen pt-6 md:pt-36 pb-32 md:pb-20 px-4 md:px-6 max-w-5xl mx-auto select-none">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack} type="button"
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/40 hover:text-primary transition-colors"
          >
            <ArrowLeft size={14} /> {backLabel}
          </button>
        </div>
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <RefreshCw className="text-primary animate-spin w-8 h-8" />
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Chargement du formulaire...</p>
        </div>
      </main>
    );
  }

  const meta = schema.metadata || {};

  return (
    <PdfIssuerClient
      key={`${category}_${slug}_v${version}_${schemaHash}`}
      category={category}
      priceKey={meta.priceKey || slug}
      apiBase={meta.apiBase || `/api/generate-docs/${category}/${slug}`}
      onBack={onBack}
      backLabel={meta.backLabel || backLabel}
      title={meta.title || slug.toUpperCase()}
      subtitle={meta.subtitle}
      logo={meta.logo}
      logoClass={meta.logoClass}
      headerBg={meta.headerBg}
      defaults={formData}
      sections={schema.sections || []}
      itemKey={meta.itemKey}
      itemLabel={meta.itemLabel}
      maxItems={meta.maxItems}
      itemBlank={schema.itemBlank || meta.itemBlank || schema.metadata?.itemBlank || schema.itemsConfig?.blankItem}
      itemColumns={schema.itemColumns || schema.itemsConfig?.columns}
      filename={() => meta.filenameTemplate || `${slug}.pdf`}
      generateLabel={meta.generateLabel}
      onToggle={onToggle}
      customLayout={schema.customLayout}
    />
  );
}
