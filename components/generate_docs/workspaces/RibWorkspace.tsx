"use client";

import { useState, useEffect, useRef, useMemo, FormEvent } from "react";
import {
  ArrowLeft,
  Building2,
  Download,
  Eye,
  FileText,
  RefreshCw,
  Sparkles,
  User
} from "lucide-react";
import { useTelegram } from "@/components/TelegramContext";
import { useToast } from "@/components/NotificationToast";
import CustomDatePicker, { isValidCalendarDate } from "../_shared/CustomDatePicker";
import CustomTimePicker from "../_shared/CustomTimePicker";
import {
  caEdition,
  myposEdition,
  slashDate,
  sumupDocument,
  sumupDocumentDate,
  sumupDocumentTime,
  sumupOpening
} from "../_shared/exampleDates";
import { getCachedFormSchema, setCachedFormSchema } from "../_shared/formSchemaCache";
import { usePreviewCooldown } from "../_shared/usePreviewCooldown";
import DocumentPreviewViewer from "../_shared/DocumentPreviewViewer";
import { BANK_CONFIGS } from "../_shared/bankConfigs";
import type { AutoIbanPart, FieldKind, NormalField, RibBankConfig } from "../_shared/types";

/* ===================================================================== */

type AddressSuggestion = { label: string; name: string; postcode: string; city: string; region?: string };
type CitySuggestion = { nom: string; codePostal: string; region?: string };

type DynamicFormField = Omit<NormalField, "span"> & {
  span?: number;
  options?: (string | { label: string; value: string })[];
  rules?: {
    required?: boolean;
    min?: number;
    max?: number;
    regex?: string;
    transform?: string;
  };
};

type DynamicFormSection = {
  id: string;
  title: string;
  order: number;
  hasAdvancedMode?: boolean;
  fields: DynamicFormField[];
};

const CIVILITES = ["M.", "MME", "MLLE"];

/* ===================================================================== */

function formatIban(value: string): string {
  const clean = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  const chunks = clean.match(/.{1,4}/g);
  return chunks ? chunks.join(" ") : clean;
}

