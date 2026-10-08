"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export type PreviewPolicy = {
  enabled: boolean;
  seconds: number;
  allowed: boolean;
  off: boolean;
};

export type PreviewCategory = "rib" | "releve" | "assurance" | "facture" | "justificatif" | "emploi";

export type GenerateDocsPublicConfig = {
  isActive: boolean;
  prices: Record<string, number>;
  previewCooldownEnabled: boolean;
  previewCooldownSeconds: number;
  previewOff?: boolean;
  previewAllowed?: boolean;
  subcategories: Record<
    string,
    {
      enabled: boolean;
      active?: boolean;
      documents?: Record<string, { enabled?: boolean; active?: boolean } | boolean>;
    }
  >;
};

const FALLBACK_POLICY: PreviewPolicy = { enabled: true, seconds: 600, allowed: true, off: false };

const CATEGORY_LABEL: Record<PreviewCategory, string> = {
  rib: "RIB",
  releve: "relevé",
  assurance: "assurance",
  facture: "facture",
  justificatif: "justificatif",
  emploi: "bulletin de paie"
};

export function previewCooldownStorageKey(category: PreviewCategory) {
  return `generate_docs_preview_until_${category}`;
}

function isLegacyKey(category: PreviewCategory, key: string) {
  if (category === "rib") return key.endsWith("_rib_preview_cooldown_until");
  if (category === "releve") return key.includes("releve_preview_cooldown");
  if (category === "assurance") return key.includes("assurance_preview_cooldown");
  if (category === "emploi") return key.includes("emploi_preview_cooldown");
  return false;
}

function parseUntil(raw: string | null) {
  const until = parseInt(raw || "", 10);
  return Number.isFinite(until) && until > Date.now() ? until : 0;
}

function remainingFromUntil(until: number) {
  return until > 0 ? Math.max(0, Math.floor((until - Date.now()) / 1000)) : 0;
}

function readCategoryUntil(category: PreviewCategory) {
  const key = previewCooldownStorageKey(category);
  let until = 0;
  try {
    until = parseUntil(localStorage.getItem(key));
    for (let i = 0; i < localStorage.length; i++) {
      const storedKey = localStorage.key(i);
      if (!storedKey || storedKey === key || !isLegacyKey(category, storedKey)) continue;
      until = Math.max(until, parseUntil(localStorage.getItem(storedKey)));
    }
    if (until > 0) localStorage.setItem(key, String(until));
  } catch {}
  return until;
}

export function formatPreviewTimer(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

let _cachedConfig: GenerateDocsPublicConfig | null = null;
let _cachedConfigPromise: Promise<GenerateDocsPublicConfig | null> | null = null;

export async function fetchGenerateDocsConfig(force: boolean = false): Promise<GenerateDocsPublicConfig | null> {
  if (force) {
    _cachedConfig = null;
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("generate_docs_config_cache");
      } catch {}
    }
  } else {
    if (_cachedConfig) return _cachedConfig;
    if (_cachedConfigPromise) return _cachedConfigPromise;
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("generate_docs_config_cache");
        if (stored) {
          _cachedConfig = JSON.parse(stored) as GenerateDocsPublicConfig;
          return _cachedConfig;
        }
      } catch {}
    }
  }

  _cachedConfigPromise = (async () => {
    try {
      const res = await fetch("/api/generate-docs/config", { cache: "no-store" });
      if (!res.ok) return null;
      const data = (await res.json()) as GenerateDocsPublicConfig;
      _cachedConfig = data;
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("generate_docs_config_cache", JSON.stringify(data));
        } catch {}
      }
      return data;
    } catch {
      return null;
    } finally {
      _cachedConfigPromise = null;
    }
  })();
  return _cachedConfigPromise;
}

/* ===================================================================== */

