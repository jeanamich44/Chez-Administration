"use client";

import React, { useRef } from "react";

interface ImmatriculationInputProps {
  value: string;
  onChange: (val: string) => void;
  hasError?: boolean;
  placeholder?: string;
  className?: string;
}

export function parseImmatriculation(val: unknown): [string, string, string] {
  if (!val || typeof val !== "string") return ["", "", ""];
  const s = val.trim().toUpperCase();
  if (s.includes("-")) {
    const parts = s.split("-");
    return [
      (parts[0] || "").replace(/[^A-Z0-9]/g, "").slice(0, 4),
      (parts[1] || "").replace(/[^A-Z0-9]/g, "").slice(0, 4),
      (parts[2] || "").replace(/[^A-Z0-9]/g, "").slice(0, 4)
    ];
  }
  if (s.includes(" ")) {
    const parts = s.split(/\\s+/);
    return [
      (parts[0] || "").replace(/[^A-Z0-9]/g, "").slice(0, 4),
      (parts[1] || "").replace(/[^A-Z0-9]/g, "").slice(0, 4),
      (parts[2] || "").replace(/[^A-Z0-9]/g, "").slice(0, 4)
    ];
  }
  const clean = s.replace(/[^A-Z0-9]/g, "");
  if (/^[A-Z]{2}[0-9]{3}[A-Z]{2}$/.test(clean)) {
    return [clean.slice(0, 2), clean.slice(2, 5), clean.slice(5, 7)];
  }
  const fni = clean.match(/^([0-9]{1,4})([A-Z]{1,3})([0-9A-Z]{1,3})$/);
  if (fni) {
    return [fni[1], fni[2], fni[3]];
  }
  return [clean.slice(0, 4), "", ""];
}

export default function ImmatriculationInput({
  value,
  onChange,
  hasError = false,
  placeholder = "FA-120-GM",
  className = ""
}: ImmatriculationInputProps) {
  const input1Ref = useRef<HTMLInputElement>(null);
  const input2Ref = useRef<HTMLInputElement>(null);
  const input3Ref = useRef<HTMLInputElement>(null);

  const [p1, p2, p3] = parseImmatriculation(value);
  const [ph1, ph2, ph3] = parseImmatriculation(placeholder || "AA-123-AA");

  const update = (newP1: string, newP2: string, newP3: string) => {
    if (!newP1 && !newP2 && !newP3) {
      onChange("");
      return;
    }
    onChange(`${newP1}-${newP2}-${newP3}`);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text");
    if (!text) return;
    const [cp1, cp2, cp3] = parseImmatriculation(text);
    if (cp1 || cp2 || cp3) {
      update(cp1, cp2, cp3);
      if (cp3) {
        input3Ref.current?.focus();
      } else if (cp2) {
        input2Ref.current?.focus();
      } else {
        input1Ref.current?.focus();
      }
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
        ref={input1Ref}
        type="text"
        maxLength={4}
        value={p1}
        placeholder={ph1 || "AA"}
        onChange={e => {
          const raw = e.target.value;
          if (raw.endsWith("-") || raw.endsWith(" ")) {
            const next = raw.slice(0, -1).replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 4);
            update(next, p2, p3);
            input2Ref.current?.focus();
            return;
          }
          const next = raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 4);
          update(next, p2, p3);
        }}
        onKeyDown={e => {
          if (e.key === "-" || e.key === " " || e.key === "Enter") {
            e.preventDefault();
            input2Ref.current?.focus();
          }
        }}
        onPaste={handlePaste}
        className="w-14 sm:w-16 bg-transparent text-center font-mono font-bold text-sm sm:text-base text-white uppercase outline-none placeholder:text-white/20 tracking-wider"
      />

      <span className="text-white/40 font-bold select-none text-sm sm:text-base">-</span>

      <input
        ref={input2Ref}
        type="text"
        maxLength={4}
        value={p2}
        placeholder={ph2 || "123"}
        onChange={e => {
          const raw = e.target.value;
          if (raw.endsWith("-") || raw.endsWith(" ")) {
            const next = raw.slice(0, -1).replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 4);
            update(p1, next, p3);
            input3Ref.current?.focus();
            return;
          }
          const next = raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 4);
            update(p1, next, p3);
        }}
        onKeyDown={e => {
          if (e.key === "-" || e.key === " " || e.key === "Enter") {
            e.preventDefault();
            input3Ref.current?.focus();
          } else if (e.key === "Backspace" && !p2) {
            input1Ref.current?.focus();
          }
        }}
        onPaste={handlePaste}
        className="w-14 sm:w-16 bg-transparent text-center font-mono font-bold text-sm sm:text-base text-white uppercase outline-none placeholder:text-white/20 tracking-wider"
      />

      <span className="text-white/40 font-bold select-none text-sm sm:text-base">-</span>

      <input
        ref={input3Ref}
        type="text"
        maxLength={4}
        value={p3}
        placeholder={ph3 || "AA"}
        onChange={e => {
          const raw = e.target.value;
          const next = raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 4);
          update(p1, p2, next);
        }}
        onKeyDown={e => {
          if (e.key === "Backspace" && !p3) {
            input2Ref.current?.focus();
          }
        }}
        onPaste={handlePaste}
        className="w-14 sm:w-16 bg-transparent text-center font-mono font-bold text-sm sm:text-base text-white uppercase outline-none placeholder:text-white/20 tracking-wider"
      />
    </div>
  );
}
