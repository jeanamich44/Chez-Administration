"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, Globe } from "lucide-react";

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
  return s.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase().trim();
}

interface CountryPickerProps {
  value: string;
  onChange: (val: string) => void;
  hasError?: boolean;
  placeholder?: string;
}

export default function CountryPicker({
  value,
  onChange,
  hasError = false,
  placeholder = "Sélectionner un pays..."
}: CountryPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const currentCountry = useMemo(() => {
    const raw = String(value || "").trim();
    if (!raw) return null;
    const vUpper = raw.toUpperCase();
    const vNorm = normalizeStr(raw);
    return (
      COUNTRIES.find(
        c =>
          c.code.toUpperCase() === vUpper ||
          c.label.toUpperCase() === vUpper ||
          normalizeStr(c.label) === vNorm
      ) || null
    );
  }, [value]);

  const filteredCountries = useMemo(() => {
    const q = normalizeStr(search);
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(c => {
      const matchLabel = normalizeStr(c.label).includes(q);
      const matchCode = normalizeStr(c.code).includes(q);
      return matchLabel || matchCode;
    });
  }, [search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch("");
    }
  }, [isOpen]);

  const handleSelect = (c: CountryItem) => {
    onChange(c.code);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-full flex items-center justify-between gap-3 bg-white/5 border ${
          hasError ? "border-rose-500/80 focus:border-rose-500" : "border-white/10 focus:border-primary"
        } rounded-xl px-4 py-3 text-sm text-left transition-colors cursor-pointer group`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Globe size={16} className="text-white/40 group-hover:text-primary transition-colors shrink-0" />
          {currentCountry ? (
            <div className="flex items-center gap-2 truncate">
              <span className="text-white font-medium truncate">{currentCountry.label}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-primary font-bold shrink-0">
                {currentCountry.code}
              </span>
            </div>
          ) : (
            <span className="text-white/40 truncate">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`text-white/40 transition-transform shrink-0 ${isOpen ? "rotate-180 text-primary" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-[#0c1322]/95 border border-white/15 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-black/80 overflow-hidden">
          <div className="p-3 border-b border-white/10 flex items-center gap-2">
            <Search size={14} className="text-white/40 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un pays ou code (ex: France, ES)..."
              className="w-full bg-transparent text-xs text-white placeholder-white/40 outline-none select-text"
            />
          </div>
          <div className="max-h-60 overflow-y-auto divide-y divide-white/5 py-1">
            {filteredCountries.length === 0 ? (
              <div className="px-4 py-3 text-xs text-white/40 text-center">
                Aucun pays correspondant
              </div>
            ) : (
              filteredCountries.map(c => {
                const isSelected = currentCountry?.code === c.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleSelect(c)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-xs text-left transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-primary/20 text-white font-bold"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="truncate">{c.label}</span>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-white/60 font-bold">
                        {c.code}
                      </span>
                      {isSelected ? <Check size={14} className="text-primary" /> : null}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