export function isDocumentEnabled(
  config: GenerateDocsPublicConfig | null | undefined,
  category: string,
  slug: string
): boolean {
  if (!config) return true;
  if (config.isActive === false) return false;
  const sub = config.subcategories?.[category];
  if (!sub) return true;
  if (sub.enabled === false || sub.active === false) return false;
  const docs = sub.documents;
  if (!docs || typeof docs !== "object") return true;
  const doc = docs[slug];
  if (doc === undefined || doc === null) return true;
  if (typeof doc === "boolean") return doc;
  if (typeof doc === "object") {
    if (typeof doc.enabled === "boolean") return doc.enabled;
    if (typeof doc.active === "boolean") return doc.active;
  }
  return true;
}

/* ===================================================================== */

export function isCategoryEnabled(
  config: GenerateDocsPublicConfig | null | undefined,
  category: string
): boolean {
  if (!config) return true;
  if (config.isActive === false) return false;
  const sub = config.subcategories?.[category];
  if (!sub) return true;
  return sub.enabled !== false && sub.active !== false;
}

export async function fetchPreviewPolicy(): Promise<PreviewPolicy> {
  const data = await fetchGenerateDocsConfig();
  if (!data) return FALLBACK_POLICY;
  const seconds = Number(data.previewCooldownSeconds);
  const off = Boolean(data.previewOff);
  const allowed = data.previewAllowed !== false;
  const cooldownOn = !off && Boolean(data.previewCooldownEnabled) && Number.isFinite(seconds) && seconds > 0;
  return {
    enabled: cooldownOn,
    seconds: Number.isFinite(seconds) ? Math.max(0, Math.round(seconds)) : FALLBACK_POLICY.seconds,
    allowed,
    off
  };
}

export function usePreviewCooldown(category: PreviewCategory) {
  const storageKey = previewCooldownStorageKey(category);
  const [cooldown, setCooldown] = useState(0);
  const [policy, setPolicy] = useState<PreviewPolicy>(FALLBACK_POLICY);

  const syncFromStorage = useCallback(() => {
    const remaining = remainingFromUntil(readCategoryUntil(category));
    setCooldown(remaining);
    if (remaining <= 0) localStorage.removeItem(storageKey);
    return remaining;
  }, [category, storageKey]);

  useEffect(() => {
    let cancelled = false;
    fetchPreviewPolicy().then(next => {
      if (!cancelled) setPolicy(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!policy.enabled || policy.seconds <= 0) {
      setCooldown(0);
      return;
    }
    syncFromStorage();
  }, [policy, syncFromStorage]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key && event.key !== storageKey && !isLegacyKey(category, event.key)) return;
      syncFromStorage();
    };
    const onFocus = () => syncFromStorage();
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, [category, storageKey, syncFromStorage]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          localStorage.removeItem(storageKey);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown, storageKey]);

  const assertReady = useCallback(() => {
    if (!policy.allowed) {
      toast.error("Les aperçus sont éteints.");
      return false;
    }
    if (!policy.enabled || policy.seconds <= 0) return true;
    const remaining = remainingFromUntil(readCategoryUntil(category));
    if (remaining <= 0) {
      localStorage.removeItem(storageKey);
      setCooldown(0);
      return true;
    }
    setCooldown(remaining);
    toast.warning(
      `Veuillez patienter ${formatPreviewTimer(remaining)} avant le prochain aperçu ${CATEGORY_LABEL[category]}.`
    );
    return false;
  }, [category, policy.allowed, policy.enabled, policy.seconds, storageKey]);

  const startCooldown = useCallback(() => {
    if (!policy.enabled || policy.seconds <= 0) return;
    localStorage.setItem(storageKey, String(Date.now() + policy.seconds * 1000));
    setCooldown(policy.seconds);
  }, [policy.enabled, policy.seconds, storageKey]);

  return {
    cooldown,
    isBlocked: !policy.allowed || (policy.enabled && cooldown > 0),
    allowed: policy.allowed,
    policy,
    assertReady,
    startCooldown,
    formatTimer: formatPreviewTimer
  };
}
