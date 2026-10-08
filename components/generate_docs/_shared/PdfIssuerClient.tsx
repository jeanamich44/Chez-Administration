"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Eye,
  LayoutTemplate,
  MapPin,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import CustomDatePicker, { isValidCalendarDate } from "@/components/generate_docs/_shared/CustomDatePicker";
import ImmatriculationInput from "@/components/generate_docs/_shared/ImmatriculationInput";
import TicketCaisseInput from "@/components/generate_docs/_shared/TicketCaisseInput";
import CustomTimePicker from "@/components/generate_docs/_shared/CustomTimePicker";
import CountryPicker from "@/components/generate_docs/_shared/CountryPicker";
import DocumentPreviewViewer from "@/components/generate_docs/_shared/DocumentPreviewViewer";
import {
  fetchGenerateDocsConfig,
  usePreviewCooldown,
  type PreviewCategory
} from "@/components/generate_docs/_shared/usePreviewCooldown";
import { getAuthHeaders } from "@/components/generate_docs/_shared/telegramAuth";

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

type FormValue = Record<string, unknown>;

function Switch({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className="flex items-center justify-between gap-3 w-full text-left cursor-pointer"
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


function normalizeJourValue(val: string): string {
  const s = val.toLowerCase().replace(/[^a-z]/g, "");
  if (s.startsWith("lun")) return "Lundi";
  if (s.startsWith("mar")) return "Mardi";
  if (s.startsWith("mer")) return "Mercredi";
  if (s.startsWith("jeu")) return "Jeudi";
  if (s.startsWith("ven")) return "Vendredi";
  if (s.startsWith("sam")) return "Samedi";
  if (s.startsWith("dim")) return "Dimanche";
  return val;
}

function formatNumClient(val: string): string {
  const digits = val.replace(/\D/g, "");
  if (!digits) return "";
  const chunks: string[] = [];
  chunks.push(digits.slice(0, 1));
  let idx = 1;
  while (idx < digits.length) {
    chunks.push(digits.slice(idx, idx + 3));
    idx += 3;
  }
  return chunks.join(" ");
}

function formatNumCompte(val: string): string {
  const digits = val.replace(/\D/g, "");
  if (!digits) return "";
  const parts: string[] = [];
  const cuts = [1, 2, 1, 3, 1, 2, 3];
  let idx = 0;
  for (const cut of cuts) {
    if (idx >= digits.length) break;
    parts.push(digits.slice(idx, idx + cut));
    idx += cut;
  }
  if (idx < digits.length) {
    parts.push(digits.slice(idx));
  }
  return parts.join(" ");
}

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

function formatMoneyEur(value: number): string {
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
    } else if (row.pu_ttc !== undefined) {
      unitTtc = parseMoney(row.pu_ttc);
    } else if (row.prix !== undefined) {
      unitTtc = parseMoney(row.prix);
    } else if (row.unit_price !== undefined) {
      unitTtc = parseMoney(row.unit_price);
    } else if (row.montant !== undefined) {
      unitTtc = parseMoney(row.montant);
    } else if (row.montant_ttc !== undefined) {
      unitTtc = parseMoney(row.montant_ttc);
    } else if (row.pu !== undefined) {
      unitTtc = parseMoney(row.pu);
    } else if (row.total_ttc !== undefined) {
      unitTtc = parseMoney(row.total_ttc);
    } else if (row.total !== undefined) {
      unitTtc = parseMoney(row.total);
    }
    const ecopart = parseMoney(row.ecopart || "0");
    itemsTtc += qte * unitTtc + ecopart;
  }
  const extraLine = parseMoney(data.extra_line_total || data.extra_line_pu_ttc || 0);
  const currentTva = extractTvaRate(data.tva_rate ?? data.tva ?? "20");
  const multiplier = 1 + currentTva / 100;
  const expTtc = parseMoney(
    data.expedition_ttc ||
    data.frais_port_ttc ||
    data.port_ttc ||
    data.frais_port ||
    data.port ||
    data.frais ||
    data.tot_livraison ||
    (data.expedition_ht ? parseMoney(data.expedition_ht) * multiplier : 0) ||
    0
  );
  const remTtc = parseMoney(
    data.remise_ttc ||
    data.remise_globale ||
    data.remise ||
    (data.remise_ht ? parseMoney(data.remise_ht) * multiplier : 0) ||
    0
  );
  return Math.max(0, Math.round((itemsTtc + extraLine + expTtc - Math.abs(remTtc)) * 100) / 100);
}

function isMoneyKey(key: string): boolean {
  if (!key) return false;
  const k = key.toLowerCase();
  if (
    k.endsWith("_code") ||
    k.endsWith("_mode") ||
    k.endsWith("_date") ||
    k.endsWith("_time") ||
    k.endsWith("_nom") ||
    k.endsWith("_ref")
  ) {
    return false;
  }
  return (
    k === "total" ||
    k === "montant" ||
    k === "prix" ||
    k === "unit_price" ||
    k === "pu" ||
    k === "pu_ttc" ||
    k === "pu_ht" ||
    k === "pu_brut_ht" ||
    k === "ht" ||
    k === "net_ht" ||
    k === "brut" ||
    k === "sous_total" ||
    k === "monnaie" ||
    k === "rendu_amount" ||
    k === "payment_amount" ||
    k === "reglement_montant" ||
    k === "extra_line_total" ||
    k.startsWith("total_") ||
    k.startsWith("tot_") ||
    k.startsWith("montant_") ||
    k.startsWith("net_a_payer_") ||
    k.startsWith("solde_") ||
    k.startsWith("eco_") ||
    k === "ecopart" ||
    k === "dont_ecopart" ||
    k === "frais" ||
    k === "port" ||
    k.startsWith("frais_") ||
    k.startsWith("port_") ||
    k.startsWith("expedition_") ||
    k.startsWith("remise_") ||
    k === "remise" ||
    k === "tva" ||
    k === "vat" ||
    k === "dont_tva" ||
    k.startsWith("tva_") ||
    k === "taux_tva"
  );
}

function isQtyKey(key: string): boolean {
  if (!key) return false;
  const k = key.toLowerCase();
  return k === "qty" || k === "qte" || k === "quantite";
}

function formatColumnLabel(label: string): string {
  if (!label) return label;
  const trimmed = label.trim();
  if (trimmed === "P.U. TTC" || trimmed === "PU TTC" || trimmed === "P.U." || trimmed === "PU" || trimmed === "P.U TTC") {
    return "Prix unitaire TTC";
  }
  return label;
}

function sanitizeMoneyInput(raw: string): string {
  let s = raw.replace(/[^\d.,-]/g, "");
  const isNegative = s.startsWith("-");
  s = s.replace(/-/g, "");
  if (isNegative) s = "-" + s;

  let separatorFound = false;
  let result = "";
  for (let i = 0; i < s.length; i++) {
    const char = s[i];
    if (char === "," || char === ".") {
      if (!separatorFound) {
        result += char;
        separatorFound = true;
      }
    } else {
      result += char;
    }
  }
  return result;
}

function sanitizeQtyInput(raw: string): string {
  return raw.replace(/[^\d.,]/g, "");
}

