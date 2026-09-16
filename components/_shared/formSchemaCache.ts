"use client"
import { useEffect, useState } from 'react';

/* ========================================= */

export interface FormField { key: string; label: string; type: string; placeholder?: string; required?: boolean; options?: { value: string; label: string }[]; grid?: string; maxLength?: number; sanitize?: string; autoIban?: boolean; }
export interface FormSection { title: string; icon?: string; fields: FormField[]; condition?: string; }
export interface FormSchema { sections: FormSection[]; defaults: Record<string, any>; metadata?: Record<string, any>; itemBlank?: Record<string, any>; itemColumns?: any[]; customLayout?: any; }
export interface CacheEntry { schema: FormSchema; version: number; timestamp: number; }

/* ========================================= */

const MEM_CACHE: Record<string, CacheEntry> = {};
const CACHE_TTL = 1000 * 60 * 30;

/* ========================================= */

function cacheKey(cat: string, slug: string) { return `fsc_${cat}_${slug}`; }

/* ========================================= */

export function getCachedFormSchema(cat: string, slug: string): CacheEntry | null {
  const key = cacheKey(cat, slug);
  if (MEM_CACHE[key] && Date.now() - MEM_CACHE[key].timestamp < CACHE_TTL) return MEM_CACHE[key];
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as CacheEntry;
      if (Date.now() - parsed.timestamp < CACHE_TTL) {
        MEM_CACHE[key] = parsed;
        return parsed;
      }
    }
  } catch {}
  return null;
}

/* ========================================= */

export function setCachedFormSchema(cat: string, slug: string, schema: FormSchema, version: number) {
  const entry: CacheEntry = { schema, version, timestamp: Date.now() };
  const key = cacheKey(cat, slug);
  MEM_CACHE[key] = entry;
  try { localStorage.setItem(key, JSON.stringify(entry)); } catch {}
}

/* ========================================= */

export function useFormSchema(category: string, slug: string) {
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [version, setVersion] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = getCachedFormSchema(category, slug);
    if (cached) {
      setSchema(cached.schema);
      setVersion(cached.version);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    fetch(`/api/proxy/generate-docs/forms/${category}/${slug}`)
      .then(r => { if (!r.ok) throw new Error('Formulaire indisponible'); return r.json(); })
      .then(data => {
        const s = data.schema || data;
        const v = data.version || 1;
        setCachedFormSchema(category, slug, s, v);
        setSchema(s);
        setVersion(v);
      })
      .catch(e => setError(e.message || 'Erreur de chargement'))
      .finally(() => setIsLoading(false));
  }, [category, slug]);

  return { schema, version, isLoading, error };
}
