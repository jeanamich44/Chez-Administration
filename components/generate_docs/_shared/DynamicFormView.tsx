"use client";

import { useMemo, useState, useEffect } from "react";
import { ArrowLeft, Lock, RefreshCw } from "lucide-react";
import { useTelegram } from "@/components/TelegramContext";
import PdfIssuerClient from "./PdfIssuerClient";
import { useFormSchema } from "./formSchemaCache";
import { FACTURE_PRESETS, JUSTIFICATIF_PRESETS, ASSURANCE_PRESETS } from "./facturePresets";

/* ===================================================================== */

export interface DynamicFormViewProps {
  category: "facture" | "justificatif" | "assurance";
  slug: string;
  onBack?: () => void;
  applyDynamicDates?: (defaults: Record<string, any>) => Record<string, any>;
  onToggle?: (key: string, value: any, prev: Record<string, any>) => Record<string, any>;
}

/* ===================================================================== */

export default function DynamicFormView({
  category,
  slug,
  onBack,
  applyDynamicDates,
  onToggle
}: DynamicFormViewProps) {
  const { initData } = useTelegram();
  const [mounted, setMounted] = useState(false);
  const { schema, version, isLoading, error } = useFormSchema(category, slug, initData);

  useEffect(() => {
    setMounted(true);
  }, []);

  const effectiveApplyDynamicDates = useMemo(() => {
    if (applyDynamicDates) return applyDynamicDates;
    if (category === "facture" && FACTURE_PRESETS[slug]?.applyDynamicDates) {
      return FACTURE_PRESETS[slug].applyDynamicDates;
    }
    if (category === "justificatif" && JUSTIFICATIF_PRESETS[slug]?.applyDynamicDates) {
      return JUSTIFICATIF_PRESETS[slug].applyDynamicDates;
    }
    if (category === "assurance" && ASSURANCE_PRESETS[slug]?.applyDynamicDates) {
      return ASSURANCE_PRESETS[slug].applyDynamicDates;
    }
    return undefined;
  }, [applyDynamicDates, category, slug]);

  const effectiveOnToggle = useMemo(() => {
    if (onToggle) return onToggle;
    if (category === "facture" && FACTURE_PRESETS[slug]?.onToggle) {
      return FACTURE_PRESETS[slug].onToggle;
    }
    return undefined;
  }, [onToggle, category, slug]);

  const formData = useMemo(() => {
    if (!schema?.defaults) return {};
    return effectiveApplyDynamicDates ? effectiveApplyDynamicDates(schema.defaults) : schema.defaults;
  }, [schema, effectiveApplyDynamicDates]);

  const schemaHash = useMemo(() => {
    return JSON.stringify([
      schema?.version,
      schema?.defaults,
      schema?.sections?.map((s: any) => [s.title, s.fields?.map((f: any) => f.key)])
    ]);
  }, [schema]);

  if (error) {
    return (
      <div className="space-y-4 pb-20 fade-in">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-white/60 hover:text-white transition-colors bg-white/[0.04] border border-white/10 px-3 py-1.5 rounded-xl active:scale-95"
        >
          <ArrowLeft size={13} />
          <span>Retour</span>
        </button>

        <div className="p-8 rounded-2xl bg-[#0f121d]/85 border border-rose-500/20 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <Lock size={22} />
          </div>
          <h3 className="text-sm font-black italic text-white uppercase">Document indisponible</h3>
          <p className="text-xs text-white/50 max-w-xs">{error}</p>
        </div>
      </div>
    );
  }

  if (!mounted || isLoading || !schema) {
    return (
      <div className="space-y-4 pb-20 fade-in">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-white/60 hover:text-white transition-colors bg-white/[0.04] border border-white/10 px-3 py-1.5 rounded-xl active:scale-95"
        >
          <ArrowLeft size={13} />
          <span>Retour</span>
        </button>
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <RefreshCw className="text-primary animate-spin w-6 h-6" />
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Chargement du formulaire...</p>
        </div>
      </div>
    );
  }

  const meta = schema.metadata || {};

  return (
    <PdfIssuerClient
      key={`${category}_${slug}_v${version}_${schemaHash}`}
      category={category}
      priceKey={meta.priceKey || slug}
      apiBase={meta.apiBase || `/api/proxy/generate-docs/${category}/${slug}`}
      onBack={onBack}
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
      onToggle={effectiveOnToggle}
      customLayout={schema.customLayout}
    />
  );
}