function cleanEmailPart(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function buildDynamicEmail(nom: string, prenom: string): string {
  const cleanNom = cleanEmailPart(nom);
  const cleanPrenom = cleanEmailPart(prenom);
  if (cleanNom && cleanPrenom) {
    return `${cleanNom}.${cleanPrenom}@gmail.com`;
  }
  if (cleanNom) {
    return `${cleanNom}@gmail.com`;
  }
  if (cleanPrenom) {
    return `${cleanPrenom}@gmail.com`;
  }
  return "martin.lucas@gmail.com";
}

function isClientEmailKey(key: string): boolean {
  if (!key) return false;
  const k = key.toLowerCase();
  if (
    k.includes("service") ||
    k.includes("boutique") ||
    k.includes("contact") ||
    k.includes("support") ||
    k.includes("sinistre") ||
    k.includes("agence") ||
    k.includes("banque")
  ) {
    return false;
  }
  return k === "client_email" || k === "facturation_email" || k === "livraison_email" || k === "email";
}

function cleanFormData(data: FormValue): FormValue {
  if (!data || typeof data !== "object") return data;
  const cleaned: FormValue = {};
  for (const [key, val] of Object.entries(data)) {
    if (typeof val === "string") {
      if (isMoneyKey(key)) {
        cleaned[key] = val.replace(/€/g, "").trim();
      } else if (isClientEmailKey(key)) {
        const current = val.trim();
        if (
          !current ||
          current === "martin.lucas@email.fr" ||
          current === "lucas.martin@email.fr" ||
          current === "Untel@gmail.com" ||
          current === "lucas.martin@gmail.com"
        ) {
          let refNom = String(data.nom || "");
          let refPrenom = String(data.prenom || "");
          if (!refNom && !refPrenom && typeof data.client_name === "string") {
            const parts = data.client_name.trim().split(/\s+/);
            refNom = parts.slice(1).join(" ") || parts[0] || "";
            refPrenom = parts.length > 1 ? parts[0] : "";
          }
          if (key === "livraison_email" && (data.livraison_nom || data.livraison_prenom)) {
            cleaned[key] = buildDynamicEmail(String(data.livraison_nom || refNom), String(data.livraison_prenom || refPrenom));
          } else if (key === "facturation_email" && (data.facturation_nom || data.facturation_prenom)) {
            cleaned[key] = buildDynamicEmail(String(data.facturation_nom || refNom), String(data.facturation_prenom || refPrenom));
          } else {
            cleaned[key] = buildDynamicEmail(refNom, refPrenom);
          }
        } else {
          cleaned[key] = current;
        }
      } else {
        cleaned[key] = val;
      }
    } else if (Array.isArray(val)) {
      cleaned[key] = val.map(row => {
        if (row && typeof row === "object") {
          const cleanedRow: Record<string, any> = {};
          for (const [rKey, rVal] of Object.entries(row)) {
            if (typeof rVal === "string" && isMoneyKey(rKey)) {
              cleanedRow[rKey] = rVal.replace(/€/g, "").trim();
            } else {
              cleanedRow[rKey] = rVal;
            }
          }
          return cleanedRow;
        }
        return row;
      });
    } else {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

function formatTotalValue(amount: number, _sample?: string): string {
  return amount.toFixed(2).replace(".", ",");
}

function syncCompanionTotals(data: FormValue, totalAmount: number): void {
  const sample = String(data.total_ttc ?? data.total ?? data.tot_total ?? data.montant_ttc ?? "");
  const currentTva = extractTvaRate(data.tva_rate ?? data.tva ?? "20");
  const multiplier = 1 + currentTva / 100;
  const ht = Math.round((totalAmount / multiplier) * 100) / 100;
  const vat = Math.round((totalAmount - ht) * 100) / 100;
  if ("total_ht" in data) data.total_ht = formatTotalValue(ht, sample);
  if ("total_tva" in data) data.total_tva = formatTotalValue(vat, sample);
  if ("tva_amount" in data) data.tva_amount = formatTotalValue(vat, sample);
  if ("tva_base_ht" in data) data.tva_base_ht = formatTotalValue(ht, sample);
  if ("tva_montant" in data) data.tva_montant = formatTotalValue(vat, sample);
  if ("dont_tva" in data) data.dont_tva = formatTotalValue(vat, sample);
  if ("tot_sous_total" in data) data.tot_sous_total = formatTotalValue(ht, sample);
  if ("tot_tva" in data) data.tot_tva = formatTotalValue(vat, sample);
  if ("montant_ht" in data && "montant_tva" in data) {
    data.montant_ht = formatTotalValue(ht, sample);
    data.montant_tva = formatTotalValue(vat, sample);
  }
  if ("reglement_montant" in data) {
    data.reglement_montant = formatTotalValue(totalAmount, sample);
  }
  if ("total_facture" in data) {
    data.total_facture = formatTotalValue(totalAmount, sample);
  }
  if ("total_facture_ht" in data) {
    data.total_facture_ht = formatTotalValue(ht, sample);
  }
  if ("total_facture_ttc" in data) {
    data.total_facture_ttc = formatTotalValue(totalAmount, sample);
  }
  if ("net_a_payer_ht" in data) {
    data.net_a_payer_ht = formatTotalValue(ht, sample);
  }
  if ("net_a_payer_ttc" in data) {
    data.net_a_payer_ttc = formatTotalValue(totalAmount, sample);
  }
  if ("payment_amount" in data) {
    const isCash = String(data.payment_method || "").toLowerCase().includes("cash") || String(data.payment_method || "").toLowerCase().includes("esp");
    if (!isCash) {
      data.payment_amount = formatTotalValue(totalAmount, sample);
      if ("rendu_amount" in data) data.rendu_amount = "";
    } else {
      const currentPay = parseMoney(data.payment_amount);
      if (currentPay < totalAmount) {
        data.payment_amount = formatTotalValue(totalAmount, sample);
        if ("rendu_amount" in data) data.rendu_amount = "0,00";
      } else if ("rendu_amount" in data) {
        data.rendu_amount = formatTotalValue(Math.max(0, currentPay - totalAmount), sample);
      }
    }
  }
}

function randomizeSuffix(value: string, key?: string): string {
  const str = String(value || "").trim();
  const fallback = key === "barcode" ? "5045556761666" : "80089081003";
  const base = str || fallback;

  const hasLetters = /[a-zA-Z]/.test(base);
  const hasDigits = /\d/.test(base);

  if (!hasLetters && hasDigits) {
    const chars = base.split("");
    const digitIndices: number[] = [];
    for (let i = 0; i < chars.length; i++) {
      if (/\d/.test(chars[i])) digitIndices.push(i);
    }
    const replaceCount = Math.min(5 + Math.floor(Math.random() * 2), Math.max(1, digitIndices.length - 1));
    const targetIndices = digitIndices.slice(digitIndices.length - replaceCount);
    for (const idx of targetIndices) {
      chars[idx] = Math.floor(Math.random() * 10).toString();
    }
    let result = chars.join("");
    if (key === "barcode" && result.length === 13 && /^\d+$/.test(result)) {
      const raw12 = result.slice(0, 12);
      let sum = 0;
      for (let i = 0; i < 12; i++) {
        sum += parseInt(raw12[i], 10) * (i % 2 === 0 ? 1 : 3);
      }
      const check = (10 - (sum % 10)) % 10;
      result = raw12 + check.toString();
    }
    return result;
  }

  const replaceLen = 5 + Math.floor(Math.random() * 2);
  const len = Math.min(replaceLen, Math.max(1, base.length - 2));
  const prefix = base.slice(0, base.length - len);
  const suffix = base.slice(base.length - len);

  const upperChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowerChars = "abcdefghijklmnopqrstuvwxyz";

  let newSuffix = "";
  for (let i = 0; i < suffix.length; i++) {
    const ch = suffix[i];
    if (/\d/.test(ch)) {
      newSuffix += Math.floor(Math.random() * 10).toString();
    } else if (/[A-Z]/.test(ch)) {
      newSuffix += upperChars.charAt(Math.floor(Math.random() * upperChars.length));
    } else if (/[a-z]/.test(ch)) {
      newSuffix += lowerChars.charAt(Math.floor(Math.random() * lowerChars.length));
    } else {
      newSuffix += ch;
    }
  }

  return prefix + newSuffix;
}

function generateRandomPhoneNumber(currentVal?: string, key?: string): string {
  const k = (key || "").toLowerCase();
  const digits = (currentVal || "").replace(/\D/g, "");
  let prefix = Math.random() < 0.5 ? "06" : "07";
  if (
    k.includes("store") ||
    k.includes("magasin") ||
    k.includes("societe") ||
    k.includes("pro") ||
    k.includes("fixe") ||
    k.includes("agence") ||
    /^(01|02|03|04|05|09)/.test(digits)
  ) {
    if (/^(01|02|03|04|05|09)/.test(digits)) {
      prefix = digits.slice(0, 2);
    } else {
      const fixedPrefixes = ["01", "02", "03", "04", "05"];
      prefix = fixedPrefixes[Math.floor(Math.random() * fixedPrefixes.length)];
    }
  }
  const rest = Array.from({ length: 4 }, () =>
    Math.floor(Math.random() * 90 + 10).toString()
  );
  if (currentVal && currentVal.includes(".")) {
    return `${prefix}.${rest.join(".")}`;
  }
  if (currentVal && currentVal.includes(" ")) {
    return `${prefix} ${rest.join(" ")}`;
  }
  return `${prefix}${rest.join("")}`;
}

function generatePatternValue(currentVal?: string, key?: string, _priceKey?: string): string {
  const str = String(currentVal || "").trim();
  const k = (key || "").toLowerCase();

  if (k === "num_client") {
    const digitsOnly = str.replace(/\D/g, "");
    if ((_priceKey === "attestation_edf" || str.startsWith("6") || digitsOnly.startsWith("6")) && !str.startsWith("TI")) {
      const p1 = Math.floor(Math.random() * 900 + 100).toString();
      const p2 = Math.floor(Math.random() * 900 + 100).toString();
      return `6 013 ${p1} ${p2}`;
    }
    if ((_priceKey === "gaz" || str.startsWith("319375")) && digitsOnly.length === 9) {
      const p = Math.floor(Math.random() * 900 + 100).toString();
      return `319375${p}`;
    }
  }

  if (k === "num_compte") {
    const digitsOnly = str.replace(/\D/g, "");
    if (_priceKey === "attestation_edf" || str.startsWith("4") || digitsOnly.startsWith("4") || digitsOnly.length === 13 || /4\s*02/i.test(str)) {
      const p1 = Math.floor(Math.random() * 90 + 10).toString();
      const p2 = Math.floor(Math.random() * 900 + 100).toString();
      return `4 02 4 024 8 ${p1} ${p2}`;
    }
  }

  if (k === "pdl" || (k.includes("pdl") && str.replace(/\D/g, "").length === 14)) {
    const digitsOnly = str.replace(/\D/g, "");
    const prefix = digitsOnly.slice(0, 8) || "07334145";
    const randSuffix = Math.floor(Math.random() * 900000 + 100000).toString();
    return `${prefix}${randSuffix}`;
  }

  if (/^\d{3}-\d{7}-\d{7}$/.test(str) || (_priceKey === "amazon" && /^\d+-\d+-\d+$/.test(str))) {
    const p1 = Math.floor(Math.random() * 900 + 100).toString();
    const p2 = Math.floor(Math.random() * 9000000 + 1000000).toString();
    const p3 = Math.floor(Math.random() * 9000000 + 1000000).toString();
    return `${p1}-${p2}-${p3}`;
  }

  const amazonInvMatch = str.match(/^(DS-ASE-INV-FR-\d{4}-)\d+$/);
  if (amazonInvMatch) {
    const randDigits = Math.floor(Math.random() * 900000000 + 100000000).toString();
    return `${amazonInvMatch[1]}${randDigits}`;
  }

  if (/^C\d{11}$/i.test(str)) {
    const digits = Math.floor(Math.random() * 9000000000 + 1000000000).toString();
    return `C01${digits.slice(0, 9)}`;
  }

  if (/^FR\d{10}$/i.test(str)) {
    const digits = Math.floor(Math.random() * 90000000 + 10000000).toString();
    return `FR10${digits}`;
  }

  if (/^AFR\d{8}$/i.test(str)) {
    const digits = Math.floor(Math.random() * 90000000 + 10000000).toString();
    return `AFR${digits}`;
  }

  if (/^FRADIN\d{10}$/i.test(str)) {
    const digits = Math.floor(Math.random() * 9000000 + 1000000).toString();
    return `FRADIN000${digits}`;
  }

  if (/^TI\d{10}$/i.test(str)) {
    const digits = Math.floor(Math.random() * 9000000 + 1000000).toString();
    return `TI000${digits}`;
  }

  if (/^MOT\d{9}$/i.test(str)) {
    const digits = Math.floor(Math.random() * 9000000 + 1000000).toString();
    return `MOT00${digits}`;
  }

  const slashEndingMatch = str.match(/^([A-Z0-9\s-]+\/)(\d{2,4})$/);
  if (slashEndingMatch) {
    const numDigits = slashEndingMatch[2].length;
    const min = Math.pow(10, numDigits - 1);
    const max = Math.pow(10, numDigits) - 1;
    const digits = Math.floor(Math.random() * (max - min) + min).toString();
    return `${slashEndingMatch[1]}${digits}`;
  }

  if (k === "asin" || (/^[B0-9][A-Z0-9]{9}$/.test(str) && k.includes("asin"))) {
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let res = "B0";
    for (let i = 2; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  }

  if (k === "barcode" || k === "ean" || (/^\d{13}$/.test(str) && (k.includes("barcode") || k.includes("ean")))) {
    let raw12 = "";
    if (/^\d{13}$/.test(str)) {
      raw12 = str.slice(0, 7);
      for (let i = 7; i < 12; i++) {
        raw12 += Math.floor(Math.random() * 10).toString();
      }
    } else {
      raw12 = "3700764" + Math.floor(Math.random() * 90000 + 10000).toString();
    }
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(raw12[i], 10) * (i % 2 === 0 ? 1 : 3);
    }
    const check = (10 - (sum % 10)) % 10;
    return raw12 + check.toString();
  }

  if (/^535006\d{6}$/.test(str)) {
    const digits = Math.floor(Math.random() * 900000 + 100000).toString();
    return `535006${digits}`;
  }

  if (/^319375\d{3}$/.test(str)) {
    const digits = Math.floor(Math.random() * 900 + 100).toString();
    return `319375${digits}`;
  }

  if (/^525866\d{3}$/.test(str)) {
    const digits = Math.floor(Math.random() * 900 + 100).toString();
    return `525866${digits}`;
  }

  if (/^200410\d+L0XXXX\.$/.test(str) || (str.endsWith("0XXXX.") && str.startsWith("200410"))) {
    const randDigits = Math.floor(Math.random() * 9000000 + 1000000).toString();
    return `2004100001${randDigits}L0XXXX.`;
  }

  if (/^1GHE\*FD\s*\d+$/i.test(str) || k === "lieu_pce") {
    const randNum = Math.floor(Math.random() * 90 + 10).toString();
    return `1GHE*FD ${randNum}`;
  }

  const yearPrefixMatch = str.match(/^([A-Z]{2,4}-\d{4}-)\d+$/i);
  if (yearPrefixMatch) {
    const digits = Math.floor(Math.random() * 9000 + 1000).toString();
    return `${yearPrefixMatch[1]}${digits}`;
  }

  const prefixDashMatch = str.match(/^([A-Z]{2,4}-)\d+$/i);
  if (prefixDashMatch) {
    const len = str.length - prefixDashMatch[1].length;
    const min = Math.pow(10, Math.max(1, len - 1));
    const max = Math.pow(10, Math.max(2, len)) - 1;
    const digits = Math.floor(Math.random() * (max - min) + min).toString();
    return `${prefixDashMatch[1]}${digits}`;
  }

  if (/^[A-Z]{2}\d{8}$/.test(str)) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const letters = chars.charAt(Math.floor(Math.random() * chars.length)) + chars.charAt(Math.floor(Math.random() * chars.length));
    const digits = Math.floor(Math.random() * 90000000 + 10000000).toString();
    return `${letters}${digits}`;
  }

  if (/^\d{14}$/.test(str)) {
    return randomizeSuffix(str, key);
  }

  if (/^\d{3,}$/.test(str)) {
    const len = str.length;
    const min = Math.pow(10, len - 1);
    const max = Math.pow(10, len) - 1;
    return Math.floor(Math.random() * (max - min) + min).toString();
  }

  return randomizeSuffix(str, key);
}

function isGeneratorField(field: FormField): boolean {
  if (
    field.kind === "select" ||
    field.kind === "checkbox" ||
    field.kind === "cards" ||
    field.kind === "contract_axa" ||
    (field as any).type === "date" ||
    field.kind === "date" ||
    (field as any).type === "time" ||
    field.kind === "time"
  ) {
    return false;
  }
  const k = field.key.toLowerCase();
  if (
    k.includes("matricule") ||
    k.includes("payment_ref") ||
    k.includes("ref_paiement") ||
    k.includes("transaction") ||
    k.includes("client_code") ||
    k.includes("code_client")
  ) {
    return true;
  }
  if (
    k.includes("date") ||
    k.includes("time") ||
    k.includes("heure") ||
    k.includes("echeance") ||
    k.includes("total") ||
    k.includes("montant") ||
    k.includes("prix") ||
    k.includes("pu") ||
    k.includes("ht") ||
    k.includes("ttc") ||
    k.includes("remise") ||
    k.includes("tva") ||
    k.includes("nom") ||
    k.includes("prenom") ||
    k.includes("adresse") ||
    k.includes("ville") ||
    k.includes("cp") ||
    k.includes("pays") ||
    k.includes("email") ||
    k.includes("store_") ||
    k.includes("magasin_") ||
    k.includes("seller_") ||
    k.includes("vendeur") ||
    k.includes("conseiller") ||
    k.includes("oper") ||
    k.includes("notice") ||
    k.includes("mode") ||
    k.includes("payment") ||
    k.includes("reglement") ||
    k.includes("transport") ||
    k.includes("carrier") ||
    k.includes("etat") ||
    k.includes("status") ||
    k.includes("statut") ||
    k === "ticket_caisse"
  ) {
    return false;
  }
  return (
    k.startsWith("num_") ||
    k.endsWith("_num") ||
    k.includes("facture") ||
    k.includes("commande") ||
    k.includes("client_code") ||
    k.includes("code_client") ||
    k.includes("num_client") ||
    k.includes("client_num") ||
    k.includes("transaction") ||
    k === "trans" ||
    k.includes("code") ||
    k.includes("ticket") ||
    k.includes("contrat") ||
    k.includes("compte") ||
    k.includes("lieu_pce") ||
    k.includes("pce") ||
    k.includes("pdl") ||
    k === "asin" ||
    k === "sku" ||
    k === "barcode" ||
    k === "ref" ||
    k === "reference" ||
    (field as any).canGenerate === true
  );
}

function getEmptyFormData(
  defaults: FormValue,
  sections: FormSection[],
  itemKey?: string,
  itemBlank?: Record<string, string>
): FormValue {
  const empty: FormValue = {};
  for (const key of Object.keys(defaults)) {
    if (itemKey && key === itemKey) {
      empty[key] = itemBlank ? [{ ...itemBlank }] : [];
    } else if (typeof defaults[key] === "boolean") {
      empty[key] = false;
    } else {
      empty[key] = "";
    }
  }
  for (const sec of sections) {
    for (const f of sec.fields) {
      if (empty[f.key] === undefined) {
        empty[f.key] = f.kind === "checkbox" ? false : "";
      }
    }
  }
  if (itemKey && (!Array.isArray(empty[itemKey]) || (empty[itemKey] as unknown[]).length === 0)) {
    empty[itemKey] = itemBlank ? [{ ...itemBlank }] : [];
  }
  if (defaults.total !== undefined) {
    empty.total = "0,00";
  }
  return empty;
}

function counterColor(len: number, min?: number, max?: number) {
  if (min && len < min) return "text-amber-400";
  if (max && len > max) return "text-rose-400";
  return "text-emerald-400";
}

function formatDynamicTitle(rawTitle: string, index: number): string {
  if (!rawTitle) return `${index}.`;
  const clean = rawTitle.replace(/^\d+\.\s*/, "").trim();
  return `${index}. ${clean}`;
}

const OPTIONAL_FIELD_KEYS = new Set([
  "seller_adresse2",
  "note",
  "subtitle",
  "serial",
  "distribution",
  "pieces",
  "garantie",
  "eco_ht",
  "eco_ttc",
  "remise_ht",
  "remise_ttc",
  "expedition_ht",
  "expedition_ttc",
  "frais_port",
  "remise",
  "remise_globale",
  "frais_port_ttc",
  "port_ttc",
  "dernier_4_cb",
  "complement_adresse",
  "footer_cachet",
  "commentaire"
]);

function applyTransform(val: string, transform?: string): string {
  if (!transform || transform === "none") return val;
  if (transform === "uppercase") return val.toUpperCase();
  if (transform === "lowercase") return val.toLowerCase();
  if (transform === "capitalize") return val.replace(/(^|\s)\S/g, l => l.toUpperCase());
  if (transform === "digits_only") return val.replace(/\D/g, "");
  if (transform === "num_client") return formatNumClient(val);
  if (transform === "num_compte") return formatNumCompte(val);
  return val;
}

function getFieldRules(field: FormField): {
  required: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  patternError?: string;
} {
  const rulesObj = field.rules;
  const isOpt =
    (rulesObj?.required !== undefined ? !rulesObj.required : field.required === false) ||
    field.kind === "checkbox" ||
    OPTIONAL_FIELD_KEYS.has(field.key);
  const required =
    rulesObj?.required !== undefined
      ? rulesObj.required
      : field.required !== undefined
        ? field.required
        : !isOpt;
  let min = rulesObj?.min !== undefined && rulesObj?.min !== null ? rulesObj.min : field.min;
  let max = rulesObj?.max !== undefined && rulesObj?.max !== null ? rulesObj.max : field.max;

  if (min === undefined && required) {
    if (field.key.includes("nom") || field.key.includes("prenom") || field.key.includes("client") || field.key.includes("titulaire")) {
      min = 2;
    } else if (field.key.includes("adresse")) {
      min = 4;
    } else if (field.key.includes("cp") || field.key.includes("ville")) {
      min = 3;
    } else if (field.key.includes("pays")) {
      min = 2;
    } else if (field.key.includes("num_") || field.key.includes("ref") || field.key.includes("sku") || field.key.includes("neph") || field.key.includes("pce")) {
      min = 3;
    } else if (field.key.includes("date") || field.key.includes("echeance") || field.key.includes("depuis")) {
      min = 4;
    } else if (field.key.includes("email")) {
      min = 5;
    } else {
      min = 1;
    }
  }

  if (max === undefined) {
    if (field.key.includes("nom") || field.key.includes("prenom")) max = 70;
    else if (field.key.includes("adresse")) max = 80;
    else if (field.key.includes("cp_ville")) max = 50;
    else if (field.key === "cp" || field.key.endsWith("_cp")) max = 10;
    else if (field.key === "ville" || field.key.endsWith("_ville")) max = 50;
    else if (field.key.includes("pays")) max = 30;
    else if (field.key === "num_contrat" || field.kind === "contract_axa") max = 60;
    else if (field.key.includes("num_") || field.key.includes("ref")) max = 40;
    else if (field.key.includes("date") || field.key.includes("depuis")) max = 35;
    else if (field.key.includes("email")) max = 80;
  }

  return {
    required,
    min,
    max,
    pattern: rulesObj?.pattern,
    patternError: rulesObj?.patternError
  };
}

function apiErrorMessage(errJson: unknown, fallback: string) {
  if (!errJson || typeof errJson !== "object") return fallback;
  const detail = (errJson as { detail?: unknown }).detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    const parts = detail.map(item => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && "msg" in item) return String((item as { msg: unknown }).msg);
      return "";
    }).filter(Boolean);
    if (parts.length) return parts.join(" · ");
  }
  return fallback;
}

type PdfIssuerClientProps = {
  category: PreviewCategory;
  priceKey: string;
  apiBase: string;
  onBack?: () => void;
  backLabel: string;
  title: string;
  subtitle: string;
  logo: string;
  logoClass?: string;
  headerBg?: string;
  defaults: FormValue;
  sections: FormSection[];
  itemKey?: string;
  itemLabel?: string;
  itemColumns?: ItemColumn[];
  itemBlank?: Record<string, string>;
  maxItems?: number;
  filename: (data: FormValue) => string;
  generateLabel?: string;
  onToggle?: (key: string, value: any, prev: FormValue) => FormValue;
  customLayout?: CustomLayout;
};

function asRows(value: unknown): Record<string, string>[] {
  return Array.isArray(value) ? value.map(item => (item && typeof item === "object" ? { ...(item as Record<string, string>) } : {})) : [];
}

type AddressSuggestion = {
  label: string;
  name: string;
  postcode: string;
  city: string;
};

type CitySuggestion = {
  nom: string;
  codePostal: string;
};

