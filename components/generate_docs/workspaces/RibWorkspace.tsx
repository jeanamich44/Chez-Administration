"use client";


import {
ArrowLeft,
Building2,
Download,
Eye,
FileText,
LayoutTemplate,
RefreshCw,
Sparkles,
User
} from "lucide-react";

import { FormEvent,useEffect,useMemo,useRef,useState } from "react";
import { toast } from "sonner";
import CustomDatePicker, { isValidCalendarDate } from "@/components/generate_docs/_shared/CustomDatePicker";
import CustomTimePicker from "@/components/generate_docs/_shared/CustomTimePicker";
import {
caEdition,
myposEdition,
slashDate,
sumupDocument,
sumupDocumentDate,
sumupDocumentTime,
sumupOpening
} from "@/components/generate_docs/_shared/exampleDates";
import { getCachedFormSchema,setCachedFormSchema } from "@/components/generate_docs/_shared/formSchemaCache";
import { fetchGenerateDocsConfig,usePreviewCooldown } from "@/components/generate_docs/_shared/usePreviewCooldown";
import { getAuthHeaders } from "@/components/generate_docs/_shared/telegramAuth";
import DocumentActionButtons from "@/components/generate_docs/_shared/DocumentActionButtons";
import RibPreviewViewer from "./RibPreviewViewer";
import type { AutoIbanPart,EditorSchema,FieldKind,NormalField,RibBankConfig,RibMode } from "./types";

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
const ACCOUNT_SECTION = "Compte";
const INPUT_CLASS =
  "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none h-[46px]";
const TEXTAREA_CLASS =
  "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none resize-none";

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

function sanitizeLab(charset: string, value: string, max?: number) {
  let next = value;
  if (charset === "digits") next = next.replace(/[^0-9]/g, "");
  else if (charset === "alnum" || charset === "iban" || charset === "bic" || charset === "bic_spaced" || charset === "code") {
    next = next.replace(/[^A-Za-z0-9 ]/g, "").toUpperCase();
  } else if (charset === "upper") {
    next = next.replace(/[^A-Za-zÀ-ÿ0-9 '’./()-]/g, "").toUpperCase();
  }
  if (typeof max === "number") next = next.slice(0, max);
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

function counterColor(len: number, max?: number, rec?: number, min?: number) {
  if (min && len > 0 && len < min) return "text-amber-400";
  if (!max) return "text-white/40";
  if (len > max) return "text-rose-400";
  if (rec && len > rec) return "text-amber-400";
  return "text-emerald-400";
}

function emptyFrom(defaults: Record<string, string>) {
  return Object.fromEntries(Object.keys(defaults).map(key => [key, ""])) as Record<string, string>;
}

function sectionIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("compte") || lower.includes("bancaire") || lower.includes("banque")) return FileText;
  if (lower.includes("agence") || lower.includes("caisse")) return Building2;
  return User;
}

function Switch({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className="flex items-center justify-between gap-3 w-full text-left"
    >
      <span className="text-xs font-bold text-white/80 uppercase tracking-wide">{label}</span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-primary" : "bg-white/15"}`}>
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-5" : "left-0.5"}`}
        />
      </span>
    </button>
  );
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


// ----------------

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
        required: Boolean(rules.required),
        placeholder: f.placeholder,
        options: f.options,
        rules,
        autoIban
      };
    })
  }));

  const dynamicDefaults = getDynamicDateDefaults(slug, defaults);
  const merged: Record<string, string> = { ...dynamicDefaults };
  if (merged.iban) {
    merged.iban = formatIban(merged.iban);
  }
  if (merged.bic) {
    merged.bic = formatBic(merged.bic);
  }
  const allFields = parsedSections.flatMap(s => s.fields);
  const bField = allFields.find(item => item.autoIban === "banque");
  const gField = allFields.find(item => item.autoIban === "guichet");
  const cField = allFields.find(item => item.autoIban === "compte");
  const kField = allFields.find(item => item.autoIban === "cle");
  if (bField && gField && cField && kField) {
    const b = merged[bField.key] || "";
    const g = merged[gField.key] || "";
    const c = merged[cField.key] || "";
    const k = merged[kField.key] || "";
    if (b.length === 5 && g.length === 5 && c.length === 11 && k.length === 2) {
      const computed = computeFrenchIban(b, g, c, k);
      if (computed) merged.iban = computed;
    }
  }

  const customConfig = (parsed.customLayout || parsed.editorSchema) as EditorSchema | undefined;

  return {
    dynamicDoc: { sections: parsedSections, defaults: dynamicDefaults },
    merged,
    customConfig
  };
}

// ----------------

function getDynamicDateDefaults(slug: string, defaults: Record<string, string>): Record<string, string> {
  const res = { ...defaults };
  const now = new Date();

  if (slug === "sumup") {
    res.date_document = sumupDocumentDate(now);
    res.heure_document = sumupDocumentTime(now);
    res.date_ouverture = sumupOpening(now);
    res.header_date_text = sumupDocument(now);
    res.middle_date_ouverture = sumupOpening(now);
    return res;
  }

  if (slug === "mypos") {
    res.date_edition = myposEdition(now);
    res.header_date_text = myposEdition(now);
    return res;
  }

  if (slug === "ca") {
    res.date_edition = caEdition(now);
    res.middle_date = caEdition(now);
    return res;
  }

  for (const k of Object.keys(res)) {
    if (k === "date" || k === "date_document" || k === "date_edition") {
      res[k] = slashDate(now);
    }
  }

  return res;
}

// ----------------

