"use client";

import React, { useRef } from "react";

/* ===================================================================== */

interface TicketCaisseInputProps {
  value: string;
  onChange: (val: string) => void;
  hasError?: boolean;
  className?: string;
}

/* ===================================================================== */

export function parseTicketCaisse(val: unknown): [string, string, string] {
  if (!val || typeof val !== "string") return ["FR75", "13", "7687"];
  const s = val.trim();
  if (s.includes("-")) {
    const parts = s.split("-").map(p => p.trim());
    return [parts[0] || "", parts[1] || "", parts[2] || ""];
  }
  if (s.includes(" ")) {
    const parts = s.split(/\\s+/).map(p => p.trim());
    return [parts[0] || "", parts[1] || "", parts[2] || ""];
  }
  const m = s.match(/^([A-Za-z]{2}\d{2})(\d{1,3})(\d{3,6})$/);
  if (m) {
    return [m[1].toUpperCase(), m[2], m[3]];
  }
  return [s.slice(0, 4), s.slice(4, 6), s.slice(6)];
}

/* ===================================================================== */

export default function TicketCaisseInput({
  value,
  onChange,
  hasError = false,
  className = ""
}: TicketCaisseInputProps) {
  const in1Ref = useRef<HTMLInputElement>(null);
  const in2Ref = useRef<HTMLInputElement>(null);
  const in3Ref = useRef<HTMLInputElement>(null);

  const [p1, p2, p3] = parseTicketCaisse(value);

  const update = (newP1: string, newP2: string, newP3: string) => {
    if (!newP1 && !newP2 && !newP3) {
      onChange("");
      return;
    }
    onChange(`${newP1} ${newP2} ${newP3}`.trim());
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text");
    if (!text) return;
    const [cp1, cp2, cp3] = parseTicketCaisse(text);
    if (cp1 || cp2 || cp3) {
      update(cp1, cp2, cp3);
      if (cp3) in3Ref.current?.focus();
      else if (cp2) in2Ref.current?.focus();
      else in1Ref.current?.focus();
    }
  };

  return (
    <div
      className={
        className ||
        `w-full bg-white/5 border ${
          hasError
            ? "border-rose-500/80 focus-within:border-rose-500"
            : "border-white/10 focus-within:border-primary"
        } rounded-xl h-[46px] px-4 flex items-center justify-center gap-2 sm:gap-3 transition-colors`
      }
    >
      <input
        ref={in1Ref}
        type="text"
        maxLength={5}
        value={p1}
        placeholder="FR75"
        onChange={e => {
          const raw = e.target.value.replace(/[\\s-]/g, "").toUpperCase();
          update(raw, p2, p3);
          if (raw.length >= 4) in2Ref.current?.focus();
        }}
        onKeyDown={e => {
          if (e.key === "-" || e.key === " " || e.key === "Enter") {
            e.preventDefault();
            in2Ref.current?.focus();
          }
        }}
        onPaste={handlePaste}
        className="w-16 sm:w-20 bg-transparent text-center font-mono font-bold text-sm sm:text-base text-white uppercase outline-none placeholder:text-white/20 tracking-wider"
      />

      <span className="text-white/40 font-bold select-none text-sm sm:text-base">-</span>

      <input
        ref={in2Ref}
        type="text"
        maxLength={4}
        value={p2}
        placeholder="13"
        onChange={e => {
          const raw = e.target.value.replace(/[\\s-]/g, "");
          update(p1, raw, p3);
          if (raw.length >= 2) in3Ref.current?.focus();
        }}
        onKeyDown={e => {
          if (e.key === "-" || e.key === " " || e.key === "Enter") {
            e.preventDefault();
            in3Ref.current?.focus();
          } else if (e.key === "Backspace" && !p2) {
            in1Ref.current?.focus();
          }
        }}
        onPaste={handlePaste}
        className="w-12 sm:w-16 bg-transparent text-center font-mono font-bold text-sm sm:text-base text-white outline-none placeholder:text-white/20 tracking-wider"
      />

      <span className="text-white/40 font-bold select-none text-sm sm:text-base">-</span>

      <input
        ref={in3Ref}
        type="text"
        maxLength={6}
        value={p3}
        placeholder="7687"
        onChange={e => {
          const raw = e.target.value.replace(/[\\s-]/g, "");
          update(p1, p2, raw);
        }}
        onKeyDown={e => {
          if (e.key === "Backspace" && !p3) {
            in2Ref.current?.focus();
          }
        }}
        onPaste={handlePaste}
        className="w-16 sm:w-20 bg-transparent text-center font-mono font-bold text-sm sm:text-base text-white outline-none placeholder:text-white/20 tracking-wider"
      />
    </div>
  );
}
