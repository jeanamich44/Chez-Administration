"use client";

import { useEffect, useState, useCallback } from "react";

export interface CachedFormRecord {
  id?: string;
  category: string;
  slug: string;
  title?: string;
  version: number;
  schema: any;
  cachedAt: number;
}

const MEMORY_CACHE = new Map<string, CachedFormRecord>();

function getStorageKey(category: string, slug: string): string {
  return `gendocs_schema_${category}_${slug}`;
}

export function normalizeFormSchema(raw: any): any {
  let schema = raw;
  while (typeof schema === "string") {
    try {
      schema = JSON.parse(schema);
    } catch {
      break;
    }
  }
  return schema && typeof schema === "object" ? schema : {};
}

export function getCachedFormSchema(category: string, slug: string): CachedFormRecord | null {
  const key = `${category}:${slug}`;
  if (MEMORY_CACHE.has(key)) {
    return MEMORY_CACHE.get(key)!;
  }

  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem(getStorageKey(category, slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !parsed.schema) return null;
    if (
      parsed.schema?.defaults?.nom === "Kazarian" ||
      (category === "facture" && slug === "chanel" && (parsed.version || 1) < 2) ||
      (category === "facture" && slug === "sfr" && (parsed.version || 1) < 2) ||
      (category === "facture" && slug === "gaz" && (parsed.version || 1) < 2)
    ) {
      localStorage.removeItem(getStorageKey(category, slug));
      return null;
    }

    const record: CachedFormRecord = {
      id: parsed.id,
      category,
      slug,
      title: parsed.title,
      version: typeof parsed.version === "number" ? parsed.version : 1,
      schema: normalizeFormSchema(parsed.schema),
      cachedAt: typeof parsed.cachedAt === "number" ? parsed.cachedAt : Date.now()
    };

    MEMORY_CACHE.set(key, record);
    return record;
  } catch {
    return null;
  }
}

export function setCachedFormSchema(
  category: string,
  slug: string,
  data: { schema: any; version: number; title?: string; id?: string }
): CachedFormRecord {
  const key = `${category}:${slug}`;
  const record: CachedFormRecord = {
    id: data.id,
    category,
    slug,
    title: data.title,
    version: typeof data.version === "number" ? data.version : 1,
    schema: normalizeFormSchema(data.schema),
    cachedAt: Date.now()
  };

  MEMORY_CACHE.set(key, record);

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(getStorageKey(category, slug), JSON.stringify(record));
    } catch {}
  }

  return record;
}

export async function fetchFormSchema(category: string, slug: string): Promise<CachedFormRecord | null> {
  const res = await fetch(`/api/generate-docs/forms/${category}/${slug}`, { cache: "no-store" });
  if (!res.ok) {
    const key = `${category}:${slug}`;
    MEMORY_CACHE.delete(key);
    if (typeof window !== "undefined") {
      try { localStorage.removeItem(getStorageKey(category, slug)); } catch {}
    }
    return null;
  }

  const data = await res.json();
  if (!data || !data.schema || data.isActive === false) {
    const key = `${category}:${slug}`;
    MEMORY_CACHE.delete(key);
    if (typeof window !== "undefined") {
      try { localStorage.removeItem(getStorageKey(category, slug)); } catch {}
    }
    return null;
  }

  return setCachedFormSchema(category, slug, {
    schema: data.schema,
    version: data.version || 1,
    title: data.title,
    id: data.id
  });
}

export function useFormSchema(category: string, slug: string) {
  const [record, setRecord] = useState<CachedFormRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const updated = await fetchFormSchema(category, slug);
      if (updated) {
        setRecord(updated);
        setError(null);
        setIsLoading(false);
      } else {
        setRecord(null);
        setError("Document indisponible ou accès restreint.");
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || "Erreur de chargement");
      setIsLoading(false);
    }
  }, [category, slug]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      const key = `${category}:${slug}`;
      const cached = getCachedFormSchema(category, slug);
      if (cached) {
        setRecord(cached);
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }

      try {
        const res = await fetch(`/api/generate-docs/forms/${category}/${slug}`, { cache: "no-store" });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const msg = errData.detail || (res.status === 403 ? "Accès restreint à ce document." : "Ce document est actuellement indisponible.");
          MEMORY_CACHE.delete(key);
          if (typeof window !== "undefined") {
            try { localStorage.removeItem(getStorageKey(category, slug)); } catch {}
          }
          if (isMounted) {
            setRecord(null);
            setError(msg);
          }
          return;
        }

        const data = await res.json();
        if (!isMounted) return;

        if (!data || !data.schema || data.isActive === false) {
          MEMORY_CACHE.delete(key);
          if (typeof window !== "undefined") {
            try { localStorage.removeItem(getStorageKey(category, slug)); } catch {}
          }
          setRecord(null);
          setError("Ce document est actuellement désactivé.");
          return;
        }

        const remoteVersion = typeof data.version === "number" ? data.version : 1;
        const schemaChanged = !cached || remoteVersion !== cached.version || JSON.stringify(data.schema) !== JSON.stringify(cached.schema);
        if (schemaChanged) {
          const updated = setCachedFormSchema(category, slug, {
            schema: data.schema,
            version: remoteVersion,
            title: data.title,
            id: data.id
          });
          if (isMounted) {
            setRecord(updated);
            setError(null);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || "Erreur de chargement.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [category, slug]);

  return {
    schema: record?.schema || null,
    version: record?.version || 1,
    title: record?.title,
    isLoading: isLoading && !record?.schema,
    error,
    refresh
  };
}
