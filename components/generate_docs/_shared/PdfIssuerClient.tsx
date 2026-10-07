"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  Copy,
  Download,
  Eye,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Wallet
} from "lucide-react";
import { useTelegram } from "@/components/TelegramContext";
import { useToast } from "@/components/NotificationToast";
import CustomDatePicker, { isValidCalendarDate } from "./CustomDatePicker";
import ImmatriculationInput from "./ImmatriculationInput";
import TicketCaisseInput from "./TicketCaisseInput";
import CustomTimePicker from "./CustomTimePicker";
import CountryPicker from "./CountryPicker";
import DocumentPreviewViewer from "./DocumentPreviewViewer";
import { usePreviewCooldown, type PreviewCategory } from "./usePreviewCooldown";

/* ===================================================================== */

export type FormFieldOption = {
  value: string;
  label: string;
  description?: string;
};

export type FormFieldRules = {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  patternError?: string;
  transform?: "uppercase" | "lowercase" | "capitalize" | "digits_only" | "time" | "num_client" | "num_compte" | "jour_capitalized" | "none" | string;
};

export type FormField = {
  key: string;
  label: string;
  kind?: "text" | "textarea" | "select" | "checkbox" | "date" | "time" | "cards" | "country" | "tel" | "contract_axa";
  options?: FormFieldOption[];
  span?: 1 | 2;
  required?: boolean;
  min?: number;
  max?: number;
  rules?: FormFieldRules;
  placeholder?: string;
  dateFormat?: "french" | "slash" | "english" | "month_first" | "dot";
  format?: (val: string) => string;
  advanced?: boolean;
  autocompleteType?: "city" | "address" | "postal_code" | string;
};

export type FormSection = {
  title: string;
  fields: FormField[];
  position?: "before_items" | "after_items";
  advanced?: boolean;
  condition?: { key: string; value: any };
};

export type ItemColumn = {
  key: string;
  label: string;
  kind?: "text" | "select" | "date" | "time";
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  advanced?: boolean;
  span?: 1 | 2;
};

export type CustomBlock = {
  id: string;
  label: string;
  master?: boolean;
  section: string;
};

export type CustomSection = {
  id: string;
  label: string;
};

export type CustomLayout = {
  sections: CustomSection[];
  blocks: CustomBlock[];
  visible?: Record<string, boolean>;
};

export interface PdfIssuerClientProps {
  category: "facture" | "justificatif" | "assurance";
  priceKey?: string;
  apiBase: string;
  onBack?: () => void;
  title: string;
  subtitle?: string;
  logo?: string;
  logoClass?: string;
  headerBg?: string;
  defaults: Record<string, unknown>;
  sections: FormSection[];
  itemKey?: string;
  itemLabel?: string;
  maxItems?: number;
  itemBlank?: Record<string, unknown>;
  itemColumns?: ItemColumn[];
  filename: (data: Record<string, unknown>) => string;
  generateLabel?: string;
  onToggle?: (key: string, value: any, prev: Record<string, any>) => Record<string, any>;
  customLayout?: CustomLayout;
}

type FormValue = Record<string, unknown>;

/* ===================================================================== */

function parseAxaContractNumber(val: unknown): [string, string, string, string] {
  if (!val && val !== "") return ["D443", "4180352981", "4180352981", "367304284920"];
  const str = String(val);
  const tripleSpaceIndex = str.indexOf("   ");
  if (tripleSpaceIndex !== -1) {
    const before = str.slice(0, tripleSpaceIndex);
    const p4 = str.slice(tripleSpaceIndex + 3).trim();
    const hyphenParts = before.split(" - ");
    const p1 = hyphenParts[0] !== undefined ? hyphenParts[0].trim() : "";
    const p2 = hyphenParts[1] !== undefined ? hyphenParts[1].trim() : "";
    const p3 = hyphenParts[2] !== undefined ? hyphenParts[2].trim() : p2;
    return [p1, p2, p3, p4];
  }
  const match = str.match(/^([^-]*?)\s*-\s*([^-]*?)\s*-\s*([^\s]*?)\s+(.*)$/);
  if (match) {
    return [match[1].trim(), match[2].trim(), match[3].trim(), match[4].trim()];
  }
  const hyphenParts = str.split("-").map(p => p.trim());
  if (hyphenParts.length >= 3) {
    const p1 = hyphenParts[0];
    const p2 = hyphenParts[1];
    const rest = hyphenParts.slice(2).join("-").trim().split(/\s+/);
    const p3 = rest[0] || p2;
    const p4 = rest.slice(1).join(" ") || "";
    return [p1, p2, p3, p4];
  }
  return [str, "", "", ""];
}