export default function PdfIssuerClient({
  category,
  priceKey,
  apiBase,
  onBack,
  backLabel,
  title,
  subtitle,
  logo,
  logoClass,
  headerBg = "bg-gradient-to-br from-slate-900/50 to-slate-950/80 border-white/20",
  defaults,
  sections,
  itemKey,
  itemLabel = "Lignes",
  itemColumns,
  itemBlank,
  maxItems = 12,
  filename,
  generateLabel = "Générer le PDF",
  onToggle,
  customLayout
}: PdfIssuerClientProps) {
  const [mode, setMode] = useState<"normal" | "custom">("normal");
  const [customVisible, setCustomVisible] = useState<Record<string, boolean>>(() => {
    return customLayout?.visible || {};
  });
  const [openCustomSections, setOpenCustomSections] = useState<Record<string, boolean>>(() => {
    const res: Record<string, boolean> = {};
    if (customLayout?.sections) {
      for (const s of customLayout.sections) {
        res[s.id] = true;
      }
    }
    return res;
  });

  useEffect(() => {
    if (customLayout?.visible) {
      setCustomVisible(customLayout.visible);
    }
    if (customLayout?.sections) {
      setOpenCustomSections(prev => {
        const next = { ...prev };
        for (const s of customLayout.sections) {
          if (next[s.id] === undefined) {
            next[s.id] = true;
          }
        }
        return next;
      });
    }
  }, [customLayout]);

  const [formData, setFormData] = useState<FormValue>(() => cleanFormData(defaults));
  const [isAutoTotal, setIsAutoTotal] = useState<boolean>(true);
  const [manualEmailKeys, setManualEmailKeys] = useState<Record<string, boolean>>({});
  const [manualDateKeys, setManualDateKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setFormData(cleanFormData(defaults));
    setManualEmailKeys({});
    setManualDateKeys({});
  }, [defaults]);
  const [customCivilite, setCustomCivilite] = useState<string>("");
  const [isCustomCivilite, setIsCustomCivilite] = useState<boolean>(false);
  const [cardDigitsState, setCardDigitsState] = useState<string>("6357");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [price, setPrice] = useState(1);
  const { cooldown, isBlocked, allowed, assertReady, startCooldown, formatTimer } = usePreviewCooldown(category);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const closePreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
  };

  useEffect(() => {
    fetchGenerateDocsConfig().then(data => {
      const value = Number(data?.prices?.[priceKey]);
      if (Number.isFinite(value)) setPrice(value);
    });
  }, [priceKey]);

  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [activeAddressKey, setActiveAddressKey] = useState<string | null>(null);

  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [cityDropdownTarget, setCityDropdownTarget] = useState<string | null>(null);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-autocomplete-root]")) {
        setShowAddressDropdown(false);
        setShowCityDropdown(false);
        setActiveAddressKey(null);
        setCityDropdownTarget(null);
      }
    };
    document.addEventListener("click", handleGlobalClick);
    return () => document.removeEventListener("click", handleGlobalClick);
  }, []);

  const getAddressGroup = (key: string) => {
    if (key === "adresse" || key === "cp" || key === "ville") {
      return { address: "adresse", cp: "cp", ville: "ville" };
    }
    if (key.endsWith("_adresse")) {
      const p = key.slice(0, -8);
      return { address: key, cp: `${p}_cp`, ville: `${p}_ville` };
    }
    if (key.endsWith("_cp")) {
      const p = key.slice(0, -3);
      return { address: `${p}_adresse`, cp: key, ville: `${p}_ville` };
    }
    if (key.endsWith("_ville")) {
      const p = key.slice(0, -6);
      return { address: `${p}_adresse`, cp: `${p}_cp`, ville: key };
    }
    if (key.startsWith("ville_")) {
      const s = key.slice(6);
      return { address: `adresse_${s}`, cp: `cp_${s}`, ville: key };
    }
    if (key === "ville_emission" || key === "lieu_emission" || key === "lieu") {
      return { address: "", cp: "", ville: key };
    }
    return null;
  };

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
      const cp = (currentCp !== undefined ? currentCp : group ? String(formData[group.cp] || "") : "").trim();
      const ville = (currentVille !== undefined ? currentVille : group ? String(formData[group.ville] || "") : "").trim();
      let url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`;
      if (cp.length === 5) {
        url += `&postcode=${encodeURIComponent(cp)}`;
      } else if (ville.length >= 2) {
        url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(`${query} ${ville}`)}&limit=5`;
      }
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      const suggestions: AddressSuggestion[] = (data.features || []).map((feature: any) => ({
        label: feature.properties.label,
        name: feature.properties.name,
        postcode: feature.properties.postcode,
        city: feature.properties.city
      }));
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
    const targetVille = group?.ville || "ville";
    try {
      const res = await fetch(
        `https://geo.api.gouv.fr/communes?codePostal=${cpVal}&fields=nom,codePostal,codesPostaux&format=json`
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data?.length === 1) {
        const cityName = data[0].nom;
        setFormData(prev => ({ ...prev, [targetVille]: cityName }));
        setCitySuggestions([]);
        setShowCityDropdown(false);
        setCityDropdownTarget(null);
        setErrors(prev => ({ ...prev, [targetVille]: "" }));
        toast.success(`Ville détectée : ${cityName}`);
      } else if (data?.length > 1) {
        setCitySuggestions(data.map((item: any) => ({ nom: item.nom, codePostal: cpVal })));
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

  const handleCityFieldAutocomplete = async (cityVal: string, fieldKey: string) => {
    const trimmed = cityVal.trim();
    if (trimmed.length < 2) {
      setCitySuggestions([]);
      setShowCityDropdown(false);
      setCityDropdownTarget(null);
      return;
    }

    const group = getAddressGroup(fieldKey);
    const targetVilleKey = group?.ville || fieldKey;
    const targetCpKey = group?.cp && group.cp in formData ? group.cp : "";

    const digitsOnly = trimmed.replace(/\D/g, "");
    if (digitsOnly.length === 5 && (trimmed === digitsOnly || /^\d{5}/.test(trimmed))) {
      const cpVal = digitsOnly.slice(0, 5);
      try {
        const res = await fetch(
          `https://geo.api.gouv.fr/communes?codePostal=${cpVal}&fields=nom,codePostal,codesPostaux&format=json`
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length === 1) {
            const cityName = data[0].nom;
            setFormData(prev => ({
              ...prev,
              [targetVilleKey]: cityName,
              ...(targetCpKey ? { [targetCpKey]: cpVal } : {})
            }));
            setErrors(prev => ({
              ...prev,
              [targetVilleKey]: "",
              ...(targetCpKey ? { [targetCpKey]: "" } : {})
            }));
            setCitySuggestions([]);
            setShowCityDropdown(false);
            setCityDropdownTarget(null);
            toast.success(`Commune détectée : ${cityName}`);
            return;
          } else if (Array.isArray(data) && data.length > 1) {
            setCitySuggestions(data.map((item: any) => ({ nom: item.nom, codePostal: cpVal })));
            setCityDropdownTarget(fieldKey);
            setShowCityDropdown(true);
            return;
          }
        }
      } catch {
      }
    }

    const searchName = trimmed.replace(/^\d{1,5}\s*/, "").trim() || trimmed;
    if (searchName.length < 2) {
      setCitySuggestions([]);
      setShowCityDropdown(false);
      setCityDropdownTarget(null);
      return;
    }

    try {
      const res = await fetch(
        `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(searchName)}&fields=nom,codePostal,codesPostaux&format=json&boost=population&limit=7`
      );
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        setCitySuggestions([]);
        setShowCityDropdown(false);
        setCityDropdownTarget(null);
        return;
      }

      const suggestions: CitySuggestion[] = data.map((item: any) => ({
        nom: item.nom,
        codePostal: item.codesPostaux?.[0] || item.codePostal || ""
      }));

      const trimmedUpper = searchName.toUpperCase();
      const exactMatch = data.find((item: any) => item.nom.toUpperCase() === trimmedUpper);
      if (exactMatch && targetCpKey && exactMatch.codesPostaux?.length === 1) {
        const zip = exactMatch.codesPostaux[0] || exactMatch.codePostal;
        if (zip) {
          setFormData(prev => ({ ...prev, [targetCpKey]: zip }));
          setErrors(prev => ({ ...prev, [targetCpKey]: "" }));
        }
      }

      setCitySuggestions(suggestions);
      setCityDropdownTarget(fieldKey);
      setShowCityDropdown(true);
    } catch {
      setCitySuggestions([]);
      setShowCityDropdown(false);
      setCityDropdownTarget(null);
    }
  };

  const validateField = (field: FormField, val: unknown): string => {
    if (field.kind === "checkbox") return "";
    const rules = getFieldRules(field);
    const str = String(val ?? "").trim();
    if (field.key === "civilite") {
      if (str && rules.max && str.length > rules.max) {
        return `Maximum ${rules.max} caractères autorisés (${str.length}/${rules.max}).`;
      }
      return "";
    }
    if (field.kind === "contract_axa" || (field.key === "num_contrat" && category === "assurance")) {
      const [p1, p2, p3, p4] = parseAxaContractNumber(str);
      if (!p1 || !p2 || !p3 || !p4) {
        return "Numéro de contrat incomplet (4 segments requis).";
      }
      return "";
    }
    if (field.key === "immatriculation" || field.key === "vehicule_immat") {
      if (str) {
        const isValid =
          /^([A-Z]{2}-[0-9]{3}-[A-Z]{2}|[0-9]{1,4}-[A-Z]{1,3}-(?:[0-9]{1,3}|2[AB])|[A-Z0-9]{1,4}-[A-Z0-9]{1,4}-[A-Z0-9]{1,4})$/.test(str) &&
          str.length >= 7 &&
          str.length <= 12;
        if (!isValid) {
          return "Format d'immatriculation invalide (ex: FA-120-GM ou 123-ABC-45).";
        }
      }
    }
    if (field.kind === "date" || (field.key.includes("date") && !field.key.includes("num"))) {
      if (str) {
        if (field.key === "date_ticket" && str.includes(" ")) {
          const parts = str.split(" ");
          const check = isValidCalendarDate(parts[0]);
          if (!check.valid) {
            return check.message || "Date invalide (jour ou mois incorrect).";
          }
          const timeParts = parts[1].split(":");
          if (timeParts.length < 2 || timeParts.length > 3) {
            return "Heure invalide (HH:MM:SS attendu).";
          }
          const h = parseInt(timeParts[0], 10);
          const m = parseInt(timeParts[1], 10);
          const s = timeParts.length === 3 ? parseInt(timeParts[2], 10) : 0;
          if (isNaN(h) || h < 0 || h > 23 || isNaN(m) || m < 0 || m > 59 || isNaN(s) || s < 0 || s > 59) {
            return "Heure invalide (00:00:00 à 23:59:59).";
          }
        } else {
          const check = isValidCalendarDate(str);
          if (!check.valid) {
            return check.message || "Date invalide (jour ou mois incorrect).";
          }
        }
      }
    }
    if (field.kind === "time" || field.key === "heure_document" || field.key.endsWith("_time") || field.key === "time") {
      if (str) {
        const timeParts = str.split(":");
        if (timeParts.length !== 2 && timeParts.length !== 3) {
          return "Format d'heure invalide (HH:MM attendu).";
        }
        const h = parseInt(timeParts[0], 10);
        const m = parseInt(timeParts[1], 10);
        const s = timeParts.length === 3 ? parseInt(timeParts[2], 10) : 0;
        if (isNaN(h) || h < 0 || h > 23 || isNaN(m) || m < 0 || m > 59 || isNaN(s) || s < 0 || s > 59) {
          return "Heure invalide (00:00 à 23:59).";
        }
      }
    }
    if (rules.required && !str) {
      return `${field.label} est obligatoire.`;
    }
    if (str && rules.min && str.length < rules.min) {
      return `Minimum ${rules.min} caractères requis (${str.length}/${rules.min}).`;
    }
    if (str && rules.max && str.length > rules.max) {
      return `Maximum ${rules.max} caractères autorisés (${str.length}/${rules.max}).`;
    }
    if (str && rules.pattern) {
      try {
        const regex = new RegExp(rules.pattern);
        if (!regex.test(str)) {
          return rules.patternError || `Format invalide pour ${field.label}.`;
        }
      } catch {}
    }
    if (str && field.key.includes("email") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) {
      return `Format d'adresse email invalide.`;
    }
    if (str && (field.key.includes("tel") || field.key.includes("phone") || field.kind === "tel")) {
      const digits = str.replace(/\D/g, "");
      if (digits.length < 10) {
        return `Numéro de téléphone incomplet (10 chiffres minimum).`;
      }
      if (!/^[\d+ .()-]+$/.test(str)) {
        return `Format de numéro de téléphone invalide.`;
      }
    }
    return "";
  };

  const rows = itemKey ? asRows(formData[itemKey]) : [];
  const totalKey = useMemo(() => {
    if (category !== "facture") return null;
    const candidates = [
      "total",
      "total_ttc",
      "total_facture_ttc",
      "net_a_payer_ttc",
      "montant_total",
      "tot_total",
      "montant_ttc",
      "reglement_montant"
    ];
    for (const cand of candidates) {
      if (formData[cand] !== undefined) return cand;
    }
    return null;
  }, [category, formData]);

  const hasCustomLayout = Boolean(
    customLayout && Array.isArray(customLayout.sections) && customLayout.sections.length > 0
  );

  const isFactureWithTotal =
    category === "facture" &&
    Boolean(totalKey) &&
    (Boolean(itemKey) || formData.montant_gaz !== undefined || formData.reglement_montant !== undefined);
  const calculatedTotal = isFactureWithTotal ? computeFactureTotal(rows, formData) : 0;
  const enteredTotal = isFactureWithTotal && totalKey ? parseMoney(formData[totalKey]) : 0;
  const isCalculationCorrect = isFactureWithTotal && Math.abs(enteredTotal - calculatedTotal) < 0.015;
  const visibleItemColumns = (itemColumns || []).filter(
    col => mode === "custom" || (!col.advanced && col.key !== "pu_ht")
  );

  const validateAll = (): boolean => {
    const nextErrors: Record<string, string> = {};
    for (const section of sections) {
      if (section.condition) {
        const cur = String(formData[section.condition.key] ?? "");
        if (cur !== String(section.condition.value ?? "")) continue;
      }
      if (section.advanced && mode !== "custom") continue;
      for (const field of section.fields) {
        if (field.advanced && mode !== "custom") continue;
        const err = validateField(field, formData[field.key]);
        if (err) nextErrors[field.key] = err;
      }
    }
    if (itemKey) {
      if (rows.length === 0) {
        nextErrors[itemKey] = `Au moins une ligne d'article est requise.`;
      } else {
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const cols = visibleItemColumns;
          for (const col of cols) {
            const v = String(row[col.key] ?? "").trim();
            const isOptCol =
              col.required === false ||
              [
                "note",
                "notes",
                "commentaire",
                "commentaires",
                "comment",
                "subtitle",
                "serial",
                "distribution",
                "pieces",
                "garantie",
                "eco_ht",
                "eco_ttc",
                "remise",
                "remise_ht",
                "pu_brut_ht",
                "taille",
                "couleur",
                "desc2",
                "asin",
                "ean",
                "sku",
                "reference",
                "ref"
              ].includes(col.key);
            if (!v && !isOptCol) {
              nextErrors[`${itemKey}_${i}_${col.key}`] = `Requis`;
              if (!nextErrors[itemKey]) {
                nextErrors[itemKey] = `Champs requis manquants dans la ligne ${i + 1}.`;
              }
            }
            if (v && (col.key.includes("date") || col.key === "echeance")) {
              const check = isValidCalendarDate(v);
              if (!check.valid) {
                nextErrors[`${itemKey}_${i}_${col.key}`] = check.message || "Date invalide.";
                if (!nextErrors[itemKey]) {
                  nextErrors[itemKey] = `Date invalide dans la ligne ${i + 1}.`;
                }
              }
            }
            if (v && (col.key === "debut" || col.key === "fin" || (col.key.includes("heure") && !col.key.includes("heures")) || col.key.endsWith("_time"))) {
              const tp = v.split(":");
              const h = parseInt(tp[0], 10);
              const m = parseInt(tp[1], 10);
              if (tp.length !== 2 || isNaN(h) || h < 0 || h > 23 || isNaN(m) || m < 0 || m > 59) {
                nextErrors[`${itemKey}_${i}_${col.key}`] = "Heure invalide (HH:MM attendu).";
                if (!nextErrors[itemKey]) {
                  nextErrors[itemKey] = `Heure invalide dans la ligne ${i + 1}.`;
                }
              }
            }
          }
        }
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const setField = (key: string, value: unknown) => {
    if (key === totalKey) {
      setIsAutoTotal(false);
    }
    if (isClientEmailKey(key)) {
      setManualEmailKeys(prev => ({ ...prev, [key]: true }));
    }
    if (key === "date_envoi" || key === "date_echeance") {
      setManualDateKeys(prev => ({ ...prev, [key]: true }));
    }
    setFormData(prev => {
      let nextData: FormValue = { ...prev, [key]: value };
      if (onToggle) {
        const toggled = onToggle(key, value, prev);
        if (toggled !== prev) nextData = toggled;
      }

      const syncEmail = (emailKey: string, nomVal: unknown, prenomVal: unknown) => {
        if (emailKey in nextData && !manualEmailKeys[emailKey]) {
          const generated = buildDynamicEmail(String(nomVal || ""), String(prenomVal || ""));
          nextData[emailKey] = generated;
        }
      };

      if (key === "nom" || key === "prenom") {
        syncEmail("client_email", nextData.nom, nextData.prenom);
        syncEmail("email", nextData.nom, nextData.prenom);
        if (!("facturation_nom" in nextData) && !("facturation_prenom" in nextData)) {
          syncEmail("facturation_email", nextData.nom, nextData.prenom);
        }
        if (!("livraison_nom" in nextData) && !("livraison_prenom" in nextData)) {
          syncEmail("livraison_email", nextData.nom, nextData.prenom);
        }
        const full = `${nextData.prenom || ""} ${nextData.nom || ""}`.trim().toUpperCase();
        if ("destinataire_nom" in nextData) nextData.destinataire_nom = full;
        if ("titulaire_ligne" in nextData) nextData.titulaire_ligne = full;
      } else if (key === "facturation_nom" || key === "facturation_prenom") {
        const fNom = nextData.facturation_nom ?? nextData.nom;
        const fPrenom = nextData.facturation_prenom ?? nextData.prenom;
        syncEmail("facturation_email", fNom, fPrenom);
      } else if (key === "livraison_nom" || key === "livraison_prenom") {
        const lNom = nextData.livraison_nom ?? nextData.nom;
        const lPrenom = nextData.livraison_prenom ?? nextData.prenom;
        syncEmail("livraison_email", lNom, lPrenom);
      } else if (key === "client_name" || key === "nom_prenom") {
        const parts = String(value || "").trim().split(/\s+/);
        const pNom = parts.slice(1).join(" ") || parts[0] || "";
        const pPrenom = parts.length > 1 ? parts[0] : "";
        syncEmail("client_email", pNom, pPrenom);
        syncEmail("email", pNom, pPrenom);
      }

      if (key === "sold_by_amazon") {
        if (value === "false") {
          if (nextData.seller_nom === "Amazon EU S.à r.l., Succursale Française" || !nextData.seller_nom) {
            nextData.seller_nom = "EUROSTORE";
            nextData.seller_adresse = "18 Rue du Commerce";
            nextData.seller_cp = "75015";
            nextData.seller_ville = "Paris";
            nextData.seller_pays = "France";
            nextData.seller_tva = "FR10011001100";
            nextData.seller_cp_ville = "Paris, 75015";
          }
        } else if (value === "true") {
          if (nextData.seller_nom === "EUROSTORE") {
            nextData.seller_nom = "Amazon EU S.à r.l., Succursale Française";
            nextData.seller_adresse = "67 Boulevard du General Leclerc";
            nextData.seller_cp = "92110";
            nextData.seller_ville = "Clichy";
            nextData.seller_pays = "France";
            nextData.seller_tva = "LU19647148";
            nextData.seller_cp_ville = "Clichy 92110";
          }
        }
      }

      if (key === "sold_by_cdiscount") {
        if (value === "false") {
          if (nextData.vendeur === "CDISCOUNT" || !nextData.vendeur) {
            nextData.vendeur = "KXYTRADE";
            nextData.immat = "J2025074480006";
          }
        } else if (value === "true") {
          if (nextData.vendeur === "KXYTRADE" || !nextData.vendeur) {
            nextData.vendeur = "CDISCOUNT";
            nextData.immat = "RCS BORDEAUX 424 059 822";
          }
        }
      }

      if (key === "livraison_cp" || key === "livraison_ville") {
        nextData.livraison_cp_ville = `${nextData.livraison_cp || ""} ${nextData.livraison_ville || ""}`.trim();
      }
      if (key === "facturation_cp" || key === "facturation_ville") {
        nextData.facturation_cp_ville = `${nextData.facturation_cp || ""} ${nextData.facturation_ville || ""}`.trim();
      }
      if (key === "adresse" && "destinataire_adresse" in nextData) {
        nextData.destinataire_adresse = String(value || "");
      }
      if ((key === "cp" || key === "ville") && "destinataire_cp_ville" in nextData) {
        nextData.destinataire_cp_ville = `${nextData.cp || ""} ${nextData.ville || ""}`.trim();
      }
      if (
        (key === "num_facture" ||
          key === "facturation_nom" ||
          key === "facturation_prenom" ||
          key === "livraison_nom" ||
          key === "livraison_prenom") &&
        "nref" in nextData
      ) {
        const facNum = String(nextData.num_facture || "2027880107").trim();
        const nomVal = String(nextData.facturation_nom || nextData.livraison_nom || nextData.nom || "").trim();
        const prenomVal = String(nextData.facturation_prenom || nextData.livraison_prenom || nextData.prenom || "").trim();
        const initNom = nomVal ? nomVal[0].toUpperCase() : "M";
        const cleanPrenom = prenomVal.replace(/[^A-Za-z]/g, "").toUpperCase() || "LUCAS";
        const autoNref = `${facNum} - ${initNom}${cleanPrenom} -FND`;
        const curNref = String(prev.nref || "");
        if (!curNref || curNref.includes("-FND") || curNref.startsWith("100110078") || curNref.startsWith("2027880107")) {
          nextData.nref = autoNref;
        }
      }

      if (key === "date_facture") {
        if ("date_envoi" in nextData && !manualDateKeys.date_envoi) {
          nextData.date_envoi = value;
        }
        if ("date_echeance" in nextData && !manualDateKeys.date_echeance) {
          nextData.date_echeance = value;
        }
      }

      const currentTvaRate = extractTvaRate(nextData.tva_rate ?? nextData.tva ?? "20");
      const multiplier = 1 + currentTvaRate / 100;

      if (key === "expedition_ht" && "expedition_ttc" in nextData) {
        const htVal = parseMoney(value);
        nextData.expedition_ttc = formatMoney(Math.round(htVal * multiplier * 100) / 100);
      } else if (key === "expedition_ttc" && "expedition_ht" in nextData) {
        const ttcVal = parseMoney(value);
        nextData.expedition_ht = formatMoney(Math.round((ttcVal / multiplier) * 100) / 100);
      } else if (key === "remise_ht" && "remise_ttc" in nextData) {
        const htVal = parseMoney(value);
        nextData.remise_ttc = formatMoney(Math.round(htVal * multiplier * 100) / 100);
      } else if (key === "remise_ttc" && "remise_ht" in nextData) {
        const ttcVal = parseMoney(value);
        nextData.remise_ht = formatMoney(Math.round((ttcVal / multiplier) * 100) / 100);
      } else if (key === "tva_rate" || key === "tva") {
        if ("expedition_ht" in nextData && "expedition_ttc" in nextData && nextData.expedition_ht) {
          const htVal = parseMoney(nextData.expedition_ht);
          nextData.expedition_ttc = formatMoney(Math.round(htVal * multiplier * 100) / 100);
        }
        if ("remise_ht" in nextData && "remise_ttc" in nextData && nextData.remise_ht) {
          const htVal = parseMoney(nextData.remise_ht);
          nextData.remise_ttc = formatMoney(Math.round(htVal * multiplier * 100) / 100);
        }
        if (itemKey && Array.isArray(nextData[itemKey])) {
          const currentRows = asRows(nextData[itemKey]);
          nextData[itemKey] = currentRows.map(r => {
            if ("pu_ht" in r && "pu_ttc" in r && r.pu_ht) {
              const pht = parseMoney(r.pu_ht);
              const pttc = formatMoney(Math.round(pht * multiplier * 100) / 100);
              const qVal = parseMoney(r.qty || r.qte || "1") || 1;
              const nextR = { ...r, pu_ttc: pttc };
              if ("total_ttc" in nextR) nextR.total_ttc = formatMoney(qVal * parseMoney(pttc));
              return nextR;
            }
            return r;
          });
        }
      }

      if (key === "tot_sous_total" && "tot_total" in nextData) {
        const htVal = parseMoney(value);
        const tvaVal = Math.round(htVal * 0.20 * 100) / 100;
        const ttcVal = Math.round((htVal + tvaVal) * 100) / 100;
        nextData.tot_tva = formatMoney(tvaVal);
        nextData.tot_total = formatMoney(ttcVal);
      } else if (key === "tot_total" && "tot_sous_total" in nextData) {
        const ttcVal = parseMoney(value);
        const htVal = Math.round((ttcVal / 1.20) * 100) / 100;
        const tvaVal = Math.round((ttcVal - htVal) * 100) / 100;
        nextData.tot_sous_total = formatMoney(htVal);
        nextData.tot_tva = formatMoney(tvaVal);
      }

      if (key === "total_ttc" || key === totalKey) {
        if (itemKey && Array.isArray(nextData[itemKey]) && nextData[itemKey].length === 1) {
          const r0 = { ...nextData[itemKey][0] };
          const valNum = parseMoney(value);
          if ("montant_ttc" in r0) {
            r0.montant_ttc = formatMoney(valNum);
          }
          if (typeof r0.description === "string" && String(value).trim() !== "") {
            const priceMatch = r0.description.match(/:\s*[\d]+(?:[.,]\d+)?\s*€?/i);
            if (priceMatch) {
              const isComma = priceMatch[0].includes(",") || String(value).includes(",");
              const rounded = Math.round(valNum * 100) / 100;
              let numStr = rounded === Math.floor(rounded) ? String(Math.floor(rounded)) : rounded.toFixed(2).replace(/0$/, "");
              if (isComma) numStr = numStr.replace(".", ",");
              r0.description = r0.description.replace(/:\s*[\d]+(?:[.,]\d+)?\s*€?/i, `: ${numStr} €`);
            }
          }
          nextData[itemKey] = [r0];
        }
      }

      if (
        isAutoTotal &&
        totalKey &&
        (key === "expedition_ttc" ||
          key === "expedition_ht" ||
          key === "remise_ttc" ||
          key === "remise_ht" ||
          key === "extra_line_total" ||
          key === "port" ||
          key === "frais" ||
          key === "frais_port" ||
          key === "tot_livraison" ||
          key === "remise" ||
          key === "tva" ||
          key === "tva_rate" ||
          key === "montant_gaz" ||
          key === "montant_prestations")
      ) {
        const nextRows = itemKey ? asRows(nextData[itemKey]) : [];
        const computed = computeFactureTotal(nextRows, nextData);
        nextData[totalKey] = formatTotalValue(computed, String(prev[totalKey] ?? ""));
        syncCompanionTotals(nextData, computed);
      }
      if (key === "payment_method") {
        const isCash = String(value || "").toLowerCase().includes("cash") || String(value || "").toLowerCase().includes("esp");
        const tot = totalKey ? parseMoney(nextData[totalKey]) : 0;
        const sample = totalKey ? String(nextData[totalKey] ?? "") : "";
        if (!isCash) {
          if ("payment_amount" in nextData) nextData.payment_amount = formatTotalValue(tot, sample);
          if ("rendu_amount" in nextData) nextData.rendu_amount = "";
        } else {
          if ("payment_amount" in nextData && parseMoney(nextData.payment_amount) < tot) {
            nextData.payment_amount = formatTotalValue(tot, sample);
          }
          if ("rendu_amount" in nextData) {
            const pay = parseMoney(nextData.payment_amount);
            nextData.rendu_amount = formatTotalValue(Math.max(0, pay - tot), sample);
          }
        }
      }
      if (key === "payment_amount") {
        const tot = totalKey ? parseMoney(nextData[totalKey]) : 0;
        const sample = totalKey ? String(nextData[totalKey] ?? "") : "";
        if ("rendu_amount" in nextData) {
          const pay = parseMoney(value);
          nextData.rendu_amount = formatTotalValue(Math.max(0, pay - tot), sample);
        }
      }
      return nextData;
    });
    if (key === "nom" || key === "prenom" || key === "facturation_nom" || key === "facturation_prenom" || key === "livraison_nom" || key === "livraison_prenom") {
      setErrors(prev => {
        const next = { ...prev };
        if (!manualEmailKeys.client_email) delete next.client_email;
        if (!manualEmailKeys.email) delete next.email;
        if (!manualEmailKeys.facturation_email) delete next.facturation_email;
        if (!manualEmailKeys.livraison_email) delete next.livraison_email;
        return next;
      });
    }
    if (key === "date_facture") {
      setErrors(prev => {
        const next = { ...prev };
        if (!manualDateKeys.date_envoi) delete next.date_envoi;
        if (!manualDateKeys.date_echeance) delete next.date_echeance;
        return next;
      });
    }
    if (key === "expedition_ht" || key === "expedition_ttc" || key === "remise_ht" || key === "remise_ttc") {
      setErrors(prev => {
        const next = { ...prev };
        if (key === "expedition_ht") delete next.expedition_ttc;
        if (key === "expedition_ttc") delete next.expedition_ht;
        if (key === "remise_ht") delete next.remise_ttc;
        if (key === "remise_ttc") delete next.remise_ht;
        return next;
      });
    }
    if (sections.some(s => s.condition?.key === key)) {
      setErrors(prev => {
        const next = { ...prev };
        for (const s of sections) {
          if (s.condition && s.condition.key === key && String(value) !== String(s.condition.value)) {
            for (const f of s.fields) {
              delete next[f.key];
            }
          }
        }
        return next;
      });
    }
    const targetField = sections.flatMap(s => s.fields).find(f => f.key === key);
    if (targetField) {
      const err = validateField(targetField, value);
      setErrors(prev => ({ ...prev, [key]: err }));
    }
  };

  const updateRow = (index: number, key: string, value: string) => {
    if (!itemKey) return;
    setFormData(prev => {
      const next = asRows(prev[itemKey]);
      const updatedRow = { ...next[index], [key]: value };
      const currentTvaRate = extractTvaRate(updatedRow.tva ?? prev.tva_rate ?? prev.tva ?? "20");
      const multiplier = 1 + currentTvaRate / 100;
      if (key === "pu_ttc" && "pu_ht" in updatedRow) {
        const puTtcVal = parseMoney(value);
        const puHtVal = Math.round((puTtcVal / multiplier) * 100) / 100;
        updatedRow.pu_ht = formatMoney(puHtVal);
        const remVal = parseMoney(updatedRow.remise_ht || updatedRow.remise || "0");
        if ("pu_brut_ht" in updatedRow) {
          updatedRow.pu_brut_ht = formatMoney(remVal > 0 ? puHtVal + remVal : puHtVal);
        }
      } else if (key === "pu_ht" && "pu_ttc" in updatedRow) {
        const puHtVal = parseMoney(value);
        const puTtcVal = Math.round((puHtVal * multiplier) * 100) / 100;
        updatedRow.pu_ttc = formatMoney(puTtcVal);
        const remVal = parseMoney(updatedRow.remise_ht || updatedRow.remise || "0");
        if ("pu_brut_ht" in updatedRow) {
          updatedRow.pu_brut_ht = formatMoney(remVal > 0 ? puHtVal + remVal : puHtVal);
        }
      } else if (key === "pu_brut_ht") {
        const brutVal = parseMoney(value);
        const remVal = parseMoney(updatedRow.remise_ht || updatedRow.remise || "0");
        const puHtVal = Math.max(0, Math.round((brutVal - remVal) * 100) / 100);
        if ("pu_ht" in updatedRow) updatedRow.pu_ht = formatMoney(puHtVal);
        if ("pu_ttc" in updatedRow) updatedRow.pu_ttc = formatMoney(Math.round((puHtVal * multiplier) * 100) / 100);
      } else if (key === "remise_ht" || key === "remise") {
        const remVal = parseMoney(value);
        const brutVal = parseMoney(updatedRow.pu_brut_ht || "0");
        if (brutVal > 0) {
          const puHtVal = Math.max(0, Math.round((brutVal - remVal) * 100) / 100);
          if ("pu_ht" in updatedRow) updatedRow.pu_ht = formatMoney(puHtVal);
          if ("pu_ttc" in updatedRow) updatedRow.pu_ttc = formatMoney(Math.round((puHtVal * multiplier) * 100) / 100);
        } else if ("pu_ht" in updatedRow && "pu_brut_ht" in updatedRow) {
          const puHtVal = parseMoney(updatedRow.pu_ht || "0");
          if (puHtVal > 0) {
            updatedRow.pu_brut_ht = formatMoney(puHtVal + remVal);
          }
        }
      } else if (key === "eco_ht" && "eco_ttc" in updatedRow) {
        const ecoHtVal = parseMoney(value);
        updatedRow.eco_ttc = formatMoney(Math.round((ecoHtVal * multiplier) * 100) / 100);
      } else if (key === "eco_ttc" && "eco_ht" in updatedRow) {
        const ecoTtcVal = parseMoney(value);
        updatedRow.eco_ht = formatMoney(Math.round((ecoTtcVal / multiplier) * 100) / 100);
      }
      const isQty = isQtyKey(key);
      const isUnitPriceKey = key === "pu_ttc" || key === "pu_ht" || key === "pu" || key === "unit_price" || key === "prix" || key === "pu_brut_ht" || key === "remise_ht" || key === "remise";
      const isLineTotalKey = key === "total_ttc" || key === "total_ht" || key === "total" || key === "montant_ttc" || key === "montant" || key === "sous_total" || key === "net_ht";

      const currentQte = parseMoney(updatedRow.qty || updatedRow.qte || updatedRow.quantite || "1") || 1;

      if (isQty || isUnitPriceKey) {
        if ("net_ht" in updatedRow) {
          const uVal = parseMoney(updatedRow.unit_price || updatedRow.pu_ht || updatedRow.pu_brut_ht || "0");
          const remVal = parseMoney(updatedRow.remise || updatedRow.remise_ht || "0");
          updatedRow.net_ht = formatMoney(Math.max(0, currentQte * uVal - remVal));
        }
        if ("total_ttc" in updatedRow) {
          const uVal = parseMoney(updatedRow.pu_ttc || (updatedRow.pu_ht ? parseMoney(updatedRow.pu_ht) * multiplier : "0"));
          updatedRow.total_ttc = formatMoney(currentQte * uVal);
        }
        if ("total_ht" in updatedRow) {
          const uVal = parseMoney(updatedRow.pu_ht || (updatedRow.pu_ttc ? parseMoney(updatedRow.pu_ttc) / multiplier : "0"));
          updatedRow.total_ht = formatMoney(currentQte * uVal);
        }
        if ("total" in updatedRow) {
          const uVal = parseMoney(updatedRow.unit_price || updatedRow.pu || updatedRow.pu_ttc || updatedRow.prix || "0");
          updatedRow.total = formatMoney(currentQte * uVal);
        }
        if ("montant_ttc" in updatedRow) {
          const uVal = parseMoney(updatedRow.pu_ttc || updatedRow.prix || updatedRow.unit_price || "0");
          updatedRow.montant_ttc = formatMoney(currentQte * uVal);
        }
        if ("montant" in updatedRow) {
          const uVal = parseMoney(updatedRow.pu_ttc || updatedRow.pu || updatedRow.prix || "0");
          updatedRow.montant = formatMoney(currentQte * uVal);
        }
        if ("sous_total" in updatedRow) {
          const uVal = parseMoney(updatedRow.prix || updatedRow.pu_ttc || updatedRow.pu || updatedRow.unit_price || "0");
          updatedRow.sous_total = formatMoney(currentQte * uVal);
        }
      } else if (isLineTotalKey && currentQte > 0) {
        const lineTotalVal = parseMoney(value);
        const unitVal = lineTotalVal / currentQte;
        if (key === "total_ttc") {
          if ("pu_ttc" in updatedRow) updatedRow.pu_ttc = formatMoney(unitVal);
          if ("pu_ht" in updatedRow) updatedRow.pu_ht = formatMoney(Math.round((unitVal / multiplier) * 100) / 100);
        } else if (key === "total_ht") {
          if ("pu_ht" in updatedRow) updatedRow.pu_ht = formatMoney(unitVal);
          if ("pu_ttc" in updatedRow) updatedRow.pu_ttc = formatMoney(Math.round((unitVal * multiplier) * 100) / 100);
        } else if (key === "total") {
          if ("unit_price" in updatedRow) updatedRow.unit_price = formatMoney(unitVal);
          else if ("pu" in updatedRow) updatedRow.pu = formatMoney(unitVal);
          else if ("pu_ttc" in updatedRow) updatedRow.pu_ttc = formatMoney(unitVal);
        } else if (key === "montant_ttc") {
          if ("pu_ttc" in updatedRow) updatedRow.pu_ttc = formatMoney(unitVal);
          else if ("prix" in updatedRow) updatedRow.prix = formatMoney(unitVal);
        } else if (key === "montant") {
          if ("pu" in updatedRow) updatedRow.pu = formatMoney(unitVal);
          else if ("pu_ttc" in updatedRow) updatedRow.pu_ttc = formatMoney(unitVal);
        } else if (key === "sous_total") {
          if ("prix" in updatedRow) updatedRow.prix = formatMoney(unitVal);
          else if ("pu_ttc" in updatedRow) updatedRow.pu_ttc = formatMoney(unitVal);
          else if ("pu" in updatedRow) updatedRow.pu = formatMoney(unitVal);
        }
      }
      const isPriceKey = key === "montant_ttc" || key === "montant" || key === "pu_ttc" || key === "prix" || key === "total_ttc";
      if (isPriceKey && typeof updatedRow.description === "string" && value.trim() !== "") {
        const desc = updatedRow.description;
        const priceMatch = desc.match(/:\s*[\d]+(?:[.,]\d+)?\s*€?/i);
        if (priceMatch) {
          const num = parseMoney(updatedRow.montant_ttc !== undefined && updatedRow.montant_ttc !== "" ? updatedRow.montant_ttc : value);
          const isComma = priceMatch[0].includes(",") || value.includes(",");
          const rounded = Math.round(num * 100) / 100;
          let numStr = rounded === Math.floor(rounded) ? String(Math.floor(rounded)) : rounded.toFixed(2).replace(/0$/, "");
          if (isComma) numStr = numStr.replace(".", ",");
          updatedRow.description = desc.replace(/:\s*[\d]+(?:[.,]\d+)?\s*€?/i, `: ${numStr} €`);
        }
      } else if (key === "description" && typeof value === "string") {
        const descMatch = value.match(/:\s*([\d]+(?:[.,]\d+)?)\s*€?/i);
        if (descMatch) {
          const parsed = parseMoney(descMatch[1]);
          if (parsed > 0) {
            const formatted = parsed.toFixed(2);
            if ("montant_ttc" in updatedRow) {
              updatedRow.montant_ttc = formatted;
            } else if ("montant" in updatedRow) {
              updatedRow.montant = formatted;
            } else if ("pu_ttc" in updatedRow) {
              updatedRow.pu_ttc = formatted;
            }
          }
        }
      }
      next[index] = updatedRow;
      if (totalKey && isAutoTotal) {
        const computed = computeFactureTotal(next, prev);
        const nextData = { ...prev, [itemKey]: next, [totalKey]: formatTotalValue(computed, String(prev[totalKey] ?? "")) };
        syncCompanionTotals(nextData, computed);
        return nextData;
      }
      return { ...prev, [itemKey]: next };
    });
  };

  const resolveBlankItem = (): Record<string, any> => {
    if (itemBlank && typeof itemBlank === "object" && Object.keys(itemBlank).length > 0) {
      return { ...itemBlank };
    }
    if (itemColumns && Array.isArray(itemColumns) && itemColumns.length > 0) {
      const fallback: Record<string, any> = {};
      for (const col of itemColumns) {
        fallback[col.key] = "";
      }
      return fallback;
    }
    if (rows.length > 0 && typeof rows[0] === "object") {
      const fallback: Record<string, any> = {};
      for (const k of Object.keys(rows[0])) {
        fallback[k] = "";
      }
      return fallback;
    }
    return {};
  };

  const addRow = () => {
    if (!itemKey || rows.length >= maxItems) return;
    const blank = resolveBlankItem();
    setFormData(prev => {
      const next = [...asRows(prev[itemKey]), blank];
      if (totalKey && isAutoTotal) {
        const computed = computeFactureTotal(next, prev);
        const nextData = { ...prev, [itemKey]: next, [totalKey]: formatTotalValue(computed, String(prev[totalKey] ?? "")) };
        syncCompanionTotals(nextData, computed);
        return nextData;
      }
      return { ...prev, [itemKey]: next };
    });
  };

  const removeRow = (index: number) => {
    if (!itemKey || rows.length <= 1) return;
    setFormData(prev => {
      const next = asRows(prev[itemKey]).filter((_, i) => i !== index);
      if (totalKey && isAutoTotal) {
        const computed = computeFactureTotal(next, prev);
        const nextData = { ...prev, [itemKey]: next, [totalKey]: formatTotalValue(computed, String(prev[totalKey] ?? "")) };
        syncCompanionTotals(nextData, computed);
        return nextData;
      }
      return { ...prev, [itemKey]: next };
    });
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

  const getPayload = () => {
    const payload: Record<string, unknown> = { ...formData };
    if (customLayout) {
      if (mode === "custom") {
        Object.assign(payload, customVisible);
        payload.visible = customVisible;
      } else {
        const allVisible: Record<string, boolean> = {};
        if (customLayout.blocks) {
          for (const b of customLayout.blocks) {
            allVisible[b.id] = true;
          }
        }
        Object.assign(payload, allVisible);
        payload.visible = allVisible;
      }
    }
    if (payload.civilite !== undefined) {
      const civStr = String(payload.civilite ?? "").trim();
      if (civStr === "__NONE__") {
        payload.civilite = "";
      } else if (civStr === "__CUSTOM__") {
        payload.civilite = isCustomCivilite ? customCivilite.trim() : "";
      }
    }
    if (payload.nom || payload.prenom || payload.num_eleve) {
      const nom = String(payload.nom || "").trim();
      const prenom = String(payload.prenom || "").trim();
      const num = String(payload.num_eleve || "").replace(/[\[\]]/g, "").trim();
      const nameParts = [nom, prenom].filter(Boolean);
      payload.eleve = num ? `${nameParts.join(" ")} [${num}]`.trim() : nameParts.join(" ");
    }
    if (category === "facture") {
      if (payload.prenom !== undefined && payload.nom !== undefined) {
        const nom = String(payload.nom || "").trim();
        const prenom = String(payload.prenom || "").trim();
        if (prenom && !nom.includes(prenom)) {
          payload.nom = [nom, prenom].filter(Boolean).join(" ");
        }
      }
      if (payload.livraison_prenom !== undefined && payload.livraison_nom !== undefined) {
        const lNom = String(payload.livraison_nom || "").trim();
        const lPrenom = String(payload.livraison_prenom || "").trim();
        if (lPrenom && !lNom.includes(lPrenom)) {
          payload.livraison_nom = [lNom, lPrenom].filter(Boolean).join(" ");
        }
      }
      if (payload.facturation_prenom !== undefined && payload.facturation_nom !== undefined) {
        const fNom = String(payload.facturation_nom || "").trim();
        const fPrenom = String(payload.facturation_prenom || "").trim();
        if (fPrenom && !fNom.includes(fPrenom)) {
          payload.facturation_nom = [fNom, fPrenom].filter(Boolean).join(" ");
        }
      }
      if (priceKey === "ami") {
        const addr = String(payload.adresse || "").trim();
        const v = String(payload.ville || "").trim();
        if (v && addr && !addr.startsWith(`${v} -`)) {
          payload.adresse = `${v} - ${addr}`;
        }
      }
      if (payload.cp !== undefined || payload.ville !== undefined) {
        const c = String(payload.cp || "").trim();
        const v = String(payload.ville || "").trim();
        if (c || v) {
          payload.cp_ville = [c, v].filter(Boolean).join(" ");
        }
      }
      if (payload.livraison_cp !== undefined || payload.livraison_ville !== undefined) {
        const c = String(payload.livraison_cp || "").trim();
        const v = String(payload.livraison_ville || "").trim();
        if (c || v) {
          payload.livraison_cp_ville = [c, v].filter(Boolean).join(" ");
        }
      }
      if (payload.facturation_cp !== undefined || payload.facturation_ville !== undefined) {
        const c = String(payload.facturation_cp || "").trim();
        const v = String(payload.facturation_ville || "").trim();
        if (c || v) {
          payload.facturation_cp_ville = [c, v].filter(Boolean).join(" ");
        }
      }
      if (payload.seller_cp !== undefined || payload.seller_ville !== undefined) {
        const c = String(payload.seller_cp || "").trim();
        const v = String(payload.seller_ville || "").trim();
        if (c || v) {
          payload.seller_cp_ville = [c, v].filter(Boolean).join(" ");
        }
      }
    }
    if (payload.edition_date || payload.edition_time) {
      const edDate = String(payload.edition_date || "").trim();
      const edTime = String(payload.edition_time || "").trim();
      payload.edition = [edDate, edTime].filter(Boolean).join(" ");
    }
    if ("en_ligne" in payload) {
      payload.en_ligne = payload.en_ligne === true || payload.en_ligne === "true";
    }
    if ("sold_by_amazon" in payload) {
      payload.sold_by_amazon = payload.sold_by_amazon === true || payload.sold_by_amazon === "true";
    }
    return payload;
  };

  const handlePreview = async () => {
    if (!assertReady()) return;
    if (!validateAll()) {
      toast.error("Formulaire incomplet", { description: "Veuillez corriger les erreurs indiquées." });
      return;
    }
    setIsPreviewLoading(true);
    if (isFactureWithTotal && !isCalculationCorrect && totalKey) {
      toast.warning("Attention : erreur de calcul détectée", {
        description: `Le total saisi (${formData[totalKey]}) ne correspond pas au calcul des lignes (${formatTotalValue(calculatedTotal, String(formData[totalKey]))}).`
      });
    }
    try {
      const payload = getPayload();
      const res = await fetch(`${apiBase}/preview`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(apiErrorMessage(errJson, "Erreur de prévisualisation"));
      }
      const blob = await res.blob();
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
      const objectUrl = URL.createObjectURL(blob);
      previewUrlRef.current = objectUrl;
      setPreviewUrl(objectUrl);
      startCooldown();
      toast.success("Aperçu généré !");
    } catch (err: any) {
      toast.error(err.message || "Impossible de générer l'Aperçu");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateAll()) {
      toast.error("Formulaire incomplet", { description: "Veuillez corriger les erreurs indiquées." });
      return;
    }
    setIsGenerating(true);
    if (isFactureWithTotal && !isCalculationCorrect && totalKey) {
      toast.warning("Attention : erreur de calcul détectée", {
        description: `Le total saisi (${formData[totalKey]}) ne correspond pas au calcul des lignes (${formatTotalValue(calculatedTotal, String(formData[totalKey]))}).`
      });
    }
    try {
      const payload = getPayload();
      const res = await fetch(`${apiBase}/generate`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(apiErrorMessage(errJson, "Erreur de génération du PDF"));
      }
      downloadBlob(await res.blob(), filename(payload));
      toast.success("Document généré et téléchargé !");
    } catch (err: any) {
      toast.error(err.message || "Impossible de générer le document");
    } finally {
      setIsGenerating(false);
    }
  };

  const renderField = (field: FormField) => {
    const isTimeField =
      field.kind === "time" ||
      (field.kind === undefined &&
        (field.key === "heure" ||
          field.key === "time" ||
          field.key === "facture_time" ||
          field.key === "heure_document" ||
          field.key.startsWith("time_") ||
          field.key.endsWith("_time") ||
          field.key.startsWith("heure_") ||
          field.key.endsWith("_heure") ||
          field.key.includes("time") ||
          field.key.includes("heure")));

    const isDateField =
      !isTimeField &&
      (field.kind === "date" ||
        (field.kind === undefined &&
          (field.key === "date" ||
            field.key === "facture_date" ||
            field.key === "date_facture" ||
            field.key.startsWith("date_") ||
            field.key.endsWith("_date") ||
            field.key.includes("date") ||
            field.key === "depuis" ||
            field.key === "echeance")));

    const kind = field.kind || (isDateField ? "date" : isTimeField ? "time" : "text");
    const value = formData[field.key];
    const strVal = String(value ?? "");
    const hasErr = Boolean(errors[field.key]);

    if (kind === "checkbox") {
      const on = Boolean(value);
      return (
        <button
          type="button"
          onClick={() => setField(field.key, !on)}
          className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest ${
            on ? "bg-green-500/20 text-green-400" : "bg-white/5 text-white/30"
          }`}
        >
          {on ? "Oui" : "Non"}
        </button>
      );
    }
    if (kind === "cards") {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
          {(field.options || []).map(opt => {
            const isSelected =
              strVal === opt.value ||
              (opt.value === "true" && value === true) ||
              (opt.value === "false" && value === false);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  const parsed =
                    opt.value === "true" ? true : opt.value === "false" ? false : opt.value;
                  setField(field.key, parsed);
                }}
                className={`group flex flex-col items-start text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-primary shadow-[0_0_20px_rgba(239,68,68,0.2)] ring-1 ring-primary/80"
                    : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.06]"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span
                    className={`text-xs font-black uppercase tracking-wider transition-colors ${
                      isSelected ? "text-white" : "text-white/80 group-hover:text-white"
                    }`}
                  >
                    {opt.label}
                  </span>
                  <div
                    className={`h-5 w-5 rounded-full border flex items-center justify-center transition-all shrink-0 ml-2 ${
                      isSelected ? "border-primary bg-primary shadow-sm" : "border-white/30 group-hover:border-white/50"
                    }`}
                  >
                    {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                </div>
                {opt.description ? (
                  <span
                    className={`text-xs leading-relaxed font-medium transition-colors ${
                      isSelected ? "text-white/80" : "text-white/40 group-hover:text-white/60"
                    }`}
                  >
                    {opt.description}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      );
    }
    if (kind === "date") {
      const defaultFormat =
        field.dateFormat ||
        (strVal.includes(".") && !/[a-zA-ZÀ-ÿ]/.test(strVal)
          ? "dot"
          : strVal.includes("-") && /^\d{4}-\d{2}-\d{2}/.test(strVal)
            ? "iso"
            : /[a-zA-ZÀ-ÿ]/.test(strVal)
              ? "french"
              : "slash");
      return (
        <div className="space-y-1">
          <CustomDatePicker
            value={strVal}
            onChange={val => setField(field.key, val)}
            hasError={hasErr}
            placeholder={field.placeholder}
            dateFormat={defaultFormat}
          />
          {hasErr ? <p className="text-xs text-rose-400 font-bold">{errors[field.key]}</p> : null}
        </div>
      );
    }
    if (kind === "time") {
      return (
        <div className="space-y-1">
          <CustomTimePicker
            value={strVal}
            onChange={val => setField(field.key, val)}
            hasError={hasErr}
          />
          {hasErr ? <p className="text-xs text-rose-400 font-bold">{errors[field.key]}</p> : null}
        </div>
      );
    }
    if (kind === "select") {
      if (field.key === "civilite") {
        const rawList = (field.options && field.options.length > 0
          ? field.options
          : [
              { value: "MME", label: "MME" },
              { value: "M.", label: "M." },
              { value: "__CUSTOM__", label: "Personnalisé" }
            ]
        );
        const rawOptions: FormFieldOption[] = rawList.map(opt =>
          typeof opt === "string" ? { value: opt, label: opt } : opt
        ).filter(
          opt =>
            opt &&
            Boolean(opt.value) &&
            Boolean(opt.label) &&
            opt.value !== "Mr. ou Mme." &&
            opt.label !== "Mr. ou Mme." &&
            opt.value !== "Mr. et Mme." &&
            opt.label !== "Mr. et Mme." &&
            opt.value !== "M. et Mme." &&
            opt.label !== "M. et Mme."
        );

        const seen = new Set<string>();
        const allCivOptions: FormFieldOption[] = [];
        for (const opt of rawOptions) {
          if (!seen.has(opt.value)) {
            seen.add(opt.value);
            allCivOptions.push(opt);
          }
        }
        if (!seen.has("__CUSTOM__")) {
          allCivOptions.push({ value: "__CUSTOM__", label: "Personnalisé" });
          seen.add("__CUSTOM__");
        }

        const baseValues = allCivOptions
          .filter(o => o.value !== "__NONE__" && o.value !== "__CUSTOM__")
          .map(o => o.value);

        let selectedSelectVal = strVal;
        if (isCustomCivilite) {
          selectedSelectVal = "__CUSTOM__";
        } else if (strVal === "" || strVal === "__NONE__") {
          selectedSelectVal = "__NONE__";
        } else if (baseValues.includes(strVal)) {
          selectedSelectVal = strVal;
        } else {
          selectedSelectVal = "__CUSTOM__";
        }

        return (
          <div className="space-y-2">
            <div className="relative flex items-center">
              <select
                value={selectedSelectVal}
                onChange={e => {
                  const val = e.target.value;
                  if (val === "__NONE__") {
                    setIsCustomCivilite(false);
                    setField(field.key, "");
                  } else if (val === "__CUSTOM__") {
                    setIsCustomCivilite(true);
                    setField(field.key, customCivilite);
                  } else {
                    setIsCustomCivilite(false);
                    setField(field.key, val);
                  }
                }}
                className={`w-full bg-white/5 border ${
                  hasErr ? "border-rose-500/80 focus:border-rose-500" : "border-white/10 focus:border-primary"
                } rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors appearance-none cursor-pointer pr-10`}
              >
                {allCivOptions.map(option => (
                  <option key={option.value} value={option.value} className="bg-slate-900 text-white">
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-4 pointer-events-none text-white/40"
              />
            </div>
            {(isCustomCivilite || selectedSelectVal === "__CUSTOM__") ? (
              <input
                type="text"
                value={customCivilite || (baseValues.every(v => v !== strVal) && strVal !== "__NONE__" ? strVal : "")}
                onChange={e => {
                  const text = e.target.value;
                  setCustomCivilite(text);
                  setField(field.key, text);
                }}
                placeholder="Civilité personnalisée..."
                className={`w-full bg-white/5 border ${
                  hasErr ? "border-rose-500/80 focus:border-rose-500" : "border-white/10 focus:border-primary"
                } rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors mt-2`}
              />
            ) : null}
            {hasErr ? <p className="text-xs text-rose-400 font-bold">{errors[field.key]}</p> : null}
          </div>
        );
      }
      const isCardPaymentField =
        (field.key === "payment_mode" || field.key === "payment") &&
        (field.options || []).some(o => ["MasterCard", "Visa", "American Express"].includes(o.value));

      if (isCardPaymentField) {
        const CARD_NAMES = ["MasterCard", "Visa", "American Express"];
        const match = strVal.match(/^(MasterCard|Visa|American Express)(?:\s*(?:\*{1,16})?(\d{0,4}))?/);
        const selectedCard = match ? match[1] : (CARD_NAMES.includes(strVal) ? strVal : "");
        const cardDigits = match && match[2] !== undefined ? match[2] : "";
        const currentSelected = selectedCard || ((field.options || []).some(o => o.value === strVal) ? strVal : (field.options?.[0]?.value ?? ""));

        const isCard = CARD_NAMES.includes(currentSelected);

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 flex items-center min-w-0">
                <select
                  value={currentSelected}
                  onChange={e => {
                    const val = e.target.value;
                    if (CARD_NAMES.includes(val)) {
                      const d = cardDigits || cardDigitsState || "6357";
                      setField(field.key, `${val} *************${d}`);
                    } else {
                      setField(field.key, val);
                    }
                  }}
                  className={`w-full bg-white/5 border ${
                    hasErr ? "border-rose-500/80 focus:border-rose-500" : "border-white/10 focus:border-primary"
                  } rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors appearance-none cursor-pointer pr-10`}
                >
                  {(field.options || []).map(option => (
                    <option key={option.value} value={option.value} className="bg-slate-900 text-white">
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-4 pointer-events-none text-white/40"
                />
              </div>
              {isCard && (
                <div className="w-24 sm:w-28 shrink-0">
                  <input
                    type="text"
                    maxLength={4}
                    value={cardDigits}
                    onChange={e => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setCardDigitsState(digits);
                      setField(field.key, `${currentSelected} *************${digits}`);
                    }}
                    placeholder="6357"
                    title="4 derniers chiffres"
                    className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl px-3 py-3 text-sm text-center text-white outline-none transition-colors font-mono tracking-wider"
                  />
                </div>
              )}
            </div>
            {hasErr ? <p className="text-xs text-rose-400 font-bold">{errors[field.key]}</p> : null}
          </div>
        );
      }

      return (
        <div className="space-y-1">
          <div className="relative flex items-center">
            <select
              value={strVal}
              onChange={e => setField(field.key, e.target.value)}
              className={`w-full bg-white/5 border ${
                hasErr ? "border-rose-500/80 focus:border-rose-500" : "border-white/10 focus:border-primary"
              } rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors appearance-none cursor-pointer pr-10`}
            >
              {(field.options || []).map(option => (
                <option key={option.value} value={option.value} className="bg-slate-900 text-white">
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-4 pointer-events-none text-white/40"
            />
          </div>
          {hasErr ? <p className="text-xs text-rose-400 font-bold">{errors[field.key]}</p> : null}
        </div>
      );
    }
    if (kind === "contract_axa" || (field.key === "num_contrat" && category === "assurance")) {
      const [p1, p2, p3, p4] = parseAxaContractNumber(strVal);

      const updateContract = (newP1: string, newP2: string, newP3: string, newP4: string) => {
        const full = `${newP1} - ${newP2} - ${newP3}   ${newP4}`;
        setField(field.key, full);
        if (formData.info_contrat !== undefined) {
          setField("info_contrat", full);
        }
      };

      const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const text = e.clipboardData.getData("text");
        if (text && (text.includes("-") || text.split(/\s+/).length >= 3)) {
          e.preventDefault();
          const [cp1, cp2, cp3, cp4] = parseAxaContractNumber(text);
          const syncP3 = cp2 || cp3;
          updateContract(cp1, cp2, syncP3, cp4);
        }
      };

      return (
        <div className="space-y-1">
          <div
            className={`w-full bg-white/5 border ${
              hasErr ? "border-rose-500/80 focus-within:border-rose-500" : "border-white/10 focus-within:border-primary"
            } rounded-xl h-[46px] px-2 sm:px-3 flex items-center gap-1 transition-colors`}
          >
            <div className="w-[50px] sm:w-[58px] shrink-0">
              <input
                type="text"
                value={p1}
                maxLength={5}
                onChange={e => {
                  const val = e.target.value.replace(/[\s-]/g, "").toUpperCase();
                  updateContract(val, p2, p3, p4);
                }}
                onPaste={handlePaste}
                placeholder="D443"
                className="w-full bg-transparent hover:bg-white/[0.04] focus:bg-white/[0.08] rounded-md py-1 text-xs sm:text-sm font-mono text-center text-white outline-none transition-colors uppercase tracking-wider"
              />
            </div>

            <span className="text-white/30 font-bold select-none shrink-0 text-xs">-</span>

            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={p2}
                maxLength={14}
                onChange={e => {
                  const val = e.target.value.replace(/[\s-]/g, "");
                  const syncP3 = (!p3 || p3 === p2) ? val : p3;
                  updateContract(p1, val, syncP3, p4);
                }}
                onPaste={handlePaste}
                placeholder="4180352981"
                className="w-full bg-transparent hover:bg-white/[0.04] focus:bg-white/[0.08] rounded-md py-1 text-xs sm:text-sm font-mono text-center text-white outline-none transition-colors tracking-tight sm:tracking-normal"
              />
            </div>

            <span className="text-white/30 font-bold select-none shrink-0 text-xs">-</span>

            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={p3}
                maxLength={14}
                onChange={e => {
                  const val = e.target.value.replace(/[\s-]/g, "");
                  updateContract(p1, val, val, p4);
                }}
                onPaste={handlePaste}
                placeholder="4180352981"
                className="w-full bg-transparent hover:bg-white/[0.04] focus:bg-white/[0.08] rounded-md py-1 text-xs sm:text-sm font-mono text-center text-white outline-none transition-colors tracking-tight sm:tracking-normal"
              />
            </div>

            <div className="flex items-center justify-center shrink-0 px-0.5">
              <span className="h-4 w-px bg-white/20 select-none" />
            </div>

            <div className="flex-[1.2] min-w-0">
              <input
                type="text"
                value={p4}
                maxLength={16}
                onChange={e => {
                  const val = e.target.value.replace(/[\s-]/g, "");
                  updateContract(p1, p2, p3, val);
                }}
                onPaste={handlePaste}
                placeholder="367304284920"
                className="w-full bg-transparent hover:bg-white/[0.04] focus:bg-white/[0.08] rounded-md py-1 text-xs sm:text-sm font-mono text-center text-white outline-none transition-colors tracking-tight sm:tracking-normal"
              />
            </div>
          </div>
          {hasErr ? <p className="text-xs text-rose-400 font-bold">{errors[field.key]}</p> : null}
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
          {hasErr ? <p className="text-xs text-rose-400 font-bold">{errors[field.key]}</p> : null}
        </div>
      );
    }
    if (field.key === "ticket_caisse") {
      return (
        <div className="space-y-1">
          <TicketCaisseInput
            value={strVal}
            onChange={val => setField(field.key, val)}
            hasError={hasErr}
          />
          {hasErr ? <p className="text-xs text-rose-400 font-bold">{errors[field.key]}</p> : null}
        </div>
      );
    }
    if (kind === "country" || field.key === "pays" || field.key.endsWith("_pays")) {
      return (
        <div className="space-y-1">
          <CountryPicker
            value={strVal}
            onChange={val => setField(field.key, val)}
            hasError={hasErr}
            placeholder={field.placeholder || "Sélectionner un pays..."}
          />
          {hasErr ? <p className="text-xs text-rose-400 font-bold">{errors[field.key]}</p> : null}
        </div>
      );
    }
    if (kind === "textarea") {
      return (
        <div className="space-y-1">
          <textarea
            value={strVal}
            placeholder={field.placeholder}
            onChange={e => {
              let val = e.target.value;
              if (field.rules?.transform) {
                val = applyTransform(val, field.rules.transform);
              }
              setField(field.key, val);
            }}
            rows={3}
            className={`w-full bg-white/5 border ${hasErr ? "border-rose-500/80 focus:border-rose-500" : "border-white/10 focus:border-primary"} rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors`}
          />
          {hasErr ? <p className="text-xs text-rose-400 font-bold">{errors[field.key]}</p> : null}
        </div>
      );
    }

    const group = getAddressGroup(field.key);
    const isAddress = Boolean(group && group.address === field.key);
    const isCp = Boolean((group && group.cp === field.key) || field.key === "cp" || field.key.endsWith("_cp") || field.autocompleteType === "postal_code" || field.autocompleteType === "cp");
    const isVille = Boolean((group && group.ville === field.key) || field.key === "ville" || field.key.endsWith("_ville"));
    const isCityField = Boolean(
      isVille ||
      field.autocompleteType === "city" ||
      field.key === "ville_emission" ||
      field.key === "lieu_emission" ||
      field.key === "lieu" ||
      field.key.startsWith("ville_") ||
      field.key.startsWith("lieu_") ||
      field.key === "commune" ||
      field.key.endsWith("_commune")
    );

    return (
      <div className="space-y-1 relative" data-autocomplete-root>
        <input
          type="text"
          value={strVal}
          placeholder={field.placeholder}
          onBlur={() => {
            if (isCityField && /^\d{5}$/.test(strVal.trim())) {
              handleCityFieldAutocomplete(strVal.trim(), field.key);
            }
          }}
          onKeyDown={e => {
            if (
              e.key === "Backspace" &&
              (field.key === "num_client" || field.key === "num_compte" || field.format)
            ) {
              const input = e.currentTarget;
              const { selectionStart, selectionEnd } = input;
              if (
                selectionStart !== null &&
                selectionStart === selectionEnd &&
                selectionStart > 1
              ) {
                if (strVal[selectionStart - 1] === " ") {
                  e.preventDefault();
                  const rawBefore = strVal.slice(0, selectionStart - 1);
                  const rawAfter = strVal.slice(selectionStart);
                  const newStr = rawBefore.slice(0, -1) + rawAfter;
                  let formatted = newStr;
                  if (field.format) formatted = field.format(newStr);
                  else if (field.key === "num_client") formatted = formatNumClient(newStr);
                  else if (field.key === "num_compte") formatted = formatNumCompte(newStr);
                  setField(field.key, formatted);
                }
              }
            }
          }}
          inputMode={isMoneyKey(field.key) ? "decimal" : isQtyKey(field.key) ? "numeric" : undefined}
          onChange={e => {
            let val = e.target.value;
            const isTel = field.key.includes("tel") || field.key.includes("phone") || field.kind === "tel";
            if (isTel) {
              val = val.replace(/[^\d+ .()-]/g, "");
            } else if (isMoneyKey(field.key)) {
              val = sanitizeMoneyInput(val);
            } else if (isQtyKey(field.key)) {
              val = sanitizeQtyInput(val);
            }
            if (field.rules?.transform) {
              val = applyTransform(val, field.rules.transform);
            }
            if (field.format) {
              val = field.format(val);
            } else if (field.key === "num_client") {
              val = formatNumClient(val);
            } else if (field.key === "num_compte") {
              val = formatNumCompte(val);
            }
            setField(field.key, val);
            if (isAddress) {
              fetchAddressSuggestions(val, field.key);
            } else if (isCp) {
              const digitsOnly = val.replace(/\D/g, "").slice(0, 5);
              if (digitsOnly !== val) setField(field.key, digitsOnly);
              fetchCityFromCp(digitsOnly, field.key);
            } else if (isCityField) {
              handleCityFieldAutocomplete(val, field.key);
            }
          }}
          className={`w-full bg-white/5 border ${
            hasErr
              ? "border-rose-500/80 focus:border-rose-500"
              : isFactureWithTotal && totalKey === field.key
                ? isCalculationCorrect
                  ? "border-emerald-500/60 focus:border-emerald-500"
                  : "border-amber-500/70 focus:border-amber-500"
                : "border-white/10 focus:border-primary"
          } rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors`}
        />
        {hasErr ? <p className="text-xs text-rose-400 font-bold">{errors[field.key]}</p> : null}
        {isFactureWithTotal && totalKey === field.key && !hasErr && (
          <div className="mt-1.5 flex items-center justify-between gap-2">
            {isCalculationCorrect ? (
              <p className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                Les calculs sont bons ({formatTotalValue(calculatedTotal, strVal)})
              </p>
            ) : (
              <>
                <p className="text-xs text-amber-400 font-bold flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                  {!isAutoTotal ? "Total personnalisé" : "Erreur de calcul"} : attendu {formatTotalValue(calculatedTotal, strVal)} (écart : {formatMoneyEur(Math.abs(enteredTotal - calculatedTotal))})
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsAutoTotal(true);
                    setFormData(prev => {
                      const nextData = {
                        ...prev,
                        [totalKey]: formatTotalValue(calculatedTotal, strVal)
                      };
                      syncCompanionTotals(nextData, calculatedTotal);
                      return nextData;
                    });
                  }}
                  className="text-[10px] uppercase font-black text-primary hover:underline cursor-pointer shrink-0"
                >
                  {!isAutoTotal ? "Réaligner" : "Ajuster"}
                </button>
              </>
            )}
          </div>
        )}

        {isAddress && showAddressDropdown && activeAddressKey === field.key && addressSuggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#0c1322]/95 border border-white/15 rounded-xl shadow-2xl backdrop-blur-2xl z-50 overflow-hidden divide-y divide-white/5 max-h-56 overflow-y-auto">
            {addressSuggestions.map((sug, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={e => {
                  e.preventDefault();
                  if (group) {
                    setFormData(prev => ({
                      ...prev,
                      [group.address]: sug.name,
                      [group.cp]: sug.postcode,
                      [group.ville]: sug.city.toUpperCase()
                    }));
                    setErrors(prev => ({
                      ...prev,
                      [group.address]: "",
                      [group.cp]: "",
                      [group.ville]: ""
                    }));
                  }
                  setShowAddressDropdown(false);
                  setAddressSuggestions([]);
                }}
                className="w-full text-left px-3.5 py-2.5 text-xs text-white/90 hover:bg-white/10 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <MapPin size={12} className="text-primary shrink-0" />
                <span className="truncate">{sug.label}</span>
              </button>
            ))}
          </div>
        )}

        {(isCp || isCityField) && showCityDropdown && cityDropdownTarget === field.key && citySuggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#0c1322]/95 border border-white/15 rounded-xl shadow-2xl backdrop-blur-2xl z-50 overflow-hidden divide-y divide-white/5 max-h-48 overflow-y-auto">
            <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white/40 bg-white/[0.02]">
              Sélectionnez une commune
            </div>
            {citySuggestions.map((city, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={e => {
                  e.preventDefault();
                  if (isCp) {
                    const targetVille = group?.ville || "ville";
                    setFormData(prev => ({
                      ...prev,
                      [field.key]: city.codePostal,
                      ...(targetVille in prev ? { [targetVille]: city.nom } : {})
                    }));
                    setErrors(prev => ({
                      ...prev,
                      [field.key]: "",
                      ...(targetVille in prev ? { [targetVille]: "" } : {})
                    }));
                  } else {
                    const targetVille = (group && group.ville in formData) ? group.ville : field.key;
                    const targetCp = group?.cp && group.cp in formData ? group.cp : "";
                    setFormData(prev => ({
                      ...prev,
                      [targetVille]: city.nom,
                      ...(targetCp ? { [targetCp]: city.codePostal } : {})
                    }));
                    setErrors(prev => ({
                      ...prev,
                      [targetVille]: "",
                      ...(targetCp ? { [targetCp]: "" } : {})
                    }));
                  }
                  setShowCityDropdown(false);
                  setCitySuggestions([]);
                  setCityDropdownTarget(null);
                }}
                className="w-full text-left px-3.5 py-2 text-xs text-white/90 hover:bg-white/10 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>{city.nom}</span>
                <span className="text-[10px] text-white/40 font-mono">{city.codePostal}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const isSectionVisible = (section: FormSection) => {
    if (section.advanced && mode !== "custom") return false;
    if (section.condition) {
      const cur = String(formData[section.condition.key] ?? "");
      if (cur !== String(section.condition.value ?? "")) return false;
    }
    const fieldsToRender = section.fields.filter(f => !f.advanced || mode === "custom");
    return fieldsToRender.length > 0;
  };

  const beforeSections = sections.filter(s => s.position !== "after_items");
  const afterSections = sections.filter(s => s.position === "after_items");

  let currentBlockIndex = 1;
  const numberedBeforeSections = beforeSections.map(section => {
    const isVisible = isSectionVisible(section);
    const num = isVisible ? currentBlockIndex++ : null;
    return { section, num };
  });

  const hasItemsBlock = Boolean(itemKey && itemColumns);
  const itemsBlockNumber = hasItemsBlock ? currentBlockIndex++ : null;

  const numberedAfterSections = afterSections.map(section => {
    const isVisible = isSectionVisible(section);
    const num = isVisible ? currentBlockIndex++ : null;
    return { section, num };
  });

  const FIELD_PAIRS: [string, string][] = [
    ["nom", "livraison_nom"],
    ["prenom", "livraison_prenom"],
    ["adresse", "livraison_adresse"],
    ["adresse2", "livraison_adresse2"],
    ["cp", "livraison_cp"],
    ["ville", "livraison_ville"],
    ["pays", "livraison_pays"],
    ["tel", "livraison_tel"],
    ["telephone", "livraison_telephone"],
    ["email", "livraison_email"],
    ["civilite", "livraison_civilite"],
    ["societe", "livraison_societe"],
    ["cp_ville", "livraison_cp_ville"],
  ];

  const copyBillingToShipping = () => {
    setFormData(prev => {
      const next = { ...prev };
      for (const k of Object.keys(prev)) {
        if (k.startsWith("facturation_")) {
          const suffix = k.replace("facturation_", "");
          const targetKey = `livraison_${suffix}`;
          next[targetKey] = prev[k];
        }
      }
      for (const [billKey, shipKey] of FIELD_PAIRS) {
        if (prev[billKey] !== undefined) {
          next[shipKey] = prev[billKey];
        }
      }
      const cp = next.facturation_cp ?? next.cp;
      const ville = next.facturation_ville ?? next.ville;
      if (cp || ville) {
        if (cp) next.livraison_cp = cp;
        if (ville) next.livraison_ville = ville;
        next.livraison_cp_ville = `${cp || ""} ${ville || ""}`.trim();
      }
      return next;
    });
    setErrors(prev => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        if (k.startsWith("livraison_")) delete next[k];
      }
      return next;
    });
    toast.success("Coordonnées de facturation copiées vers la livraison !");
  };

  const copyShippingToBilling = () => {
    setFormData(prev => {
      const next = { ...prev };
      for (const k of Object.keys(prev)) {
        if (k.startsWith("livraison_")) {
          const suffix = k.replace("livraison_", "");
          const targetKey = `facturation_${suffix}`;
          if (targetKey in prev || sections.some(s => s.fields.some(f => f.key === targetKey))) {
            next[targetKey] = prev[k];
          }
        }
      }
      for (const [billKey, shipKey] of FIELD_PAIRS) {
        if (prev[shipKey] !== undefined) {
          if (billKey in prev || sections.some(s => s.fields.some(f => f.key === billKey))) {
            next[billKey] = prev[shipKey];
          }
        }
      }
      const lCp = next.livraison_cp;
      const lVille = next.livraison_ville;
      if (lCp || lVille) {
        if (next.facturation_cp !== undefined || sections.some(s => s.fields.some(f => f.key === "facturation_cp"))) {
          if (lCp) next.facturation_cp = lCp;
          if (lVille) next.facturation_ville = lVille;
          next.facturation_cp_ville = `${lCp || ""} ${lVille || ""}`.trim();
        }
        if (next.cp !== undefined || sections.some(s => s.fields.some(f => f.key === "cp"))) {
          if (lCp) next.cp = lCp;
          if (lVille) next.ville = lVille;
          next.cp_ville = `${lCp || ""} ${lVille || ""}`.trim();
        }
      }
      return next;
    });
    setErrors(prev => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        if (k.startsWith("facturation_") || FIELD_PAIRS.some(([b]) => b === k)) delete next[k];
      }
      return next;
    });
    toast.success("Coordonnées de livraison copiées vers la facturation !");
  };

  const renderSection = (section: FormSection, blockNumber?: number | null) => {
    if (section.advanced && mode !== "custom") return null;
    if (section.condition) {
      const cur = String(formData[section.condition.key] ?? "");
      if (cur !== String(section.condition.value ?? "")) return null;
    }
    const fieldsToRender = section.fields.filter(f => !f.advanced || mode === "custom");
    if (fieldsToRender.length === 0) return null;
    const displayTitle = blockNumber ? formatDynamicTitle(section.title, blockNumber) : section.title;
    const hasCivilite = fieldsToRender.some(f => f.key === "civilite");
    const hasNom = fieldsToRender.some(f => f.key === "nom");
    const hasPrenom = fieldsToRender.some(f => f.key === "prenom");
    const hasCivNomPrenom = hasCivilite && hasNom && hasPrenom;

    const isShippingSection = fieldsToRender.some(f => f.key.startsWith("livraison_"));
    const isBillingSection =
      !isShippingSection &&
      !section.title.toLowerCase().includes("vendeur") &&
      !section.title.toLowerCase().includes("magasin") &&
      !section.title.toLowerCase().includes("store") &&
      !section.title.toLowerCase().includes("expéditeur") &&
      (
        fieldsToRender.some(f => f.key.startsWith("facturation_")) ||
        (fieldsToRender.some(f => f.key === "adresse" || f.key === "nom") &&
          (section.title.toLowerCase().includes("facturation") ||
            section.title.toLowerCase().includes("client") ||
            section.title.toLowerCase().includes("acheteur") ||
            section.title.toLowerCase().includes("coordonnées") ||
            section.title.toLowerCase().includes("identité")))
      );
    const hasShippingFields = sections.some(s => s.fields.some(f => f.key.startsWith("livraison_")));
    const hasBillingFields = sections.some(
      s =>
        s.fields.some(f => f.key.startsWith("facturation_")) ||
        (!s.fields.some(f => f.key.startsWith("livraison_")) &&
          !s.title.toLowerCase().includes("vendeur") &&
          !s.title.toLowerCase().includes("magasin") &&
          !s.title.toLowerCase().includes("store") &&
          !s.title.toLowerCase().includes("expéditeur") &&
          s.fields.some(f => f.key === "adresse" || f.key === "nom") &&
          (s.title.toLowerCase().includes("facturation") ||
            s.title.toLowerCase().includes("client") ||
            s.title.toLowerCase().includes("acheteur") ||
            s.title.toLowerCase().includes("coordonnées") ||
            s.title.toLowerCase().includes("identité")))
    );

    const getFieldSpanClass = (field: FormField) => {
      if (field.span === 2 || field.kind === "cards" || (field.key === "total" && priceKey === "burberry")) {
        return "md:col-span-12";
      }
      if (hasCivNomPrenom) {
        if (field.key === "civilite") return "md:col-span-3";
        if (field.key === "nom") return "md:col-span-4";
        if (field.key === "prenom") return "md:col-span-5";
      }
      return "md:col-span-6";
    };

    return (
      <div key={section.title} className="glass p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 gap-3">
          <h2 className="text-lg font-black italic text-white uppercase">{displayTitle}</h2>
          {isShippingSection && hasBillingFields && (
            <button
              type="button"
              onClick={copyBillingToShipping}
              className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Copier les coordonnées de facturation vers la livraison"
            >
              <Copy size={12} className="text-primary" /> Copier facturation
            </button>
          )}
          {isBillingSection && hasShippingFields && (
            <button
              type="button"
              onClick={copyBillingToShipping}
              className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Copier les coordonnées de facturation vers la livraison"
            >
              <Copy size={12} className="text-primary" /> Copier vers livraison
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {fieldsToRender.map(field => {
            const rules = getFieldRules(field);
            const strVal = String(formData[field.key] ?? "");
            const isPhoneField =
              field.kind === "tel" ||
              (field as any).type === "tel" ||
              field.key === "client_tel" ||
              field.key === "tel" ||
              field.key === "telephone" ||
              field.key.endsWith("_tel") ||
              field.key.endsWith("_telephone");
            return (
              <div
                key={field.key}
                className={`space-y-2 ${getFieldSpanClass(field)}`}
              >
                <div className="flex justify-between items-center gap-2">
                  <label className="text-xs font-bold text-white/80 uppercase">{field.label}</label>
                  <div className="flex items-center gap-2">
                    {isPhoneField && (
                      <button
                        type="button"
                        onClick={() => {
                          const randPhone = generateRandomPhoneNumber(strVal, field.key);
                          setField(field.key, randPhone);
                          if (errors[field.key]) {
                            setErrors(prev => {
                              const next = { ...prev };
                              delete next[field.key];
                              return next;
                            });
                          }
                        }}
                        className="text-[10px] font-black uppercase text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer transition-colors"
                        title="Générer un numéro de téléphone aléatoire"
                      >
                        <RefreshCw size={10} /> Générer
                      </button>
                    )}
                    {!isPhoneField && isGeneratorField(field) && (
                      <button
                        type="button"
                        onClick={() => {
                          const fallbackSample = (field as any).placeholder ? String((field as any).placeholder).replace(/^ex:\s*/i, "").trim() : (field as any).default || "";
                          const hasInvalidLetters = Boolean(
                            strVal &&
                            /[a-zA-Z]/.test(strVal) &&
                            ((field.key === "num_client" || field.key === "num_compte" || field.key === "pdl") ||
                             field.rules?.transform === "digits_only" ||
                             (fallbackSample && !/[a-zA-Z]/.test(fallbackSample) && /\d/.test(fallbackSample)))
                          );
                          const sample = (!strVal || hasInvalidLetters) ? (fallbackSample || strVal || "") : strVal;
                          let nextVal = generatePatternValue(sample, field.key, priceKey);
                          if (field.rules?.transform) {
                            nextVal = applyTransform(nextVal, field.rules.transform);
                          }
                          if (field.format) {
                            nextVal = field.format(nextVal);
                          } else if (field.key === "num_client" && (priceKey === "attestation_edf" || nextVal.startsWith("6"))) {
                            nextVal = formatNumClient(nextVal);
                          } else if (field.key === "num_compte" && (priceKey === "attestation_edf" || nextVal.startsWith("4"))) {
                            nextVal = formatNumCompte(nextVal);
                          }
                          setField(field.key, nextVal);
                          if (errors[field.key]) {
                            setErrors(prev => {
                              const next = { ...prev };
                              delete next[field.key];
                              return next;
                            });
                          }
                        }}
                        className="text-[10px] font-black uppercase text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer transition-colors"
                        title="Générer une nouvelle valeur"
                      >
                        <RefreshCw size={10} /> Générer
                      </button>
                    )}
                    {field.key === totalKey && isFactureWithTotal ? (
                      <button
                        type="button"
                        onClick={() => {
                          const nextAuto = !isAutoTotal;
                          setIsAutoTotal(nextAuto);
                          if (nextAuto) {
                            setFormData(prev => {
                              const nextData = {
                                ...prev,
                                [totalKey]: formatTotalValue(calculatedTotal, strVal)
                              };
                              syncCompanionTotals(nextData, calculatedTotal);
                              return nextData;
                            });
                          }
                        }}
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border transition-colors cursor-pointer flex items-center gap-1.5 ${
                          isAutoTotal
                            ? isCalculationCorrect
                              ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20"
                              : "text-amber-400 bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20"
                            : "text-white/60 bg-white/5 border-white/20 hover:text-white hover:bg-white/10"
                        }`}
                        title={isAutoTotal ? "Mode automatique actif. Cliquez pour passer en saisie libre" : "Mode manuel actif. Cliquez pour synchroniser au calcul automatique"}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isAutoTotal ? (isCalculationCorrect ? "bg-emerald-400" : "bg-amber-400") : "bg-white/40"}`} />
                        {isAutoTotal ? (isCalculationCorrect ? "Calcul automatique" : "Écart détecté") : "Saisie libre"}
                      </button>
                    ) : null}
                    {field.kind !== "checkbox" &&
                      field.kind !== "cards" &&
                      field.kind !== "select" &&
                      field.kind !== "contract_axa" &&
                      !(field.key === "num_contrat" && category === "assurance") &&
                      (rules.min || rules.max) ? (
                      <span className={`text-[10px] font-mono ${counterColor(strVal.length, rules.min, rules.max)}`}>
                        {rules.min && strVal.length < rules.min
                          ? `min ${rules.min} car. (${strVal.length}/${rules.min})`
                          : rules.max
                            ? `${strVal.length}/${rules.max}`
                            : `${strVal.length} car.`}
                      </span>
                    ) : null}
                  </div>
                </div>
                {renderField(field)}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen pt-6 md:pt-36 pb-32 md:pb-20 px-4 md:px-6 max-w-5xl mx-auto select-none">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} type="button" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/40 hover:text-primary transition-colors">
            <ArrowLeft size={14} /> {backLabel}
          </button>
        </div>
        <div className="flex items-center gap-4 mb-2">
          <div className={`px-5 py-3.5 border rounded-2xl backdrop-blur-md flex items-center justify-center overflow-hidden ${headerBg}`}>
            <img src={logo} alt="" className={`h-8 sm:h-10 w-auto max-w-[140px] object-contain ${logoClass || ""}`} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-black italic text-white">{title}</h1>
            <p className="text-xs text-white/40 font-bold tracking-wider uppercase">{subtitle}</p>
          </div>
        </div>

        {customLayout && Array.isArray(customLayout.sections) && customLayout.sections.length > 0 && (
          <div className="glass p-2 md:p-3 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode("normal");
                  if (totalKey && formData[totalKey] !== undefined && itemKey) {
                    const computed = computeFactureTotal(asRows(formData[itemKey]), formData);
                    setFormData(prev => ({
                      ...prev,
                      [totalKey]: formatTotalValue(computed, String(prev[totalKey] ?? ""))
                    }));
                  }
                }}
                className={`rounded-xl px-4 py-3 text-left transition-all cursor-pointer ${
                  mode === "normal"
                    ? "bg-primary text-black shadow-lg shadow-primary/20"
                    : "bg-white/5 text-white/70 hover:bg-white/10"
                }`}
              >
                <p className="text-xs font-black uppercase tracking-widest">Mode normal</p>
                <p className={`text-[11px] mt-1 ${mode === "normal" ? "text-black/70" : "text-white/40"}`}>
                  Saisie standard du formulaire et des informations.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setMode("custom")}
                className={`rounded-xl px-4 py-3 text-left transition-all cursor-pointer ${
                  mode === "custom"
                    ? "bg-primary text-black shadow-lg shadow-primary/20"
                    : "bg-white/5 text-white/70 hover:bg-white/10"
                }`}
              >
                <p className="text-xs font-black uppercase tracking-widest">Mode personnalisé</p>
                <p className={`text-[11px] mt-1 ${mode === "custom" ? "text-black/70" : "text-white/40"}`}>
                  Visibilité des blocs : {(customLayout.sections || []).map(s => s.label.toLowerCase()).join(", ")}.
                </p>
              </button>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {numberedBeforeSections.map(({ section, num }) => renderSection(section, num))}

        {itemKey && itemColumns && (
          <div className="glass p-4 md:p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-black italic text-white uppercase">
                  {itemsBlockNumber ? formatDynamicTitle(itemLabel, itemsBlockNumber) : itemLabel}
                </h2>
                <span className="text-xs text-white/40 font-mono">({rows.length}/{maxItems})</span>
              </div>
              <button
                type="button"
                onClick={addRow}
                disabled={rows.length >= maxItems}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/80 hover:bg-white/10 disabled:opacity-40 flex items-center gap-2 cursor-pointer"
              >
                <Plus size={12} /> Ajouter
              </button>
            </div>
            {errors[itemKey] ? (
              <p className="text-xs text-rose-400 font-bold">{errors[itemKey]}</p>
            ) : null}
            <div className="space-y-4">
              {rows.map((row, index) => (
                <div key={index} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Ligne {index + 1}</span>
                    {rows.length > 1 && (
                      <button type="button" onClick={() => removeRow(index)} className="text-white/30 hover:text-rose-400 cursor-pointer">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {visibleItemColumns.map(col => {
                      const cellErr = errors[`${itemKey}_${index}_${col.key}`];
                      const isDateCol =
                        col.kind === "date" ||
                        col.key === "date" ||
                        col.key === "facture_date" ||
                        col.key.startsWith("date_") ||
                        col.key.endsWith("_date") ||
                        col.key.includes("date");
                      const isTimeCol =
                        col.kind === "time" ||
                        col.key === "debut" ||
                        col.key === "fin" ||
                        col.key === "time" ||
                        col.key === "heure" ||
                        col.key === "facture_time" ||
                        col.key.includes("time") ||
                        col.key.includes("heure");
                      const isSelectCol =
                        col.kind === "select" ||
                        Boolean(col.options && col.options.length > 0);

                      if (isDateCol) {
                        return (
                          <div key={col.key} className={`space-y-1 ${col.span === 2 ? "md:col-span-2" : ""}`}>
                            <div className="flex items-center justify-between gap-1 min-h-[16px]">
                              <label className="text-[10px] font-bold text-white/50 uppercase">{formatColumnLabel(col.label)}</label>
                            </div>
                            <CustomDatePicker
                              compact
                              value={String(row[col.key] ?? "")}
                              onChange={val => {
                                updateRow(index, col.key, val);
                                if (cellErr) {
                                  setErrors(prev => {
                                    const next = { ...prev };
                                    delete next[`${itemKey}_${index}_${col.key}`];
                                    delete next[itemKey];
                                    return next;
                                  });
                                }
                              }}
                              hasError={Boolean(cellErr)}
                              dateFormat={(col as any).dateFormat || (String(row[col.key] ?? "").includes(".") ? "dot" : "slash")}
                            />
                            {cellErr ? <p className="text-xs text-rose-400 font-bold">{cellErr}</p> : null}
                          </div>
                        );
                      }

                      if (isTimeCol) {
                        const timeVal = String(row[col.key] ?? "");
                        return (
                          <div key={col.key} className={`space-y-1 ${col.span === 2 ? "md:col-span-2" : ""}`}>
                            <div className="flex items-center justify-between gap-1 min-h-[16px]">
                              <label className="text-[10px] font-bold text-white/50 uppercase">{formatColumnLabel(col.label)}</label>
                            </div>
                            <CustomTimePicker
                              compact
                              value={timeVal}
                              onChange={val => {
                                updateRow(index, col.key, val);
                                if (cellErr) {
                                  setErrors(prev => {
                                    const next = { ...prev };
                                    delete next[`${itemKey}_${index}_${col.key}`];
                                    delete next[itemKey];
                                    return next;
                                  });
                                }
                              }}
                              hasError={Boolean(cellErr)}
                            />
                            {cellErr ? <p className="text-xs text-rose-400 font-bold">{cellErr}</p> : null}
                          </div>
                        );
                      }

                      if (isSelectCol) {
                        const rawVal = String(row[col.key] ?? "");
                        const selectedVal = col.key === "jour" ? normalizeJourValue(rawVal) : rawVal;
                        return (
                          <div key={col.key} className={`space-y-1 ${col.span === 2 ? "md:col-span-2" : ""}`}>
                            <div className="flex items-center justify-between gap-1 min-h-[16px]">
                              <label className="text-[10px] font-bold text-white/50 uppercase">{formatColumnLabel(col.label)}</label>
                            </div>
                            <div className="relative flex items-center">
                              <select
                                value={selectedVal}
                                onChange={e => {
                                  updateRow(index, col.key, e.target.value);
                                  if (cellErr) {
                                    setErrors(prev => {
                                      const next = { ...prev };
                                      delete next[`${itemKey}_${index}_${col.key}`];
                                      delete next[itemKey];
                                      return next;
                                    });
                                  }
                                }}
                                className={`w-full bg-white/5 border ${
                                  cellErr ? "border-rose-500/80 focus:border-rose-500" : "border-white/10 focus:border-primary"
                                } rounded-xl px-3 py-2 h-[38px] text-sm text-white outline-none transition-colors appearance-none cursor-pointer pr-8`}
                              >
                                {(col.options || []).map(opt => (
                                  <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown size={14} className="absolute right-3 pointer-events-none text-white/40" />
                            </div>
                            {cellErr ? <p className="text-xs text-rose-400 font-bold">{cellErr}</p> : null}
                          </div>
                        );
                      }

                      const canRandomize =
                        col.key === "sku" ||
                        col.key === "barcode" ||
                        col.key === "asin" ||
                        col.key === "ean" ||
                        col.key === "ref" ||
                        col.key === "reference" ||
                        col.key === "code" ||
                        col.key === "item_ref";

                      return (
                        <div key={col.key} className={`space-y-1 ${col.span === 2 ? "md:col-span-2" : ""}`}>
                          <div className="flex items-center justify-between gap-1 min-h-[16px]">
                            <label className="text-[10px] font-bold text-white/50 uppercase">{formatColumnLabel(col.label)}</label>
                            {canRandomize && (
                              <button
                                type="button"
                                onClick={() => {
                                  const current = String(row[col.key] ?? "");
                                  const nextVal = generatePatternValue(current || col.placeholder || "", col.key, priceKey);
                                  updateRow(index, col.key, nextVal);
                                  if (cellErr) {
                                    setErrors(prev => {
                                      const next = { ...prev };
                                      delete next[`${itemKey}_${index}_${col.key}`];
                                      delete next[itemKey];
                                      return next;
                                    });
                                  }
                                }}
                                className="text-[10px] font-black uppercase text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer transition-colors"
                                title="Générer de nouveaux caractères"
                              >
                                <RefreshCw size={10} /> Générer
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            inputMode={isMoneyKey(col.key) ? "decimal" : isQtyKey(col.key) ? "numeric" : undefined}
                            value={row[col.key] ?? ""}
                            placeholder={col.placeholder}
                            onChange={e => {
                              let cellVal = e.target.value;
                              if (isMoneyKey(col.key)) {
                                cellVal = sanitizeMoneyInput(cellVal);
                              } else if (isQtyKey(col.key)) {
                                cellVal = sanitizeQtyInput(cellVal);
                              }
                              updateRow(index, col.key, cellVal);
                              if (cellErr) {
                                setErrors(prev => {
                                  const next = { ...prev };
                                  delete next[`${itemKey}_${index}_${col.key}`];
                                  delete next[itemKey];
                                  return next;
                                });
                              }
                            }}
                            className={`w-full bg-white/5 border ${cellErr ? "border-rose-500/80 focus:border-rose-500" : "border-white/10 focus:border-primary"} rounded-xl px-3 py-2 h-[38px] text-sm text-white outline-none transition-colors`}
                          />
                          {cellErr ? <p className="text-xs text-rose-400 font-bold">{cellErr}</p> : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {numberedAfterSections.map(({ section, num }) => renderSection(section, num))}

        {mode === "custom" && customLayout && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <LayoutTemplate className="text-primary" size={20} />
              <div>
                <h2 className="text-lg font-black italic text-white uppercase">Mise en page & Visibilité des blocs</h2>
                <p className="text-xs text-white/40">
                  Activez ou masquez les différentes sections et calques du document.
                </p>
              </div>
            </div>

            {(customLayout?.sections || []).map(section => {
              const master = (customLayout?.blocks || []).find(b => b.section === section.id && b.master);
              const subBlocks = (customLayout?.blocks || []).filter(b => b.section === section.id && !b.master);
              const open = openCustomSections[section.id] !== false;
              const masterOn = master ? customVisible[master.id] !== false : true;

              return (
                <div key={section.id} className={`glass p-4 md:p-6 space-y-5 transition-opacity ${masterOn ? "" : "opacity-60"}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-4 border-b border-white/10">
                    <button
                      type="button"
                      onClick={() => setOpenCustomSections(prev => ({ ...prev, [section.id]: !open }))}
                      className="flex-1 flex items-center justify-between text-left cursor-pointer"
                    >
                      <div>
                        <h3 className="text-lg font-black italic text-white uppercase">{section.label}</h3>
                        <p className="text-[11px] text-white/40">
                          {master ? "1 bloc maître" : ""} {subBlocks.length > 0 ? `· ${subBlocks.length} éléments configurables` : ""}
                        </p>
                      </div>
                      <div className="text-white/40 pr-2">
                        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </button>
                    {master ? (
                      <div className="sm:w-56">
                        <Switch
                          on={customVisible[master.id] !== false}
                          onToggle={() =>
                            setCustomVisible(prev => {
                              const nextVal = prev[master.id] === false;
                              const next = { ...prev, [master.id]: nextVal };
                              for (const sb of subBlocks) {
                                next[sb.id] = nextVal;
                              }
                              return next;
                            })
                          }
                          label={customVisible[master.id] === false ? "Masqué" : "Affiché"}
                        />
                      </div>
                    ) : null}
                  </div>

                  {open && subBlocks.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {subBlocks.map(block => (
                        <div key={block.id} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                          <Switch
                            on={customVisible[block.id] !== false}
                            onToggle={() =>
                              setCustomVisible(prev => {
                                const nextVal = prev[block.id] === false;
                                const next = { ...prev, [block.id]: nextVal };
                                if (nextVal && master && prev[master.id] === false) {
                                  next[master.id] = true;
                                }
                                return next;
                              })
                            }
                            label={block.label}
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/95 backdrop-blur z-50 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 sm:relative sm:bg-transparent sm:border-0 sm:p-0 pb-safe-area">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setFormData(cleanFormData(defaults));
                setManualEmailKeys({});
                setManualDateKeys({});
                setIsCustomCivilite(false);
                setCustomCivilite("");
                setIsAutoTotal(true);
                if (customLayout?.visible) {
                  setCustomVisible(customLayout.visible);
                }
                setErrors({});
                toast.success("Formulaire prérempli avec exemple");
              }}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider text-white/80 hover:bg-white/10 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Sparkles size={14} className="text-amber-400" /> Exemple
            </button>
            <button
              type="button"
              onClick={() => {
                const emptyData = getEmptyFormData(defaults, sections, itemKey, itemBlank);
                setFormData(emptyData);
                setManualEmailKeys({});
                setManualDateKeys({});
                setIsCustomCivilite(false);
                setCustomCivilite("");
                setIsAutoTotal(true);
                if (customLayout?.visible) {
                  setCustomVisible(customLayout.visible);
                }
                setErrors({});
                toast.info("Formulaire réinitialisé");
              }}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider text-white/80 hover:bg-white/10 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw size={14} /> Réinitialiser
            </button>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={handlePreview}
              disabled={isPreviewLoading || isBlocked}
              className="px-6 py-3 rounded-xl bg-slate-800 border border-slate-700 text-xs font-black uppercase tracking-wider text-white hover:bg-slate-700 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {isPreviewLoading ? <RefreshCw className="animate-spin" size={16} /> : <Eye size={16} />}
              {!allowed
                ? "Aperçus éteints"
                : cooldown > 0
                  ? `Aperçu Preview Gratuit (${formatTimer(cooldown)})`
                  : "Aperçu Preview Gratuit"}
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="px-8 py-3 rounded-xl bg-primary text-slate-950 font-black text-xs uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
            >
              {isGenerating ? <RefreshCw className="animate-spin" size={16} /> : <Download size={16} />}
              {generateLabel} ({price.toFixed(2)} €)
            </button>
          </div>
        </div>
      </form>
      {previewUrl ? (
        <DocumentPreviewViewer
          url={previewUrl}
          title={`Aperçu - ${title}`}
          onClose={closePreview}
          onAction={() => handleSubmit()}
          isActionLoading={isGenerating}
          actionLabel={`${generateLabel} (${price.toFixed(2)} €)`}
        />
      ) : null}
    </main>
  );
}
