"use client";

import React, { useRef } from "react";

/* ===================================================================== */

interface TicketCaisseInputProps {
  value: string;
  onChange: (val: string) => void;
  hasError?: boolean;
  className?: string;
}

export function parseTicketCaisse(val: unknown): [string, string, string] {
  if (!val || typeof val !== "string") return ["FR75", "13", "7687"];
  const s = val.trim();
  if (s.includes("-")) {
    const parts = s.split("-").map(p => p.trim());
    return [parts[0] || "", parts[1] || "", parts[2] || ""];
  }
  if (s.includes(" ")) {
    const parts = s.split(/\s+/).map(p => p.trim());
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
    update(cp1, cp2, cp3);
    if (cp3 && in3Ref.current) {
      in3Ref.current.focus();
    } else if (cp2 && in2Ref.current) {
      in2Ref.current.focus();
    }
  };

  const borderClass = hasError
    ? "border-rose-500/80 focus-within:border-rose-500"
    : "border-white/10 focus-within:border-primary";

  return (
    <div className={`relative flex items-center gap-1.5 w-full ${className}`}>
      <div className="flex items-center gap-1.5 w-full">
        <input
          ref={in1Ref}
          type="text"
          value={p1}
          placeholder="FR75"
          maxLength={6}
          onPaste={handlePaste}
          onChange={e => {
            const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
            update(v, p2, p3);
            if (v.length >= 4 && in2Ref.current) {
              in2Ref.current.focus();
              in2Ref.current.select();
            }
          }}
          className={`w-1/3 bg-white/5 border ${borderClass} rounded-xl px-2 py-2 text-center text-xs font-mono font-bold uppercase tracking-wider text-white outline-none`}
        />

        <span className="text-white/30 font-bold text-xs">-</span>

        <input
          ref={in2Ref}
          type="text"
          value={p2}
          placeholder="13"
          maxLength={4}
          onPaste={handlePaste}
          onKeyDown={e => {
            if (e.key === "Backspace" && !p2 && in1Ref.current) {
              in1Ref.current.focus();
            }
          }}
          onChange={e => {
            const v = e.target.value.replace(/\D/g, "");
            update(p1, v, p3);
            if (v.length >= 2 && in3Ref.current) {
              in3Ref.current.focus();
              in3Ref.current.select();
            }
          }}
          className={`w-1/3 bg-white/5 border ${borderClass} rounded-xl px-2 py-2 text-center text-xs font-mono font-bold uppercase tracking-wider text-white outline-none`}
        />

        <span className="text-white/30 font-bold text-xs">-</span>

        <input
          ref={in3Ref}
          type="text"
          value={p3}
          placeholder="7687"
          maxLength={6}
          onPaste={handlePaste}
          onKeyDown={e => {
            if (e.key === "Backspace" && !p3 && in2Ref.current) {
              in2Ref.current.focus();
            }
          }}
          onChange={e => {
            const v = e.target.value.replace(/\D/g, "");
            update(p1, p2, v);
          }}
          className={`w-1/3 bg-white/5 border ${borderClass} rounded-xl px-2 py-2 text-center text-xs font-mono font-bold uppercase tracking-wider text-white outline-none`}
        />
      </div>
    </div>
  );
}