function parseMoney(value: unknown): number {
  if (typeof value === "number") return isNaN(value) ? 0 : value;
  const str = String(value ?? "").replace("€", "").replace(/\s/g, "").replace(",", ".").trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

function formatMoney(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

function extractTvaRate(raw: unknown): number {
  if (typeof raw !== "string" && typeof raw !== "number") return 20;
  const cleaned = String(raw).replace("%", "").trim();
  const parsed = parseMoney(cleaned);
  return parsed > 0 ? parsed : 20;
}

function computeFactureTotal(rows: Record<string, string>[], data: FormValue): number {
  if (!rows || rows.length === 0) {
    if (data.montant_gaz !== undefined || data.montant_prestations !== undefined) {
      const gaz = parseMoney(data.montant_gaz || 0);
      const prest = parseMoney(data.montant_prestations || 0);
      return Math.max(0, Math.round((gaz + prest) * 100) / 100);
    }
    if (data.montant_ht !== undefined && data.montant_tva !== undefined) {
      const ht = parseMoney(data.montant_ht || 0);
      const tva = parseMoney(data.montant_tva || 0);
      return Math.max(0, Math.round((ht + tva) * 100) / 100);
    }
  }
  let itemsTtc = 0;
  for (const row of rows) {
    const qte = parseMoney(row.qte || row.qty || "1") || 1;
    let unitTtc = 0;
    if (row.net_ht !== undefined && row.net_ht !== "") {
      const net = parseMoney(row.net_ht);
      const tvaRate = parseMoney(row.tva_rate ?? row.tva ?? data.tva_rate ?? data.tva ?? "20");
      itemsTtc += net * (1 + tvaRate / 100);
      continue;
    } else if (row.brut !== undefined) {
      const brut = parseMoney(row.brut || "0");
      const remise = parseMoney(row.remise || "0");
      unitTtc = Math.max(0, brut - remise);
    } else if (row.ht !== undefined && (row.tva !== undefined || data.tva !== undefined)) {
      const ht = parseMoney(row.ht || "0");
      const tvaRate = parseMoney(row.tva ?? data.tva ?? "20");
      unitTtc = ht * (1 + tvaRate / 100);
    } else if (row.pu !== undefined && (row.tva !== undefined || data.tva !== undefined)) {
      const puHt = parseMoney(row.pu || "0");
      const tvaRate = parseMoney(row.tva ?? data.tva ?? "20");
      unitTtc = puHt * (1 + tvaRate / 100);
    } else if (row.pu_ht !== undefined && (row.tva_rate !== undefined || row.tva !== undefined || data.tva_rate !== undefined || data.tva !== undefined)) {
      const puHt = parseMoney(row.pu_ht || "0");
      const tvaRate = parseMoney(row.tva_rate ?? row.tva ?? data.tva_rate ?? data.tva ?? "20");
      unitTtc = puHt * (1 + tvaRate / 100);
    } else if (row.pu_ttc !== undefined) {
      unitTtc = parseMoney(row.pu_ttc || "0");
    } else if (row.montant_ttc !== undefined) {
      unitTtc = parseMoney(row.montant_ttc || "0");
    } else if (row.montant !== undefined) {
      unitTtc = parseMoney(row.montant || "0");
    } else if (row.prix !== undefined) {
      unitTtc = parseMoney(row.prix || "0");
    } else if (row.prix_total !== undefined) {
      unitTtc = parseMoney(row.prix_total || "0");
    } else if (row.total_ttc !== undefined) {
      unitTtc = parseMoney(row.total_ttc || "0");
    }
    itemsTtc += qte * unitTtc;
  }
  const fdp = parseMoney(data.frais_livraison ?? data.frais_port ?? data.livraison ?? data.frais_expedition ?? data.expedition_ttc ?? "0");
  const remise = parseMoney(data.remise_ttc ?? data.remise ?? data.reduction ?? "0");
  const total = itemsTtc + fdp - remise;
  return Math.max(0, Math.round(total * 100) / 100);
}

function detectTotalFieldKey(defaults: FormValue): string | null {
  const candidates = [
    "total_ttc",
    "total",
    "montant_total",
    "montant_ttc",
    "net_a_payer",
    "total_facture",
    "reglement_montant",
    "montant_regle"
  ];
  for (const c of candidates) {
    if (c in defaults) return c;
  }
  return null;
}

function formatTotalValue(num: number, originalSample: string): string {
  const isComma = originalSample.includes(",");
  const hasCurrency = originalSample.includes("€");
  const formatted = num.toFixed(2);
  const localized = isComma ? formatted.replace(".", ",") : formatted;
  return hasCurrency ? `${localized} €` : localized;
}

function asRows(value: unknown): Record<string, any>[] {
  return Array.isArray(value) ? (value as Record<string, any>[]) : [];
}

/* ===================================================================== */

export default function PdfIssuerClient({
  category,
  priceKey,
  apiBase,
  onBack,
  title,
  subtitle,
  logo,
  logoClass,
  headerBg,
  defaults,
  sections,
  itemKey,
  itemLabel = "Articles",
  maxItems = 10,
  itemBlank,
  itemColumns,
  filename,
  generateLabel,
  onToggle,
  customLayout
}: PdfIssuerClientProps) {
  const { user, balance, refreshBalance, initData, haptic } = useTelegram();
  const toast = useToast();

  const [formData, setFormData] = useState<FormValue>(() => ({ ...defaults }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeItemIndex, setActiveItemIndex] = useState<number>(0);
  const [cardDigitsState, setCardDigitsState] = useState<string>("");
  const [isCustomCivilite, setIsCustomCivilite] = useState<boolean>(false);
  const [customCivilite, setCustomCivilite] = useState<string>("");
  const [isAutoTotal, setIsAutoTotal] = useState<boolean>(true);
  const [documentPrice, setDocumentPrice] = useState<number>(1.0);

  const previewUrlRef = useRef<string | null>(null);
  const { cooldown, isBlocked, assertReady, startCooldown, formatTimer } = usePreviewCooldown(
    category as PreviewCategory,
    initData
  );

  const totalKey = useMemo(() => detectTotalFieldKey(defaults), [defaults]);
  const rows = useMemo(() => (itemKey ? asRows(formData[itemKey]) : []), [formData, itemKey]);

  useEffect(() => {
    async function loadPrice() {
      try {
        const headers: Record<string, string> = {};
        if (initData) headers["x-telegram-init-data"] = initData;
        const res = await fetch("/api/proxy/generate-docs/config", { headers });
        if (res.ok) {
          const cfg = await res.json();
          const targetKey = priceKey || title.toLowerCase();
          if (cfg.prices && cfg.prices[targetKey]) {
            setDocumentPrice(Number(cfg.prices[targetKey]));
          }
        }
      } catch {}
    }
    loadPrice();
  }, [priceKey, title, initData]);

  const setField = (key: string, value: unknown) => {
    if (key === totalKey) {
      setIsAutoTotal(false);
    }
    setFormData(prev => {
      let nextData: FormValue = { ...prev, [key]: value };
      if (onToggle) {
        const toggled = onToggle(key, value, prev);
        if (toggled !== prev) nextData = toggled;
      }
      return nextData;
    });
    if (errors[key]) {
      setErrors(prev => {
        const n = { ...prev };
        delete n[key];
        return n;
      });
    }
  };

  const setItemField = (index: number, key: string, value: unknown) => {
    if (!itemKey) return;
    setFormData(prev => {
      const currentRows = [...asRows(prev[itemKey])];
      if (!currentRows[index]) return prev;
      const updatedRow = { ...currentRows[index], [key]: value };

      if ((key === "pu_ht" || key === "pu" || key === "ht") && ("pu_ttc" in updatedRow || "total_ttc" in updatedRow)) {
        const htNum = parseMoney(value);
        const tvaRate = extractTvaRate(updatedRow.tva_rate ?? updatedRow.tva ?? prev.tva_rate ?? prev.tva ?? "20");
        const ttcNum = Math.round(htNum * (1 + tvaRate / 100) * 100) / 100;
        if ("pu_ttc" in updatedRow) updatedRow.pu_ttc = formatMoney(ttcNum);
        const qVal = parseMoney(updatedRow.qty || updatedRow.qte || "1") || 1;
        if ("total_ttc" in updatedRow) updatedRow.total_ttc = formatMoney(qVal * ttcNum);
      } else if (key === "pu_ttc" && ("total_ttc" in updatedRow)) {
        const ttcNum = parseMoney(value);
        const qVal = parseMoney(updatedRow.qty || updatedRow.qte || "1") || 1;
        updatedRow.total_ttc = formatMoney(qVal * ttcNum);
      }

      currentRows[index] = updatedRow;
      if (totalKey && isAutoTotal) {
        const computed = computeFactureTotal(currentRows, prev);
        return {
          ...prev,
          [itemKey]: currentRows,
          [totalKey]: formatTotalValue(computed, String(prev[totalKey] ?? ""))
        };
      }
      return { ...prev, [itemKey]: currentRows };
    });
  };

  const addRow = () => {
    if (!itemKey || rows.length >= maxItems) return;
    const blank = itemBlank ? { ...itemBlank } : { description: "", montant: "0,00" };
    setFormData(prev => {
      const next = [...asRows(prev[itemKey]), blank];
      if (totalKey && isAutoTotal) {
        const computed = computeFactureTotal(next, prev);
        return {
          ...prev,
          [itemKey]: next,
          [totalKey]: formatTotalValue(computed, String(prev[totalKey] ?? ""))
        };
      }
      return { ...prev, [itemKey]: next };
    });
    setActiveItemIndex(rows.length);
  };

  const removeRow = (index: number) => {
    if (!itemKey || rows.length <= 1) return;
    setFormData(prev => {
      const next = asRows(prev[itemKey]).filter((_, i) => i !== index);
      if (totalKey && isAutoTotal) {
        const computed = computeFactureTotal(next, prev);
        return {
          ...prev,
          [itemKey]: next,
          [totalKey]: formatTotalValue(computed, String(prev[totalKey] ?? ""))
        };
      }
      return { ...prev, [itemKey]: next };
    });
    setActiveItemIndex(Math.max(0, index - 1));
  };

  const duplicateRow = (index: number) => {
    if (!itemKey || rows.length >= maxItems) return;
    setFormData(prev => {
      const cur = asRows(prev[itemKey]);
      const copy = { ...cur[index] };
      const next = [...cur.slice(0, index + 1), copy, ...cur.slice(index + 1)];
      if (totalKey && isAutoTotal) {
        const computed = computeFactureTotal(next, prev);
        return {
          ...prev,
          [itemKey]: next,
          [totalKey]: formatTotalValue(computed, String(prev[totalKey] ?? ""))
        };
      }
      return { ...prev, [itemKey]: next };
    });
    setActiveItemIndex(index + 1);
  };

  const validateAll = (): boolean => {
    const nextErrors: Record<string, string> = {};
    for (const section of sections) {
      for (const field of section.fields) {
        const val = formData[field.key];
        const str = String(val ?? "").trim();
        if (field.required && !str) {
          nextErrors[field.key] = "Ce champ est obligatoire.";
        }
        if (field.kind === "date" && str) {
          const check = isValidCalendarDate(str);
          if (!check.valid) {
            nextErrors[field.key] = check.message || "Date invalide.";
          }
        }
        if (field.key === "immatriculation" && str) {
          const isValid = /^([A-Z]{2}-[0-9]{3}-[A-Z]{2}|[0-9]{1,4}-[A-Z]{1,3}-(?:[0-9]{1,3}|2[AB])|[A-Z0-9]{1,4}-[A-Z0-9]{1,4}-[A-Z0-9]{1,4})$/.test(str);
          if (!isValid && str.length < 7) {
            nextErrors[field.key] = "Format d'immatriculation incorrect.";
          }
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
      toast.error("Veuillez corriger les champs requis.");
      return;
    }
    haptic("impact");
    setIsPreviewLoading(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (initData) headers["x-telegram-init-data"] = initData;

      const targetEndpoint = apiBase.startsWith("/api/proxy") ? `${apiBase}/preview` : `/api/proxy${apiBase.replace(/^\/api/, "")}/preview`;
      const res = await fetch(targetEndpoint, {
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
      const objUrl = URL.createObjectURL(blob);
      previewUrlRef.current = objUrl;
      setPreviewUrl(objUrl);
      startCooldown();
      toast.success("Aperçu généré avec succès !");
    } catch (err: any) {
      toast.error(err.message || "Impossible de générer l'aperçu");
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
      toast.error(`Solde insuffisant (${balance.toFixed(2)} € / ${documentPrice.toFixed(2)} € requis)`);
      return;
    }
    haptic("impact");
    setIsGenerating(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (initData) headers["x-telegram-init-data"] = initData;

      const targetEndpoint = apiBase.startsWith("/api/proxy") ? `${apiBase}/generate` : `/api/proxy${apiBase.replace(/^\/api/, "")}/generate`;
      const res = await fetch(targetEndpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || "Erreur de génération");
      }
      const blob = await res.blob();
      downloadBlob(blob, filename(formData));
      await refreshBalance();
      toast.success("Document PDF téléchargé !");
    } catch (err: any) {
      toast.error(err.message || "Échec de génération du document");
    } finally {
      setIsGenerating(false);
    }
  };

  const renderFieldInput = (field: FormField) => {
    const value = formData[field.key];
    const strVal = String(value ?? "");
    const hasErr = Boolean(errors[field.key]);

    if (field.kind === "checkbox") {
      const on = Boolean(value);
      return (
        <button
          type="button"
          onClick={() => setField(field.key, !on)}
          className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors ${
            on ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/5 text-white/40 border border-white/10"
          }`}
        >
          {on ? "Oui" : "Non"}
        </button>
      );
    }

    if (field.kind === "date") {
      return (
        <div className="space-y-1">
          <CustomDatePicker
            value={strVal}
            onChange={val => setField(field.key, val)}
            hasError={hasErr}
            placeholder={field.placeholder}
            dateFormat={field.dateFormat || "slash"}
          />
          {hasErr && <p className="text-[10px] text-rose-400 font-bold">{errors[field.key]}</p>}
        </div>
      );
    }

    if (field.kind === "time") {
      return (
        <div className="space-y-1">
          <CustomTimePicker
            value={strVal}
            onChange={val => setField(field.key, val)}
            hasError={hasErr}
          />
          {hasErr && <p className="text-[10px] text-rose-400 font-bold">{errors[field.key]}</p>}
        </div>
      );
    }

    if (field.kind === "country") {
      return (
        <div className="space-y-1">
          <CountryPicker
            value={strVal}
            onChange={val => setField(field.key, val)}
            hasError={hasErr}
            placeholder={field.placeholder}
          />
          {hasErr && <p className="text-[10px] text-rose-400 font-bold">{errors[field.key]}</p>}
        </div>
      );
    }

    if (field.key === "immatriculation" || field.key === "vehicule_immat") {
      return (
        <div className="space-y-1">
          <ImmatriculationInput
            value={strVal}
            onChange={val => setField(field.key, val)}
            hasError={hasErr}
            placeholder={field.placeholder || "FA-120-GM"}
          />
          {hasErr && <p className="text-[10px] text-rose-400 font-bold">{errors[field.key]}</p>}
        </div>
      );
    }

    if (field.key === "ticket_ref" || field.key === "num_ticket") {
      return (
        <div className="space-y-1">
          <TicketCaisseInput
            value={strVal}
            onChange={val => setField(field.key, val)}
            hasError={hasErr}
          />
          {hasErr && <p className="text-[10px] text-rose-400 font-bold">{errors[field.key]}</p>}
        </div>
      );
    }

    if (field.kind === "contract_axa" || (field.key === "num_contrat" && category === "assurance")) {
      const [p1, p2, p3, p4] = parseAxaContractNumber(strVal);
      const updateAxa = (np1: string, np2: string, np3: string, np4: string) => {
        setField(field.key, `${np1} - ${np2} - ${np3}   ${np4}`);
      };
      return (
        <div className="space-y-1">
          <div className="grid grid-cols-4 gap-1">
            <input
              type="text"
              value={p1}
              onChange={e => updateAxa(e.target.value.toUpperCase(), p2, p3, p4)}
              className="bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-center text-xs font-mono font-bold text-white outline-none focus:border-primary"
              placeholder="D443"
            />
            <input
              type="text"
              value={p2}
              onChange={e => updateAxa(p1, e.target.value, e.target.value, p4)}
              className="bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-center text-xs font-mono font-bold text-white outline-none focus:border-primary"
              placeholder="4180352981"
            />
            <input
              type="text"
              value={p3}
              onChange={e => updateAxa(p1, p2, e.target.value, p4)}
              className="bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-center text-xs font-mono font-bold text-white outline-none focus:border-primary"
              placeholder="4180352981"
            />
            <input
              type="text"
              value={p4}
              onChange={e => updateAxa(p1, p2, p3, e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-center text-xs font-mono font-bold text-white outline-none focus:border-primary"
              placeholder="367304284920"
            />
          </div>
          {hasErr && <p className="text-[10px] text-rose-400 font-bold">{errors[field.key]}</p>}
        </div>
      );
    }

    if (field.kind === "select") {
      return (
        <div className="space-y-1">
          <div className="relative flex items-center">
            <select
              value={strVal}
              onChange={e => setField(field.key, e.target.value)}
              className={`w-full bg-white/5 border ${
                hasErr ? "border-rose-500/80 focus:border-rose-500" : "border-white/10 focus:border-primary"
              } rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-colors appearance-none cursor-pointer pr-9`}
            >
              {(field.options || []).map(option => (
                <option key={option.value} value={option.value} className="bg-slate-900 text-white">
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 pointer-events-none text-white/40" />
          </div>
          {hasErr && <p className="text-[10px] text-rose-400 font-bold">{errors[field.key]}</p>}
        </div>
      );
    }

    if (field.kind === "textarea") {
      return (
        <div className="space-y-1">
          <textarea
            value={strVal}
            onChange={e => setField(field.key, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className={`w-full bg-white/5 border ${
              hasErr ? "border-rose-500/80 focus:border-rose-500" : "border-white/10 focus:border-primary"
            } rounded-xl p-3 text-xs text-white outline-none resize-none transition-colors`}
          />
          {hasErr && <p className="text-[10px] text-rose-400 font-bold">{errors[field.key]}</p>}
        </div>
      );
    }

    return (
      <div className="space-y-1">
        <input
          type={field.kind === "tel" ? "tel" : "text"}
          value={strVal}
          onChange={e => setField(field.key, e.target.value)}
          placeholder={field.placeholder}
          className={`w-full bg-white/5 border ${
            hasErr ? "border-rose-500/80 focus:border-rose-500" : "border-white/10 focus:border-primary"
          } rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-colors`}
        />
        {hasErr && <p className="text-[10px] text-rose-400 font-bold">{errors[field.key]}</p>}
      </div>
    );
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
          <span>Retour</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-xl">
            {documentPrice.toFixed(2).replace(".", ",")} €
          </span>
        </div>
      </div>

      <div className={`p-4 rounded-2xl border ${headerBg || "bg-[#0f121d]/90 border-white/[0.08]"} flex items-center gap-3.5 shadow-sm`}>
        {logo && (
          <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 p-1.5 flex items-center justify-center shrink-0 overflow-hidden">
            <img src={logo} alt="" className={logoClass || "max-h-full max-w-full object-contain"} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-black italic text-white uppercase tracking-tight truncate">{title}</h2>
          {subtitle && <p className="text-[10px] text-white/50 font-medium truncate">{subtitle}</p>}
        </div>
      </div>

      <div className="space-y-4">
        {sections.map((section, sIdx) => (
          <div key={section.title || sIdx} className="bg-[#0f121d]/80 border border-white/[0.06] rounded-2xl p-3.5 space-y-3">
            <h3 className="text-xs font-black italic text-white/90 uppercase tracking-wider flex items-center gap-2 border-b border-white/[0.04] pb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {section.title}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {section.fields.map(field => (
                <div key={field.key} className={field.span === 2 ? "sm:col-span-2 space-y-1" : "space-y-1"}>
                  <label className="text-[11px] font-bold text-white/60 uppercase tracking-wide flex items-center justify-between">
                    <span>{field.label}</span>
                    {field.required && <span className="text-primary text-[10px]">*</span>}
                  </label>
                  {renderFieldInput(field)}
                </div>
              ))}
            </div>
          </div>
        ))}

        {itemKey && rows.length > 0 && (
          <div className="bg-[#0f121d]/80 border border-white/[0.06] rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
              <h3 className="text-xs font-black italic text-white/90 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                {itemLabel} ({rows.length}/{maxItems})
              </h3>
              {rows.length < maxItems && (
                <button
                  type="button"
                  onClick={addRow}
                  className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg active:scale-95"
                >
                  <Plus size={12} />
                  <span>Ajouter</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {rows.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveItemIndex(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-colors ${
                    activeItemIndex === idx
                      ? "bg-primary text-slate-950 shadow-md shadow-primary/20"
                      : "bg-white/5 text-white/60 border border-white/5 hover:border-white/10"
                  }`}
                >
                  Ligne {idx + 1}
                </button>
              ))}
            </div>

            {rows[activeItemIndex] && (
              <div className="bg-black/30 border border-white/5 rounded-xl p-3 space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider">
                    Édition Ligne #{activeItemIndex + 1}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {rows.length < maxItems && (
                      <button
                        type="button"
                        onClick={() => duplicateRow(activeItemIndex)}
                        className="p-1.5 rounded-lg bg-white/5 text-white/60 hover:text-white border border-white/5"
                        title="Dupliquer"
                      >
                        <Copy size={13} />
                      </button>
                    )}
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(activeItemIndex)}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20"
                        title="Supprimer"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {((itemColumns || Object.keys(rows[activeItemIndex]).map(k => ({ key: k, label: k }))) as ItemColumn[]).map(col => {
                    const rowVal = rows[activeItemIndex][col.key] ?? "";
                    return (
                      <div key={col.key} className={col.span === 2 ? "sm:col-span-2 space-y-1" : "space-y-1"}>
                        <label className="text-[10px] font-bold text-white/50 uppercase tracking-wide">
                          {col.label}
                        </label>
                        <input
                          type="text"
                          value={String(rowVal)}
                          onChange={e => setItemField(activeItemIndex, col.key, e.target.value)}
                          placeholder={col.placeholder}
                          className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl px-3 py-2 text-xs text-white outline-none"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
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
            <span>{generateLabel || `Générer (${documentPrice.toFixed(2).replace(".", ",")} €)`}</span>
          </button>
        </div>
      </div>

      {previewUrl && (
        <DocumentPreviewViewer
          url={previewUrl}
          title={title}
          onClose={() => setPreviewUrl(null)}
          onAction={handleGenerate}
          actionLabel={`Acheter (${documentPrice.toFixed(2).replace(".", ",")} €)`}
          isActionLoading={isGenerating}
        />
      )}
    </div>
  );
}
