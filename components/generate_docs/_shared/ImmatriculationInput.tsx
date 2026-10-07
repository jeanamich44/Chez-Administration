"use client";

import React, { useRef } from "react";

/* ===================================================================== */

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
    const parts = s.split(/\s+/);
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

/* ===================================================================== */

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
    onChange(`${newP1}-${newP2}-${newP3}`.replace(/-+$/, ""));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text");
    if (!text) return;
    const [cp1, cp2, cp3] = parseImmatriculation(text);
    update(cp1, cp2, cp3);
    if (cp3 && input3Ref.current) {
      input3Ref.current.focus();
    } else if (cp2 && input2Ref.current) {
      input2Ref.current.focus();
    }
  };

  const borderClass = hasError
    ? "border-rose-500/80 focus-within:border-rose-500"
    : "border-white/10 focus-within:border-primary";

  return (
    <div className={`relative flex items-center gap-1.5 w-full ${className}`}>
      <div className="flex items-center gap-1.5 w-full">
        <input
          ref={input1Ref}
          type="text"
          value={p1}
          placeholder={ph1}
          maxLength={4}
          onPaste={handlePaste}
          onChange={e => {
            const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
            update(v, p2, p3);
            if (v.length >= 2 && input2Ref.current) {
              input2Ref.current.focus();
              input2Ref.current.select();
            }
          }}
          className={`w-1/3 bg-white/5 border ${borderClass} rounded-xl px-2 py-2 text-center text-xs font-mono font-bold uppercase tracking-wider text-white outline-none`}
        />

        <span className="text-white/30 font-bold text-xs">-</span>

        <input
          ref={input2Ref}
          type="text"
          value={p2}
          placeholder={ph2}
          maxLength={4}
          onPaste={handlePaste}
          onKeyDown={e => {
            if (e.key === "Backspace" && !p2 && input1Ref.current) {
              input1Ref.current.focus();
            }
          }}
          onChange={e => {
            const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
            update(p1, v, p3);
            if (v.length >= 3 && input3Ref.current) {
              input3Ref.current.focus();
              input3Ref.current.select();
            }
          }}
          className={`w-1/3 bg-white/5 border ${borderClass} rounded-xl px-2 py-2 text-center text-xs font-mono font-bold uppercase tracking-wider text-white outline-none`}
        />

        <span className="text-white/30 font-bold text-xs">-</span>

        <input
          ref={input3Ref}
          type="text"
          value={p3}
          placeholder={ph3}
          maxLength={4}
          onPaste={handlePaste}
          onKeyDown={e => {
            if (e.key === "Backspace" && !p3 && input2Ref.current) {
              input2Ref.current.focus();
            }
          }}
          onChange={e => {
            const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
            update(p1, p2, v);
          }}
          className={`w-1/3 bg-white/5 border ${borderClass} rounded-xl px-2 py-2 text-center text-xs font-mono font-bold uppercase tracking-wider text-white outline-none`}
        />
      </div>
    </div>
  );
}