function formatBic(value: string): string {
  const clean = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 11);
  if (clean.length <= 4) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 4)} ${clean.slice(4)}`;
  if (clean.length <= 8) return `${clean.slice(0, 4)} ${clean.slice(4, 6)} ${clean.slice(6)}`;
  return `${clean.slice(0, 4)} ${clean.slice(4, 6)} ${clean.slice(6, 8)} ${clean.slice(8)}`;
}

function sanitize(kind: FieldKind, value: string, max?: number) {
  let next = value;
  if (kind === "time") return next;
  if (kind === "digits" || kind === "cp") next = next.replace(/[^0-9]/g, "");
  else if (kind === "iban") {
    next = formatIban(next);
  } else if (kind === "bic") {
    next = formatBic(next);
  } else if (kind === "alnum") {
    next = next.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  } else if (kind === "upper" || kind === "cp_ville" || kind === "ville") {
    next = next.replace(/[^A-Za-zÀ-ÿ0-9 '’./()-]/g, "").toUpperCase();
  } else if (kind === "address") {
    next = next.replace(/[^A-Za-zÀ-ÿ0-9 '’./()\-\n]/g, "").toUpperCase();
  } else if (kind === "textarea") {
    next = next.toUpperCase();
  }
  if (typeof max === "number" && kind !== "iban" && kind !== "bic") {
    next = next.slice(0, max);
  }
  return next;
}

function computeFrenchIban(b: string, g: string, c: string, k: string): string {
  if (b.length !== 5 || g.length !== 5 || c.length !== 11 || k.length !== 2) return "";
  const bban = `${b}${g}${c}${k}`.toUpperCase();
  let numStr = "";
  for (let i = 0; i < bban.length; i++) {
    const code = bban.charCodeAt(i);
    if (code >= 48 && code <= 57) {
      numStr += bban[i];
    } else if (code >= 65 && code <= 90) {
      numStr += (code - 55).toString();
    } else {
      return "";
    }
  }
  numStr += "152700";
  let rem = 0;
  for (let i = 0; i < numStr.length; i++) {
    rem = (rem * 10 + (numStr.charCodeAt(i) - 48)) % 97;
  }
  const check = (98 - rem).toString().padStart(2, "0");
  return formatIban(`FR${check}${bban}`);
}

function getAddressGroup(key: string) {
  if (key.startsWith("domiciliation_")) {
    return {
      address: "domiciliation_rue",
      cp: "domiciliation_cp",
      ville: "domiciliation_ville",
      combined: "domiciliation",
      isMultiLine: true
    };
  }
  if (key.startsWith("agence_")) {
    return {
      address: "agence_adresse",
      cp: "agence_cp",
      ville: "agence_ville",
      combined: "agence_cp_ville",
      isMultiLine: false
    };
  }
  return {
    address: "adresse",
    cp: "cp",
    ville: "ville",
    combined: "cp_ville",
    isMultiLine: false
  };
}

function parseRibDynamicSchema(slug: string, sch: any) {
  let parsed = sch;
  while (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      break;
    }
  }
  parsed = parsed && typeof parsed === "object" ? parsed : {};
  const defaults = parsed.defaults || {};
  const parsedSections: DynamicFormSection[] = (parsed.sections || []).map((sec: any) => ({
    id: sec.id,
    title: sec.title || sec.id,
    order: sec.order || 0,
    hasAdvancedMode: Boolean(sec.hasAdvancedMode),
    fields: (sec.fields || []).map((f: any) => {
      const rules = f.rules || {};
      let kind: FieldKind = "upper";
      if (f.kind === "select" || f.key === "civilite") kind = "civilite";
      else if (f.kind === "address" || f.key === "adresse") kind = "address";
      else if (f.kind === "cp" || f.key === "cp") kind = "cp";
      else if (f.kind === "ville" || f.key === "ville") kind = "ville";
      else if (f.kind === "time" || f.key === "heure_document" || f.key.includes("heure") || f.key.includes("time")) kind = "time";
      else if (f.kind === "date" || f.key.includes("date")) kind = "date";
      else if (f.kind === "textarea") kind = "textarea";
      else if (rules.transform === "digits_only" || f.key.includes("code_") || f.key.includes("cle")) kind = "digits";
      else if (f.key === "iban") kind = "iban";
      else if (f.key === "bic") kind = "bic";
      else if (f.kind === "alnum") kind = "alnum";

      let autoIban: AutoIbanPart | undefined = f.autoIban;
      if (!autoIban) {
        if (f.key === "code_banque" || f.key === "banque") autoIban = "banque";
        else if (f.key === "code_guichet" || f.key === "guichet") autoIban = "guichet";
        else if (f.key === "num_compte" || f.key === "compte") autoIban = "compte";
        else if (f.key === "cle_rib" || f.key === "cle") autoIban = "cle";
      }

      return {
        key: f.key,
        label: f.label || f.key,
        kind,
        section: sec.title || sec.id,
        span: f.span || 1,
        min: rules.min,
        max: rules.max,
        required: rules.required !== false,
        placeholder: f.placeholder,
        autoIban,
        options: f.options,
        rules
      };
    })
  }));

  return { defaults, sections: parsedSections };
}

/* ===================================================================== */

interface RibWorkspaceProps {
  config?: RibBankConfig;
  slug?: string;
  onBack?: () => void;
  useDynamicSchema?: boolean;
}

export default function RibWorkspace({
  config: providedConfig,
  slug,
  onBack,
  useDynamicSchema = true
}: RibWorkspaceProps) {
  const config = providedConfig || BANK_CONFIGS[slug || "lbp"] || BANK_CONFIGS.lbp;
  const { user, balance, refreshBalance, initData, haptic } = useTelegram();
  const toast = useToast();

  const [schemaData, setSchemaData] = useState<{
    defaults: Record<string, string>;
    sections: DynamicFormSection[];
  } | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [documentPrice, setDocumentPrice] = useState<number>(1.0);

  const previewUrlRef = useRef<string | null>(null);
  const { cooldown, isBlocked, assertReady, startCooldown, formatTimer } = usePreviewCooldown("rib", initData);

  useEffect(() => {
    async function loadConfig() {
      try {
        const headers: Record<string, string> = {};
        if (initData) headers["x-telegram-init-data"] = initData;
        const res = await fetch("/api/proxy/generate-docs/config", { headers });
        if (res.ok) {
          const cfg = await res.json();
          if (cfg.prices && cfg.prices[config.slug]) {
            setDocumentPrice(Number(cfg.prices[config.slug]));
          } else if (cfg.prices && cfg.prices.rib) {
            setDocumentPrice(Number(cfg.prices.rib));
          }
        }
      } catch {}
    }
    loadConfig();
  }, [config.slug, initData]);

  useEffect(() => {
    async function initSchema() {
      const cached = getCachedFormSchema("rib", config.slug);
      if (cached && cached.schema) {
        const parsed = parseRibDynamicSchema(config.slug, cached.schema);
        setSchemaData(parsed);
        setFormData(parsed.defaults);
        return;
      }

      try {
        const headers: Record<string, string> = {};
        if (initData) headers["x-telegram-init-data"] = initData;
        const res = await fetch(`/api/proxy/generate-docs/forms/rib/${config.slug}`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (data && data.schema) {
            setCachedFormSchema("rib", config.slug, {
              schema: data.schema,
              version: data.version || 1,
              title: data.title,
              id: data.id
            });
            const parsed = parseRibDynamicSchema(config.slug, data.schema);
            setSchemaData(parsed);
            setFormData(parsed.defaults);
            return;
          }
        }
      } catch {}

      if (config.defaults) {
        setFormData(config.defaults);
      }
    }
    initSchema();
  }, [config.slug, config.defaults, initData]);

  const activeFields: DynamicFormField[] = useMemo(() => {
    if (schemaData) {
      return schemaData.sections.flatMap(s => s.fields);
    }
    return (config.fields || []).map(f => ({
      ...f,
      rules: { required: f.required }
    }));
  }, [schemaData, config.fields]);

  const applyIban = (updated: Record<string, string>) => {
    if (config.composeIban === false) return updated;
    const banque = activeFields.find(item => item.autoIban === "banque");
    const guichet = activeFields.find(item => item.autoIban === "guichet");
    const compte = activeFields.find(item => item.autoIban === "compte");
    const cle = activeFields.find(item => item.autoIban === "cle");
    if (!banque || !guichet || !compte || !cle) return updated;
    const b = updated[banque.key] || "";
    const g = updated[guichet.key] || "";
    const c = updated[compte.key] || "";
    const k = updated[cle.key] || "";
    if (b.length === 5 && g.length === 5 && c.length === 11 && k.length === 2) {
      const computed = computeFrenchIban(b, g, c, k);
      if (computed) updated.iban = computed;
    }
    return updated;
  };

  const handleChange = (spec: DynamicFormField, value: string) => {
    let raw = value;
    if (spec.rules?.transform === "uppercase") raw = raw.toUpperCase();
    else if (spec.rules?.transform === "lowercase") raw = raw.toLowerCase();
    else if (spec.rules?.transform === "digits_only") raw = raw.replace(/\D/g, "");

    const val = sanitize(spec.kind, raw, spec.max);
    let nextData = { ...formData };
    if (spec.key === "iban") {
      nextData.iban = val;
    } else if (spec.autoIban) {
      nextData = applyIban({ ...nextData, [spec.key]: val });
    } else {
      nextData[spec.key] = val;
    }

    const group = getAddressGroup(spec.key);
    if (spec.key === group.cp || spec.key === group.ville || spec.key === group.address) {
      const currentAddr = spec.key === group.address ? val : nextData[group.address] || "";
      const currentCp = spec.key === group.cp ? val : nextData[group.cp] || "";
      const currentVille = spec.key === group.ville ? val : nextData[group.ville] || "";
      if (group.combined) {
        nextData[group.combined] = group.isMultiLine
          ? `${currentAddr}\n${currentCp} ${currentVille}`.trim()
          : `${currentCp} ${currentVille}`.trim();
      }
    }
    setFormData(nextData);

    if (errors[spec.key]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[spec.key];
        return next;
      });
    }
  };

  const validateAll = (): boolean => {
    const nextErrors: Record<string, string> = {};
    for (const spec of activeFields) {
      const val = (formData[spec.key] || "").trim();
      if (spec.required && !val) {
        nextErrors[spec.key] = "Ce champ est obligatoire.";
      }
      if (spec.kind === "iban" && val.replace(/\s/g, "").length < 15) {
        nextErrors[spec.key] = "IBAN incomplet (minimum 15 caractères).";
      }
      if (spec.kind === "bic" && val.replace(/\s/g, "").length < 8) {
        nextErrors[spec.key] = "BIC incomplet (minimum 8 caractères).";
      }
      if (spec.kind === "date" && val) {
        const check = isValidCalendarDate(val);
        if (!check.valid) {
          nextErrors[spec.key] = check.message || "Date invalide.";
        }
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
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

      const res = await fetch(`/api/proxy/generate-docs/rib/${config.slug}/preview`, {
        method: "POST",
        headers,
        body: JSON.stringify(formData)
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

      const res = await fetch(`/api/proxy/generate-docs/rib/${config.slug}/generate`, {
        method: "POST",
        headers,
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || "Erreur lors de la génération du RIB");
      }
      const blob = await res.blob();
      const stem = (formData.titulaire || formData.nom_prenom || "document").replace(/[^A-Za-z0-9]/g, "_");
      downloadBlob(blob, `${config.pdfName || "RIB"}_${stem}.pdf`);
      await refreshBalance();
      toast.success("RIB officiel généré et téléchargé !");
    } catch (err: any) {
      toast.error(err.message || "Impossible de générer le RIB");
    } finally {
      setIsGenerating(false);
    }
  };

  const renderedSections = useMemo(() => {
    if (schemaData && schemaData.sections.length > 0) {
      return schemaData.sections;
    }
    const grouped: Record<string, DynamicFormField[]> = {};
    activeFields.forEach(f => {
      const sec = f.section || "Informations";
      if (!grouped[sec]) grouped[sec] = [];
      grouped[sec].push(f);
    });
    return Object.entries(grouped).map(([title, fields], idx) => ({
      id: `sec_${idx}`,
      title,
      order: idx,
      fields
    }));
  }, [schemaData, activeFields]);

  return (
    <div className="space-y-4 pb-20 fade-in">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-white/60 hover:text-white transition-colors bg-white/[0.04] border border-white/10 px-3 py-1.5 rounded-xl active:scale-95"
        >
          <ArrowLeft size={13} />
          <span>Banques</span>
        </button>

        <span className="text-[11px] font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-xl">
          {documentPrice.toFixed(2).replace(".", ",")} €
        </span>
      </div>

      <div className={`p-4 rounded-2xl border ${config.headerBg || "bg-[#0f121d]/90 border-white/[0.08]"} flex items-center gap-3.5 shadow-sm`}>
        {config.logo && (
          <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 p-1.5 flex items-center justify-center shrink-0 overflow-hidden">
            <img src={config.logo} alt="" className={config.logoClass || "max-h-full max-w-full object-contain"} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-black italic text-white uppercase tracking-tight truncate">{config.title}</h2>
          {config.subtitle && <p className="text-[10px] text-white/50 font-medium truncate">{config.subtitle}</p>}
        </div>
      </div>

      <div className="space-y-4">
        {renderedSections.map(sec => (
          <div key={sec.id} className="bg-[#0f121d]/80 border border-white/[0.06] rounded-2xl p-3.5 space-y-3">
            <h3 className="text-xs font-black italic text-white/90 uppercase tracking-wider flex items-center gap-2 border-b border-white/[0.04] pb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {sec.title}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sec.fields.map(spec => {
                const val = formData[spec.key] ?? "";
                const hasErr = Boolean(errors[spec.key]);

                return (
                  <div key={spec.key} className={spec.span === 2 ? "sm:col-span-2 space-y-1" : "space-y-1"}>
                    <label className="text-[11px] font-bold text-white/60 uppercase tracking-wide flex items-center justify-between">
                      <span>{spec.label}</span>
                      {spec.required && <span className="text-primary text-[10px]">*</span>}
                    </label>

                    {spec.kind === "civilite" ? (
                      <div className="grid grid-cols-3 gap-1.5">
                        {CIVILITES.map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => handleChange(spec, c)}
                            className={`py-2 rounded-xl text-xs font-black transition-colors ${
                              val === c
                                ? "bg-primary text-slate-950 font-black shadow-md shadow-primary/20"
                                : "bg-white/5 border border-white/10 text-white/60 hover:text-white"
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    ) : spec.kind === "date" ? (
                      <CustomDatePicker
                        value={val}
                        onChange={v => handleChange(spec, v)}
                        hasError={hasErr}
                        placeholder={spec.placeholder}
                      />
                    ) : spec.kind === "time" ? (
                      <CustomTimePicker
                        value={val}
                        onChange={v => handleChange(spec, v)}
                        hasError={hasErr}
                      />
                    ) : spec.kind === "textarea" ? (
                      <textarea
                        value={val}
                        onChange={e => handleChange(spec, e.target.value)}
                        placeholder={spec.placeholder}
                        rows={2}
                        className={`w-full bg-white/5 border ${
                          hasErr ? "border-rose-500/80 focus:border-rose-500" : "border-white/10 focus:border-primary"
                        } rounded-xl p-3 text-xs text-white outline-none resize-none`}
                      />
                    ) : (
                      <input
                        type="text"
                        value={val}
                        onChange={e => handleChange(spec, e.target.value)}
                        placeholder={spec.placeholder}
                        className={`w-full bg-white/5 border ${
                          hasErr ? "border-rose-500/80 focus:border-rose-500" : "border-white/10 focus:border-primary"
                        } rounded-xl px-3.5 py-2.5 text-xs text-white outline-none font-mono`}
                      />
                    )}

                    {hasErr && <p className="text-[10px] text-rose-400 font-bold">{errors[spec.key]}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
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
          title={config.title}
          onClose={() => setPreviewUrl(null)}
          onAction={handleGenerate}
          actionLabel={`Acheter (${documentPrice.toFixed(2).replace(".", ",")} €)`}
          isActionLoading={isGenerating}
        />
      )}
    </div>
  );
}