export default function RibWorkspace({
  config,
  useDynamicSchema = true,
  onBack
}: {
  config: RibBankConfig;
  useDynamicSchema?: boolean;
  onBack: () => void;
}) {
  const initialCached = useMemo(() => {
    const cached = getCachedFormSchema("rib", config.slug);
    if (!cached?.schema) return null;
    return {
      ...parseRibDynamicSchema(config.slug, cached.schema),
      version: cached.version
    };
  }, [config.slug]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [mode, setMode] = useState<RibMode>("normal");
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    if (initialCached) return getDynamicDateDefaults(config.slug, initialCached.merged);
    return getDynamicDateDefaults(config.slug, config?.defaults || {});
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [ribPrice, setRibPrice] = useState(5);
  const { cooldown, isBlocked, allowed, assertReady, startCooldown, formatTimer } = usePreviewCooldown("rib");
  const [schema, setSchema] = useState<EditorSchema | null>(() => initialCached?.customConfig || null);
  const [customTexts, setCustomTexts] = useState<Record<string, string>>(() => {
    if (initialCached?.customConfig) {
      const texts = chromeOnly(initialCached.customConfig);
      if (config.slug === "sumup") {
        texts.header_date_text = sumupDocument();
        texts.middle_date_ouverture = sumupOpening();
      }
      return texts;
    }
    return {};
  });
  const [customVisible, setCustomVisible] = useState<Record<string, boolean>>(() => {
    return initialCached?.customConfig?.visible || {};
  });
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    header: true,
    middle: true,
    footer: true
  });

  const [dynamicDoc, setDynamicDoc] = useState<{
    sections: DynamicFormSection[];
    defaults: Record<string, string>;
  } | null>(() => {
    return initialCached ? initialCached.dynamicDoc : null;
  });
  const [isLoadingDynamic, setIsLoadingDynamic] = useState<boolean>(
    () => !initialCached
  );
  const [dynamicError, setDynamicError] = useState<string | null>(null);

  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [activeAddressKey, setActiveAddressKey] = useState<string | null>(null);
  const addressContainerRef = useRef<HTMLDivElement>(null);
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [cityDropdownTarget, setCityDropdownTarget] = useState<string | null>(null);
  const cityContainerRef = useRef<HTMLDivElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const lastResolvedVilleRef = useRef<string>("");
  const [customCivilite, setCustomCivilite] = useState<string>("");
  const [isCustomCivilite, setIsCustomCivilite] = useState<boolean>(false);

  useEffect(() => {
    if (!useDynamicSchema) return;
    let isMounted = true;
    async function loadDynamic() {
      const cached = getCachedFormSchema("rib", config.slug);
      let parsed = cached ? parseRibDynamicSchema(config.slug, cached.schema) : null;
      if (parsed) {
        setDynamicDoc(parsed.dynamicDoc);
        setFormData(getDynamicDateDefaults(config.slug, parsed.merged));
        if (parsed.customConfig) {
          setSchema(parsed.customConfig);
          const texts = chromeOnly(parsed.customConfig);
          if (config.slug === "sumup") {
            texts.header_date_text = sumupDocument();
            texts.middle_date_ouverture = sumupOpening();
          }
          setCustomTexts(texts);
          if (parsed.customConfig.visible) {
            setCustomVisible(parsed.customConfig.visible);
          }
        }
        setIsLoadingDynamic(false);
      } else {
        setIsLoadingDynamic(true);
      }

      setDynamicError(null);
      try {
        const res = await fetch(`/api/generate-docs/forms/rib/${config.slug}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const msg = errData.detail || (res.status === 403 ? "Accès restreint à ce document." : "Configuration introuvable en base de données.");
          if (typeof window !== "undefined") {
            try { localStorage.removeItem(`gendocs_schema_rib_${config.slug}`); } catch {}
          }
          if (isMounted) {
            setDynamicDoc(null);
            setDynamicError(msg);
          }
          return;
        }
        const data = await res.json();
        if (!data || !data.schema || data.isActive === false) {
          if (typeof window !== "undefined") {
            try { localStorage.removeItem(`gendocs_schema_rib_${config.slug}`); } catch {}
          }
          if (isMounted) {
            setDynamicDoc(null);
            setDynamicError("Ce document est actuellement indisponible ou désactivé.");
          }
          return;
        }
        if (!isMounted) return;

        if (cached && data.version && cached.version === data.version) {
          return;
        }

        const updated = setCachedFormSchema("rib", config.slug, {
          schema: data.schema,
          version: data.version || 1,
          title: data.title,
          id: data.id
        });

        const newParsed = parseRibDynamicSchema(config.slug, updated.schema);
        setDynamicDoc(newParsed.dynamicDoc);
        setFormData(newParsed.merged);
        if (newParsed.customConfig) {
          setSchema(newParsed.customConfig);
          const texts = chromeOnly(newParsed.customConfig);
          if (config.slug === "sumup") {
            texts.header_date_text = sumupDocument();
            texts.middle_date_ouverture = sumupOpening();
          }
          setCustomTexts(texts);
          if (newParsed.customConfig.visible) {
            setCustomVisible(newParsed.customConfig.visible);
          }
        }
        setIsCustomCivilite(false);
        setCustomCivilite("");
      } catch (err: any) {
        if (isMounted) {
          setDynamicError(err.message || "Erreur de configuration.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingDynamic(false);
        }
      }
    }
    loadDynamic();
    return () => {
      isMounted = false;
    };
  }, [useDynamicSchema, config.slug]);

  const activeFields: DynamicFormField[] = useMemo(() => {
    return dynamicDoc ? dynamicDoc.sections.filter(s => !s.hasAdvancedMode).flatMap(s => s.fields) : [];
  }, [dynamicDoc]);

  const sections = useMemo(() => {
    return dynamicDoc ? dynamicDoc.sections.filter(s => !s.hasAdvancedMode).map(s => s.title) : [];
  }, [dynamicDoc]);

  useEffect(() => {
    fetchGenerateDocsConfig().then(data => {
      const value = Number(data?.prices?.[config.slug]);
      if (Number.isFinite(value)) setRibPrice(value);
    });
  }, [config.slug]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest("[data-address-container]")) {
        setShowAddressDropdown(false);
      }
      if (!target?.closest("[data-city-container]")) {
        setShowCityDropdown(false);
        setCityDropdownTarget(null);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  useEffect(() => {
    const hasRegionField = activeFields.some(f => f.key === "region");
    if (!hasRegionField) return;
    const ville = (formData.ville || "").trim();
    if (ville.length < 2) return;
    if (lastResolvedVilleRef.current === ville && formData.region) return;

    let active = true;
    const timer = setTimeout(async () => {
      try {
        const cp = (formData.cp || "").trim();
        let url = `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(ville)}&boost=population&fields=nom,region&limit=1`;
        if (cp.length === 5) {
          url = `https://geo.api.gouv.fr/communes?codePostal=${cp}&fields=nom,region&limit=1`;
        }
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (active && data && data.length > 0) {
          const reg = data[0].region?.nom || "";
          if (reg) {
            lastResolvedVilleRef.current = ville;
            setFormData(prev => ({ ...prev, region: reg }));
          }
        }
      } catch {}
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [formData.ville, formData.cp, activeFields, formData.region]);

  const closePreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
  };

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

  const ibanMismatch = useMemo(() => {
    if (config.composeIban === false) return false;
    const banque = activeFields.find(item => item.autoIban === "banque");
    const guichet = activeFields.find(item => item.autoIban === "guichet");
    const compte = activeFields.find(item => item.autoIban === "compte");
    const cle = activeFields.find(item => item.autoIban === "cle");
    if (!banque || !guichet || !compte || !cle) return false;
    const b = formData[banque.key] || "";
    const g = formData[guichet.key] || "";
    const c = formData[compte.key] || "";
    const k = formData[cle.key] || "";
    if (b.length !== 5 || g.length !== 5 || c.length !== 11 || k.length !== 2) return false;
    const expected = computeFrenchIban(b, g, c, k);
    const current = (formData.iban || "").trim().toUpperCase().replace(/\s+/g, "");
    const expectedClean = expected.replace(/\s+/g, "");
    return current.length > 0 && !!expectedClean && current !== expectedClean;
  }, [activeFields, config.composeIban, formData]);

  const fetchAddressSuggestions = async (
    query: string,
    fieldKey: string,
    currentCp?: string,
    currentVille?: string
  ) => {
    setActiveAddressKey(fieldKey);
    if (query.trim().length < 3) {
      setAddressSuggestions([]);
      setShowAddressDropdown(false);
      return;
    }
    try {
      const group = getAddressGroup(fieldKey);
      const cp = (currentCp !== undefined ? currentCp : formData[group.cp] || "").trim();
      const ville = (currentVille !== undefined ? currentVille : formData[group.ville] || "").trim();
      let url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`;
      if (cp.length === 5) {
        url += `&postcode=${encodeURIComponent(cp)}`;
      } else if (ville.length >= 2) {
        url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(`${query} ${ville}`)}&limit=5`;
      }
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      const suggestions: AddressSuggestion[] = (data.features || []).map((feature: any) => {
        const ctx = (feature.properties?.context || "").split(",").map((s: string) => s.trim());
        const reg = ctx.length >= 3 ? ctx[2] : ctx.length >= 2 ? ctx[1] : "";
        return {
          label: feature.properties.label,
          name: feature.properties.name,
          postcode: feature.properties.postcode,
          city: feature.properties.city,
          region: reg
        };
      });
      setAddressSuggestions(suggestions);
      setShowAddressDropdown(suggestions.length > 0);
    } catch {
      setAddressSuggestions([]);
      setShowAddressDropdown(false);
    }
  };

  const fetchCityFromCp = async (cpVal: string, fieldKey: string) => {
    if (cpVal.length !== 5) {
      setCitySuggestions([]);
      setShowCityDropdown(false);
      setCityDropdownTarget(null);
      return;
    }
    const group = getAddressGroup(fieldKey);
    try {
      const res = await fetch(
        `https://geo.api.gouv.fr/communes?codePostal=${cpVal}&fields=nom,codePostal,codesPostaux,region&format=json`
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data?.length === 1) {
        const villeSpec = activeFields.find(f => f.key === group.ville);
        const formatCity = (name: string) => {
          if (villeSpec?.rules?.transform === "capitalize" || villeSpec?.rules?.transform === "title") {
            return name.replace(/[A-Za-zÀ-ÿ]+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
          }
          return name.toUpperCase();
        };
        const cityName = formatCity(data[0].nom);
        const regionName = data[0].region?.nom || "";
        lastResolvedVilleRef.current = cityName;
        setFormData(prev => {
          const updates: Record<string, string> = { [group.ville]: cityName };
          if (activeFields.some(f => f.key === "region") && regionName) {
            updates.region = regionName;
          }
          if (group.combined) {
            updates[group.combined] = group.isMultiLine
              ? `${prev[group.address] || ""}\n${cpVal} ${cityName}`.trim()
              : `${cpVal} ${cityName}`.trim();
          }
          return { ...prev, ...updates };
        });
        setCitySuggestions([]);
        setShowCityDropdown(false);
        setCityDropdownTarget(null);
        setErrors(prev => ({ ...prev, [group.ville]: "" }));
        toast.success(`Ville détectée : ${cityName}`);
      } else if (data?.length > 1) {
        const villeSpec = activeFields.find(f => f.key === group.ville);
        const formatCity = (name: string) => {
          if (villeSpec?.rules?.transform === "capitalize" || villeSpec?.rules?.transform === "title") {
            return name.replace(/[A-Za-zÀ-ÿ]+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
          }
          return name.toUpperCase();
        };
        setCitySuggestions(
          data.map((item: any) => ({
            nom: formatCity(item.nom),
            codePostal: cpVal,
            region: item.region?.nom || ""
          }))
        );
        setCityDropdownTarget(fieldKey);
        setShowCityDropdown(true);
      } else {
        setCitySuggestions([]);
        setShowCityDropdown(false);
        setCityDropdownTarget(null);
      }
    } catch {
      setCitySuggestions([]);
      setShowCityDropdown(false);
      setCityDropdownTarget(null);
    }
  };

  const fetchCpFromCity = async (cityVal: string, fieldKey: string) => {
    if (cityVal.trim().length < 2) {
      setCitySuggestions([]);
      setShowCityDropdown(false);
      setCityDropdownTarget(null);
      return;
    }
    const group = getAddressGroup(fieldKey);
    try {
      const res = await fetch(
        `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(cityVal.trim())}&fields=nom,codePostal,codesPostaux,region&format=json&boost=population&limit=6`
      );
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        setCitySuggestions([]);
        setShowCityDropdown(false);
        setCityDropdownTarget(null);
        return;
      }
      const trimmedUpper = cityVal.trim().toUpperCase();
      const exactMatches = data.filter((item: any) => item.nom.toUpperCase() === trimmedUpper);
      if (exactMatches.length === 1 && exactMatches[0].codesPostaux?.length === 1) {
        const zip = exactMatches[0].codesPostaux[0] || exactMatches[0].codePostal;
        const reg = exactMatches[0].region?.nom || "";
        lastResolvedVilleRef.current = trimmedUpper;
        if (zip) {
          setFormData(prev => {
            const updates: Record<string, string> = { [group.cp]: zip };
            if (activeFields.some(f => f.key === "region") && reg) {
              updates.region = reg;
            }
            if (group.combined) {
              updates[group.combined] = group.isMultiLine
                ? `${prev[group.address] || ""}\n${zip} ${prev[group.ville] || trimmedUpper}`.trim()
                : `${zip} ${prev[group.ville] || trimmedUpper}`.trim();
            }
            return { ...prev, ...updates };
          });
          setErrors(prev => ({ ...prev, [group.cp]: "" }));
        }
      }
      const villeSpec = activeFields.find(f => f.key === group.ville);
      const formatCity = (name: string) => {
        if (villeSpec?.rules?.transform === "capitalize" || villeSpec?.rules?.transform === "title") {
          return name.replace(/[A-Za-zÀ-ÿ]+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
        }
        return name.toUpperCase();
      };
      const suggestions: CitySuggestion[] = [];
      data.forEach((item: any) => {
        const postcodes: string[] = item.codesPostaux || (item.codePostal ? [item.codePostal] : []);
        const reg = item.region?.nom || "";
        postcodes.forEach((zip: string) => {
          suggestions.push({ nom: formatCity(item.nom), codePostal: zip, region: reg });
        });
      });
      setCitySuggestions(suggestions.slice(0, 8));
      setCityDropdownTarget(fieldKey);
      setShowCityDropdown(suggestions.length > 0);
    } catch {
      setCitySuggestions([]);
      setShowCityDropdown(false);
      setCityDropdownTarget(null);
    }
  };

  const validateField = (spec: DynamicFormField, val: string) => {
    if (spec.key === "iban" || spec.kind === "iban") {
      const cleanLen = val.replace(/\s+/g, "").length;
      if (spec.required && cleanLen === 0) return `${spec.label} est obligatoire.`;
      if (spec.min && cleanLen < 15) {
        return `Minimum 15 caractères requis (${cleanLen}/15).`;
      }
      return "";
    }
    if (spec.key === "bic" || spec.kind === "bic") {
      const cleanLen = val.replace(/\s+/g, "").length;
      if (spec.required && cleanLen === 0) return `${spec.label} est obligatoire.`;
      if (cleanLen > 0 && cleanLen < 8) {
        return `Minimum 8 caractères requis (${cleanLen}/8).`;
      }
      if (cleanLen > 11) {
        return `Maximum 11 caractères autorisés (${cleanLen}/11).`;
      }
      return "";
    }
    if (spec.kind === "date" || spec.key === "date" || spec.key.startsWith("date_") || spec.key.endsWith("_date") || spec.key.includes("date") || spec.key === "middle_date") {
      if (val) {
        const check = isValidCalendarDate(val);
        if (!check.valid) {
          return check.message || `Date invalide pour ${spec.label}.`;
        }
      }
    }
    if (spec.required && !val.trim()) return `${spec.label} est obligatoire.`;
    if (spec.kind === "cp" && val && val.length !== 5) {
      return `Le code postal doit comporter 5 chiffres (${val.length}/5).`;
    }
    if (spec.rules?.regex && val) {
      try {
        const re = new RegExp(spec.rules.regex);
        if (!re.test(val)) return `Format invalide pour ${spec.label}.`;
      } catch {}
    }
    const isTel = spec.key.includes("tel") || spec.key.includes("fax");
    if (isTel && val) {
      const min = spec.min || 10;
      if (val.length < min) {
        return `Minimum ${min} chiffres requis (${val.length}/${min}).`;
      }
      if (spec.max && val.length > spec.max) {
        return `Maximum ${spec.max} chiffres autorisés (${val.length}/${spec.max}).`;
      }
      return "";
    }
    if (spec.autoIban && spec.max && val && val.length !== spec.max) {
      return `Doit comporter ${spec.max} ${spec.kind === "digits" ? "chiffres" : "caractères"} (${val.length}/${spec.max}).`;
    }
    if (spec.min && val && val.length < spec.min) {
      return `Minimum ${spec.min} ${spec.kind === "digits" ? "chiffres" : "caractères"} requis (${val.length}/${spec.min}).`;
    }
    if (spec.max && val && val.length > spec.max) {
      return `Maximum ${spec.max} ${spec.kind === "digits" ? "chiffres" : "caractères"} autorisés (${val.length}/${spec.max}).`;
    }
    return "";
  };

  const handleChange = (spec: DynamicFormField, value: string) => {
    let raw = value;
    if (spec.rules?.transform === "uppercase") raw = raw.toUpperCase();
    else if (spec.rules?.transform === "lowercase") raw = raw.toLowerCase();
    else if (spec.rules?.transform === "digits_only") raw = raw.replace(/\D/g, "");
    else if (spec.rules?.transform === "capitalize") {
      raw = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    } else if (spec.rules?.transform === "title") {
      raw = raw.replace(/[A-Za-zÀ-ÿ]+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    }
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

    if (spec.kind === "address") {
      fetchAddressSuggestions(val, spec.key, nextData[group.cp], nextData[group.ville]);
    }
    if (spec.kind === "cp") {
      fetchCityFromCp(val, spec.key);
    }
    if (spec.kind === "ville") {
      fetchCpFromCity(val, spec.key);
    }
    const err = validateField(spec, val);
    setErrors(prev => ({ ...prev, [spec.key]: err }));
  };

  const validateAll = () => {
    const next: Record<string, string> = {};
    activeFields.forEach(spec => {
      const err = validateField(spec, formData[spec.key] || "");
      if (err) next[spec.key] = err;
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildPayload = () => {
    const body: Record<string, unknown> = {
      ...formData,
      mode,
      cp: formData.cp || "",
      ville: formData.ville || "",
      cp_ville: formData.cp_ville || `${formData.cp || ""} ${formData.ville || ""}`.trim()
    };
    if (formData.nom || formData.prenom) {
      body.nom = formData.nom || "";
      body.prenom = formData.prenom || "";
      body.civilite = formData.civilite || "";
    }
    if (formData.domiciliation_rue || formData.domiciliation_cp || formData.domiciliation_ville) {
      body.domiciliation_rue = formData.domiciliation_rue || "";
      body.domiciliation_cp = formData.domiciliation_cp || "";
      body.domiciliation_ville = formData.domiciliation_ville || "";
      body.domiciliation =
        formData.domiciliation ||
        `${formData.domiciliation_rue || ""}\n${formData.domiciliation_cp || ""} ${formData.domiciliation_ville || ""}`.trim();
    }
    if (formData.agence_cp || formData.agence_ville) {
      body.agence_cp = formData.agence_cp || "";
      body.agence_ville = formData.agence_ville || "";
      body.agence_cp_ville =
        formData.agence_cp_ville || `${formData.agence_cp || ""} ${formData.agence_ville || ""}`.trim();
    }
    if (mode === "custom") {
      body.custom = customTexts;
      body.visible = customVisible;
      for (const [key, val] of Object.entries(customVisible)) {
        body[key] = val;
      }
    }
    return body;
  };

  const downloadBlob = async (path: string, filename: string) => {
    const res = await fetch(`/api/generate-docs/rib/${config.slug}/${path}`, {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(buildPayload())
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.detail || "Erreur de génération");
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
  };

  const handlePreview = async () => {
    if (!assertReady()) return;
    if (!validateAll()) {
      toast.error("Formulaire incomplet", { description: "Corrigez les champs indiqués." });
      return;
    }
    setIsPreviewLoading(true);
    try {
      const res = await fetch(`/api/generate-docs/rib/${config.slug}/preview`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(buildPayload())
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || "Erreur de génération");
      }
      const type = res.headers.get("content-type") || "";
      if (!type.includes("image/")) {
        throw new Error("Aperçu invalide");
      }
      const blob = await res.blob();
      if (blob.type && !blob.type.startsWith("image/")) {
        throw new Error("Aperçu invalide");
      }
      const url = URL.createObjectURL(blob);
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = url;
      setPreviewUrl(url);
      startCooldown();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'aperçu.");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!validateAll()) {
      toast.error("Formulaire incomplet", { description: "Corrigez les champs indiqués." });
      return;
    }
    setIsGenerating(true);
    try {
      const stem = (formData.titulaire || formData.nom_prenom || "document").replace(/[^A-Za-z0-9]/g, "_");
      await downloadBlob("generate", `${config.pdfName}_${stem}.pdf`);
      toast.success("RIB généré et téléchargé");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la création du document.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getFieldSpanClass = (spec: DynamicFormField, section: string, sectionFields: DynamicFormField[]) => {
    const lowerSec = section.toLowerCase();
    const hasCivilite = sectionFields.some(item => item.kind === "civilite" || item.key === "civilite");
    const isTitulaire = lowerSec.includes("titulaire") || hasCivilite;
    const isAccount = !isTitulaire && (lowerSec.includes("compte") || lowerSec.includes("bancaire"));

    if (isTitulaire) {
      if (
        spec.key === "domiciliation" ||
        spec.key === "agence_domiciliation" ||
        spec.key.includes("domiciliation") ||
        spec.key === "titulaire" ||
        spec.key === "nom_prenom" ||
        spec.key === "nom_societe" ||
        spec.key === "region" ||
        spec.key === "pays" ||
        spec.key === "middle_titulaire_dept" ||
        spec.span === 12
      ) {
        return "md:col-span-12";
      }

      if (spec.key === "date_document" || spec.key === "heure_document" || spec.kind === "time") {
        const hasBoth = sectionFields.some(item => item.key === "date_document" || item.kind === "date") && sectionFields.some(item => item.key === "heure_document" || item.kind === "time");
        if (hasBoth) return "md:col-span-6";
        return "md:col-span-12";
      }

      if (spec.key === "nom" || spec.key === "prenom") {
        if (!hasCivilite) {
          const hasPrenom = sectionFields.some(item => item.key === "prenom");
          if (hasPrenom) return "md:col-span-6";
          return "md:col-span-12";
        }
        return "md:col-span-4";
      }

      if (spec.key === "civilite" || spec.kind === "civilite") {
        return "md:col-span-4";
      }

      if (spec.key === "adresse" || spec.kind === "address") {
        const hasCp = sectionFields.some(item => item.key === "cp" || item.kind === "cp");
        const hasVille = sectionFields.some(item => item.key === "ville" || item.kind === "ville");
        const hasCpVille = sectionFields.some(item => item.key === "cp_ville");
        if (hasCp && hasVille) return "md:col-span-4";
        if (hasCpVille) return "md:col-span-6";
        return "md:col-span-12";
      }

      if (spec.key === "cp" || spec.kind === "cp") {
        const hasAddr = sectionFields.some(item => item.key === "adresse" || item.kind === "address");
        const hasVille = sectionFields.some(item => item.key === "ville" || item.kind === "ville");
        if (hasAddr && hasVille) return "md:col-span-4";
        return "md:col-span-6";
      }

      if (spec.key === "ville" || spec.kind === "ville") {
        const hasAddr = sectionFields.some(item => item.key === "adresse" || item.kind === "address");
        const hasCp = sectionFields.some(item => item.key === "cp" || item.kind === "cp");
        if (hasAddr && hasCp) return "md:col-span-4";
        return "md:col-span-6";
      }

      if (spec.key === "cp_ville") {
        const hasAddr = sectionFields.some(item => item.key === "adresse" || item.kind === "address");
        if (hasAddr) return "md:col-span-6";
        return "md:col-span-12";
      }

      if (spec.span === 2) return "md:col-span-12";
      return "md:col-span-4";
    }

    if (spec.span === 12) return "md:col-span-12";
    if (spec.span === 6) return "md:col-span-6";
    if (spec.span === 4) return "md:col-span-4";
    if (spec.span === 3) return "md:col-span-3";

    if (isAccount) {
      if (spec.key === "iban" || spec.key === "bic" || spec.span === 2) {
        return "md:col-span-6";
      }
      if (spec.span === 4) {
        return "md:col-span-12";
      }
      return "md:col-span-3";
    }

    if (
      spec.span === 2 ||
      spec.kind === "address" ||
      spec.kind === "textarea" ||
      spec.key === "titulaire" ||
      spec.key === "nom_prenom" ||
      spec.key === "domiciliation" ||
      spec.key.endsWith("_nom") ||
      spec.key.endsWith("_adresse")
    ) {
      return "md:col-span-12";
    }

    return "md:col-span-6";
  };

  const renderNormalField = (spec: DynamicFormField, section: string, sectionFields: DynamicFormField[]) => {
    const value = formData[spec.key] || "";
    const spanClass = getFieldSpanClass(spec, section, sectionFields);
    const isAddress = spec.kind === "address";
    const isCity = spec.kind === "cp" || spec.kind === "ville";
    const ref = isAddress ? addressContainerRef : isCity ? cityContainerRef : undefined;

    if (spec.key === "civilite") {
      const baseOptions: { label: string; value: string }[] = (
        spec.options && spec.options.length > 0 ? spec.options : CIVILITES
      ).map(opt => {
        if (typeof opt === "object" && opt !== null) {
          return { label: opt.label || opt.value, value: opt.value };
        }
        return { label: String(opt), value: String(opt) };
      });

      const allCivOptions = [
        ...baseOptions,
        { label: "Rien", value: "__NONE__" },
        { label: "Personnalisé", value: "__CUSTOM__" }
      ];

      const currentVal = formData[spec.key] ?? "";
      let selectedSelectVal = currentVal;
      if (isCustomCivilite) {
        selectedSelectVal = "__CUSTOM__";
      } else if (currentVal === "" || currentVal === "__NONE__") {
        selectedSelectVal = "__NONE__";
      } else if (baseOptions.some(o => o.value === currentVal)) {
        selectedSelectVal = currentVal;
      } else {
        selectedSelectVal = "__CUSTOM__";
      }

      return (
        <div key={spec.key} className={`space-y-2 relative ${spanClass}`}>
          <div className="flex justify-between items-center gap-2 min-h-[16px]">
            <label className="text-xs font-bold text-white/80 uppercase">{spec.label}</label>
          </div>
          <div className="space-y-2">
            <select
              value={selectedSelectVal}
              onChange={e => {
                const val = e.target.value;
                if (val === "__NONE__") {
                  setIsCustomCivilite(false);
                  setFormData(prev => ({ ...prev, [spec.key]: "" }));
                } else if (val === "__CUSTOM__") {
                  setIsCustomCivilite(true);
                  setFormData(prev => ({ ...prev, [spec.key]: customCivilite }));
                } else {
                  setIsCustomCivilite(false);
                  setFormData(prev => ({ ...prev, [spec.key]: val }));
                }
              }}
              className={`${INPUT_CLASS} [&>option]:bg-zinc-900 [&>option]:text-white cursor-pointer`}
            >
              {allCivOptions.map((opt, idx) => (
                <option key={`${opt.value}-${idx}`} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {(isCustomCivilite || selectedSelectVal === "__CUSTOM__") ? (
              <input
                type="text"
                value={customCivilite}
                onChange={e => {
                  const text = e.target.value;
                  setCustomCivilite(text);
                  setFormData(prev => ({ ...prev, [spec.key]: text }));
                }}
                placeholder="Saisissez la civilité personnalisée..."
                className={INPUT_CLASS}
              />
            ) : null}
          </div>
          {errors[spec.key] ? <p className="text-xs text-rose-400 font-bold">{errors[spec.key]}</p> : null}
        </div>
      );
    }

    if (spec.options && spec.options.length > 0) {
      return (
        <div key={spec.key} className={`space-y-2 relative ${spanClass}`}>
          <div className="flex justify-between items-center gap-2 min-h-[16px]">
            <label className="text-xs font-bold text-white/80 uppercase">{spec.label}</label>
          </div>
          <select
            value={value}
            onChange={e => handleChange(spec, e.target.value)}
            className={`${INPUT_CLASS} [&>option]:bg-zinc-900 [&>option]:text-white cursor-pointer`}
          >
            {spec.options.length > 1 ? <option value="">Sélectionner...</option> : null}
            {spec.options.map((opt, idx) => {
              const optVal = typeof opt === "object" && opt !== null ? opt.value : opt;
              const optLabel = typeof opt === "object" && opt !== null ? (opt.label || opt.value) : opt;
              return (
                <option key={`${optVal}-${idx}`} value={optVal}>
                  {optLabel}
                </option>
              );
            })}
          </select>
          {errors[spec.key] ? <p className="text-xs text-rose-400 font-bold">{errors[spec.key]}</p> : null}
        </div>
      );
    }


    const isTel = spec.key.includes("tel") || spec.key.includes("fax");
    const minTarget = isTel ? (spec.min || 10) : spec.min;
    const isDate =
      spec.kind === "date" ||
      spec.key === "date" ||
      spec.key.startsWith("date_") ||
      spec.key.endsWith("_date") ||
      spec.key.includes("date");
    const isTime =
      spec.kind === "time" ||
      spec.key === "heure_document" ||
      spec.key === "heure" ||
      spec.key.startsWith("heure_") ||
      spec.key.endsWith("_heure") ||
      spec.key.includes("heure") ||
      spec.key === "time" ||
      spec.key.startsWith("time_") ||
      spec.key.endsWith("_time") ||
      spec.key.includes("time");

    return (
      <div
        key={spec.key}
        className={`space-y-2 relative ${spanClass}`}
        ref={ref as any}
        data-address-container={isAddress ? "true" : undefined}
        data-city-container={isCity ? "true" : undefined}
      >
        <div className="flex justify-between items-center gap-2 min-h-[16px]">
          <label className="text-xs font-bold text-white/80 uppercase">{spec.label}</label>
          {spec.max && !isTime && !isDate ? (() => {
            const displayLen = (spec.key === "bic" || spec.kind === "bic") ? value.replace(/\s+/g, "").length : value.length;
            return (
              <span className={`text-[10px] font-mono ${counterColor(displayLen, spec.max, spec.rec, minTarget)}`}>
                {minTarget && displayLen > 0 && displayLen < minTarget
                  ? `min ${minTarget} car. (${displayLen}/${minTarget})`
                  : `${displayLen}/${spec.max}`}
              </span>
            );
          })() : null}
        </div>
        {spec.kind === "textarea" ? (
          <textarea
            rows={2}
            value={value}
            placeholder={spec.placeholder}
            onChange={e => handleChange(spec, e.target.value)}
            className={TEXTAREA_CLASS}
          />
        ) : isTime ? (
          <CustomTimePicker
            value={value}
            onChange={val => handleChange(spec, val)}
            hasError={Boolean(errors[spec.key])}
          />
        ) : isDate ? (
          <CustomDatePicker
            value={value}
            onChange={val => handleChange(spec, val)}
            hasError={Boolean(errors[spec.key])}
            placeholder={spec.placeholder || "Sélectionner une date"}
            dateFormat={config.slug === "sumup" ? "english" : config.slug === "mypos" ? "month_first" : spec.max && spec.max <= 10 ? "slash" : /[a-zA-ZÀ-ÿ]/.test(value) ? "french" : "slash"}
          />
        ) : (
          <input
            type="text"
            value={value}
            placeholder={spec.placeholder}
            onChange={e => handleChange(spec, e.target.value)}
            className={`${INPUT_CLASS} ${
              spec.key === "iban" && ibanMismatch && !errors[spec.key] ? "border-amber-500/60 focus:border-amber-400" : ""
            }`}
          />
        )}
        {errors[spec.key] ? <p className="text-xs text-rose-400 font-bold">{errors[spec.key]}</p> : null}
        {spec.key === "iban" && !errors[spec.key] && ibanMismatch ? (
          <p className="text-xs text-amber-400 font-bold">
            Attention : l'IBAN ne correspond pas aux codes banque/guichet/compte saisis (si c'est volontaire, vous pouvez continuer).
          </p>
        ) : null}
        {isAddress && showAddressDropdown && activeAddressKey === spec.key && addressSuggestions.length > 0 ? (
          <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-slate-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl">
            {addressSuggestions.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  const group = getAddressGroup(spec.key);
                  const addrSpec = activeFields.find(f => f.key === group.address);
                  const villeSpec = activeFields.find(f => f.key === group.ville);
                  const nextCp = item.postcode || "";
                  const nextVille = (villeSpec?.rules?.transform === "capitalize" || villeSpec?.rules?.transform === "title")
                    ? (item.city || "").replace(/[A-Za-zÀ-ÿ]+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                    : (item.city || "").toUpperCase();
                  const nextAddr = addrSpec?.rules?.transform === "title"
                    ? item.name.replace(/[A-Za-zÀ-ÿ]+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                    : item.name.toUpperCase();
                  lastResolvedVilleRef.current = nextVille;
                  setFormData(prev => {
                    const updates: Record<string, string> = {
                      [group.address]: nextAddr
                    };
                    if (activeFields.some(f => f.key === group.cp)) {
                      updates[group.cp] = nextCp;
                    }
                    if (activeFields.some(f => f.key === group.ville)) {
                      updates[group.ville] = nextVille;
                    }
                    if (activeFields.some(f => f.key === "region") && item.region) {
                      updates.region = item.region;
                    }
                    if (group.combined) {
                      updates[group.combined] = group.isMultiLine
                        ? `${nextAddr}\n${nextCp} ${nextVille}`.trim()
                        : `${nextCp} ${nextVille}`.trim();
                    }
                    return { ...prev, ...updates };
                  });
                  setErrors(prev => ({
                    ...prev,
                    [group.address]: "",
                    [group.cp]: "",
                    [group.ville]: ""
                  }));
                  setShowAddressDropdown(false);
                  setActiveAddressKey(null);
                  toast.success("Adresse et localisation sélectionnées");
                }}
                className="w-full text-left px-4 py-2.5 text-xs text-white/80 hover:bg-primary/20 border-b border-white/5 last:border-0"
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
        {isCity && showCityDropdown && cityDropdownTarget === spec.key && citySuggestions.length > 0 ? (
          <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-slate-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl max-h-60 overflow-y-auto">
            {citySuggestions.map((item, idx) => (
              <button
                key={`${item.nom}-${item.codePostal}-${idx}`}
                type="button"
                onClick={() => {
                  const group = getAddressGroup(spec.key);
                  const villeSpec = activeFields.find(f => f.key === group.ville);
                  const formattedCity = (villeSpec?.rules?.transform === "capitalize" || villeSpec?.rules?.transform === "title")
                    ? item.nom.replace(/[A-Za-zÀ-ÿ]+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                    : item.nom;
                  lastResolvedVilleRef.current = formattedCity;
                  setFormData(prev => {
                    const updates: Record<string, string> = {
                      [group.cp]: item.codePostal,
                      [group.ville]: formattedCity
                    };
                    if (activeFields.some(f => f.key === "region") && item.region) {
                      updates.region = item.region;
                    }
                    if (group.combined) {
                      updates[group.combined] = group.isMultiLine
                        ? `${prev[group.address] || ""}\n${item.codePostal} ${formattedCity}`.trim()
                        : `${item.codePostal} ${formattedCity}`.trim();
                    }
                    return { ...prev, ...updates };
                  });
                  setErrors(prev => ({ ...prev, [group.cp]: "", [group.ville]: "" }));
                  setShowCityDropdown(false);
                  setCityDropdownTarget(null);
                  toast.success(`Commune sélectionnée : ${item.nom} (${item.codePostal})`);
                }}
                className="w-full text-left px-4 py-2.5 text-xs text-white/80 hover:bg-primary/20 border-b border-white/5 last:border-0 flex justify-between items-center"
              >
                <span>{item.nom}</span>
                <span className="text-white/40 font-mono text-[11px]">{item.codePostal}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    );
  };

  const chromeFields = (section: string) =>
    (schema?.fields || []).filter(item => item.section === section && !item.identity);
  const chromeBlocks = (section: string) =>
    (schema?.blocks || []).filter(item => item.section === section && !item.master);
  const masterBlock = (section: string) =>
    (schema?.blocks || []).find(item => item.section === section && item.master);

  if (!mounted || (useDynamicSchema && isLoadingDynamic)) {
    return (
      <main className="min-h-screen pt-6 md:pt-36 pb-32 md:pb-20 px-4 md:px-6 max-w-5xl mx-auto select-none">
        <div className="flex items-center gap-3 mb-4">
          <button type="button" onClick={onBack} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/40 hover:text-primary transition-colors cursor-pointer">
            <ArrowLeft size={14} /> Retour aux RIB
          </button>
        </div>
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <RefreshCw className="text-primary animate-spin w-8 h-8" />
          <p className="text-white/40 text-xs font-black uppercase tracking-widest">
            Chargement du formulaire...
          </p>
        </div>
      </main>
    );
  }

  if (useDynamicSchema && (dynamicError || !dynamicDoc)) {
    return (
      <main className="min-h-screen pt-6 md:pt-36 pb-32 md:pb-20 px-4 md:px-6 max-w-5xl mx-auto select-none">
        <div className="flex items-center gap-3 mb-4">
          <button type="button" onClick={onBack} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/40 hover:text-primary transition-colors cursor-pointer">
            <ArrowLeft size={14} /> Retour aux RIB
          </button>
        </div>
        <div className="glass p-8 md:p-12 text-center space-y-4 max-w-2xl mx-auto my-12 border border-rose-500/20">
          <p className="text-xl font-black text-rose-400 uppercase tracking-tight">Service Indisponible</p>
          <p className="text-sm text-white/60">
            {dynamicError || "Ce document est actuellement indisponible ou désactivé."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-6 md:pt-36 pb-32 md:pb-20 px-4 md:px-6 max-w-5xl mx-auto select-none">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <button type="button" onClick={onBack} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/40 hover:text-primary transition-colors cursor-pointer">
            <ArrowLeft size={14} /> Retour aux RIB
          </button>
        </div>
        <div className="flex items-center gap-4 mb-5">
          <div className={`shrink-0 p-3 border rounded-2xl backdrop-blur-md flex items-center justify-center ${config.headerBg}`}>
            <img src={config.logo} alt={config.logoAlt} className={config.logoClass} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-black italic text-white">{config.title}</h1>
            <p className="text-xs text-white/40 font-bold tracking-wider uppercase">{config.subtitle}</p>
          </div>
        </div>

        <div className="glass p-2 md:p-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("normal")}
              className={`rounded-xl px-4 py-3 text-left transition-all ${
                mode === "normal" ? "bg-primary text-black shadow-lg shadow-primary/20" : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              <p className="text-xs font-black uppercase tracking-widest">Mode normal</p>
              <p className={`text-[11px] mt-1 ${mode === "normal" ? "text-black/70" : "text-white/40"}`}>
                Infos du titulaire, du compte, de l'agence et des dates.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setMode("custom")}
              className={`rounded-xl px-4 py-3 text-left transition-all ${
                mode === "custom" ? "bg-primary text-black shadow-lg shadow-primary/20" : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              <p className="text-xs font-black uppercase tracking-widest">Mode personnalisé</p>
              <p className={`text-[11px] mt-1 ${mode === "custom" ? "text-black/70" : "text-white/40"}`}>
                Chaque texte et chaque bloc : en-tête, corps, pied.
              </p>
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {sections.map(section => {
          const Icon = sectionIcon(section);
          const fields = activeFields.filter(item => item.section === section);
          return (
            <div key={section} className="glass p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                <Icon className="text-primary" size={20} />
                <h2 className="text-lg font-black italic text-white uppercase">{section}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {fields.map(item => renderNormalField(item, section, fields))}
              </div>
            </div>
          );
        })}

        {mode === "custom" ? (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <LayoutTemplate className="text-primary" size={18} />
              <div>
                <h2 className="text-lg font-black italic text-white uppercase">Mise en page du document</h2>
                <p className="text-xs text-white/40">
                  Affichez ou masquez les blocs, puis modifiez n'importe quel texte du gabarit.
                </p>
              </div>
            </div>
            {!schema ? (
              <div className="glass p-6 text-sm text-white/50">Chargement des options de ce gabarit…</div>
            ) : (
              (schema.sections || []).map(section => {
                const master = masterBlock(section.id);
                const blocks = chromeBlocks(section.id);
                const fields = chromeFields(section.id);
                if (!master && blocks.length === 0 && fields.length === 0) return null;
                const open = openSections[section.id] !== false;
                const masterOn = master ? customVisible[master.id] !== false : true;
                return (
                  <div key={section.id} className={`glass p-6 md:p-8 space-y-5 ${masterOn ? "" : "opacity-70"}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-4 border-b border-white/10">
                      <button
                        type="button"
                        onClick={() => setOpenSections(prev => ({ ...prev, [section.id]: !open }))}
                        className="flex-1 text-left"
                      >
                        <h3 className="text-lg font-black italic text-white uppercase">{section.label}</h3>
                        <p className="text-[11px] text-white/40">
                          {fields.length} {fields.length > 1 ? "textes" : "texte"} · {blocks.length}{" "}
                          {blocks.length > 1 ? "blocs" : "bloc"}
                        </p>
                      </button>
                      {master ? (
                        <div className="sm:w-56">
                          <Switch
                            on={customVisible[master.id] !== false}
                            onToggle={() =>
                              setCustomVisible(prev => ({ ...prev, [master.id]: prev[master.id] === false }))
                            }
                            label={customVisible[master.id] === false ? "Masqué" : "Affiché"}
                          />
                        </div>
                      ) : null}
                    </div>
                    {open ? (
                      <>
                        {blocks.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {blocks.map(block => (
                              <div key={block.id} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                                <Switch
                                  on={customVisible[block.id] !== false}
                                  onToggle={() =>
                                    setCustomVisible(prev => ({ ...prev, [block.id]: prev[block.id] === false }))
                                  }
                                  label={block.label}
                                />
                              </div>
                            ))}
                          </div>
                        ) : null}
                        {fields.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {fields.map(item => {
                              const value = customTexts[item.id] ?? "";
                              const span = item.widget === "textarea" ? "md:col-span-2" : "";
                              const isDateField =
                                item.id === "date" ||
                                item.id.startsWith("date_") ||
                                item.id.endsWith("_date") ||
                                item.id.includes("date") ||
                                item.label.toLowerCase().includes("date");
                              return (
                                <div key={item.id} className={`space-y-2 ${span}`}>
                                  <div className="flex justify-between items-center gap-2">
                                    <label className="text-xs font-bold text-white/80 uppercase">{item.label}</label>
                                    <span className={`text-[10px] font-mono ${counterColor(value.length, item.max)}`}>
                                      {value.length}/{item.max}
                                    </span>
                                  </div>
                                  {item.widget === "textarea" ? (
                                    <textarea
                                      rows={4}
                                      value={value}
                                      onChange={e =>
                                        setCustomTexts(prev => ({
                                          ...prev,
                                          [item.id]: sanitizeLab(item.charset, e.target.value, item.max)
                                        }))
                                      }
                                      className={`${INPUT_CLASS} resize-none min-h-[96px]`}
                                    />
                                  ) : isDateField ? (
                                    <CustomDatePicker
                                      value={value}
                                      onChange={val =>
                                        setCustomTexts(prev => ({
                                          ...prev,
                                          [item.id]: sanitizeLab(item.charset, val, item.max)
                                        }))
                                      }
                                      placeholder="Sélectionner une date"
                                      dateFormat={config.slug === "sumup" ? "english" : config.slug === "mypos" ? "month_first" : item.max && item.max <= 10 ? "slash" : /[a-zA-ZÀ-ÿ]/.test(value) ? "french" : "slash"}
                                    />
                                  ) : (
                                    <input
                                      type="text"
                                      value={value}
                                      onChange={e =>
                                        setCustomTexts(prev => ({
                                          ...prev,
                                          [item.id]: sanitizeLab(item.charset, e.target.value, item.max)
                                        }))
                                      }
                                      className={INPUT_CLASS}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-white/40">Aucun texte supplémentaire dans cette zone — blocs uniquement.</p>
                        )}
                      </>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        ) : null}
        <DocumentActionButtons
          onFillExample={() => {
            const defaults = dynamicDoc?.defaults || config.defaults || {};
            setFormData(defaults);
            if (schema) {
              setCustomTexts(chromeOnly(schema));
              setCustomVisible(schema.visible || {});
            }
            setIsCustomCivilite(false);
            setCustomCivilite("");
            setErrors({});
            toast.success("Formulaire prérempli");
          }}
          onReset={() => {
            const defaults = dynamicDoc?.defaults || config.defaults || {};
            setFormData(emptyFrom(defaults));
            setIsCustomCivilite(false);
            setCustomCivilite("");
            setErrors({});
            toast.info("Formulaire réinitialisé");
          }}
          onPreview={handlePreview}
          isPreviewLoading={isPreviewLoading}
          isGenerating={isGenerating}
          isPreviewBlocked={isBlocked}
          previewAllowed={allowed}
          previewCooldown={cooldown}
          formatCooldownTimer={formatTimer}
          previewLabel="Aperçu Preview Gratuit"
          generateLabel="Générer le RIB"
          price={ribPrice}
          submitType="submit"
        />
      </form>
      {previewUrl ? (
        <RibPreviewViewer
          url={previewUrl}
          title={`Aperçu ${config.title}`}
          onClose={closePreview}
          onAction={() => handleSubmit()}
          isActionLoading={isGenerating}
          actionLabel={`Générer le RIB (${ribPrice.toFixed(2)} €)`}
        />
      ) : null}
    </main>
  );
}

function chromeOnly(schema: EditorSchema) {
  const out: Record<string, string> = {};
  for (const item of schema.fields || []) {
    if (!item.identity) out[item.id] = schema.defaults?.[item.id] ?? "";
  }
  return out;
}
