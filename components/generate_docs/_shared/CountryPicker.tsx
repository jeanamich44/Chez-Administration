"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, Globe } from "lucide-react";

/* ===================================================================== */

export interface CountryItem {
  code: string;
  label: string;
}

export const COUNTRIES: CountryItem[] = [
  { code: "FR", label: "France" },
  { code: "BE", label: "Belgique" },
  { code: "CH", label: "Suisse" },
  { code: "LU", label: "Luxembourg" },
  { code: "MC", label: "Monaco" },
  { code: "AD", label: "Andorre" },
  { code: "DE", label: "Allemagne" },
  { code: "ES", label: "Espagne" },
  { code: "IT", label: "Italie" },
  { code: "GB", label: "Royaume-Uni" },
  { code: "PT", label: "Portugal" },
  { code: "NL", label: "Pays-Bas" },
  { code: "AT", label: "Autriche" },
  { code: "IE", label: "Irlande" },
  { code: "PL", label: "Pologne" },
  { code: "SE", label: "Suède" },
  { code: "NO", label: "Norvège" },
  { code: "DK", label: "Danemark" },
  { code: "FI", label: "Finlande" },
  { code: "GR", label: "Grèce" },
  { code: "CZ", label: "République Tchèque" },
  { code: "RO", label: "Roumanie" },
  { code: "HU", label: "Hongrie" },
  { code: "SK", label: "Slovaquie" },
  { code: "BG", label: "Bulgarie" },
  { code: "HR", label: "Croatie" },
  { code: "SI", label: "Slovénie" },
  { code: "EE", label: "Estonie" },
  { code: "LV", label: "Lettonie" },
  { code: "LT", label: "Lituanie" },
  { code: "CY", label: "Chypre" },
  { code: "MT", label: "Malte" },
  { code: "IS", label: "Islande" },
  { code: "US", label: "États-Unis" },
  { code: "CA", label: "Canada" },
  { code: "MA", label: "Maroc" },
  { code: "DZ", label: "Algérie" },
  { code: "TN", label: "Tunisie" }
];

function normalizeStr(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

interface CountryPickerProps {
  value: string;
  onChange: (val: string) => void;
  hasError?: boolean;
  placeholder?: string;
  compact?: boolean;
}

/* ===================================================================== */

export default function CountryPicker({
  value,
  onChange,
  hasError = false,
  placeholder = "Sélectionner un pays",
  compact = false
}: CountryPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCountry = useMemo(() => {
    if (!value) return null;
    const vNorm = normalizeStr(value);
    return (
      COUNTRIES.find(c => c.code.toLowerCase() === value.toLowerCase() || normalizeStr(c.label) === vNorm) || {
        code: value.toUpperCase(),
        label: value
      }
    );
  }, [value]);

  const filtered = useMemo(() => {
    if (!query.trim()) return COUNTRIES;
    const qNorm = normalizeStr(query);
    return COUNTRIES.filter(c => normalizeStr(c.label).includes(qNorm) || c.code.toLowerCase().includes(qNorm));
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSelect = (c: CountryItem) => {
    onChange(c.code);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-white/5 border ${
          hasError ? "border-rose-500/80" : isOpen ? "border-primary ring-1 ring-primary/30" : "border-white/10"
        } rounded-xl ${compact ? "px-3 py-2 h-[38px] text-xs" : "px-3.5 py-2.5 text-xs"} text-left text-white hover:border-white/20 transition-all cursor-pointer`}
      >
        <div className="flex items-center gap-2 truncate">
          <Globe size={13} className="text-white/40 shrink-0" />
          {selectedCountry ? (
            <span className="font-semibold truncate">
              {selectedCountry.label}{" "}
              <span className="text-[10px] text-white/40 font-mono">({selectedCountry.code})</span>
            </span>
          ) : (
            <span className="text-white/30">{placeholder}</span>
          )}
        </div>
        <ChevronDown size={13} className={`text-white/40 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full rounded-2xl bg-[#0c1322]/98 border border-white/15 backdrop-blur-2xl shadow-2xl shadow-black/80 p-2 overflow-hidden left-0">
          <div className="relative mb-1.5">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher un pays..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/30 outline-none focus:border-primary"
            />
          </div>

          <div className="max-h-52 overflow-y-auto space-y-0.5 custom-scrollbar">
            {filtered.length > 0 ? (
              filtered.map(c => {
                const isSelected = selectedCountry?.code === c.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleSelect(c)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                      isSelected ? "bg-primary/20 text-primary font-bold" : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span>{c.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-white/40">{c.code}</span>
                      {isSelected && <Check size={13} className="text-primary" />}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-4 text-center text-xs text-white/40">Aucun pays trouvé</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
