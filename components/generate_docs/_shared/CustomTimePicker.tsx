"use client";

import React, { useRef } from "react";
import { Clock } from "lucide-react";

/* ===================================================================== */

interface CustomTimePickerProps {
  value: string;
  onChange: (val: string) => void;
  hasError?: boolean;
  disabled?: boolean;
  compact?: boolean;
}

function parseParts(val?: string): [string, string] {
  if (!val) {
    return ["", ""];
  }
  const clean = val.replace(/[^0-9:]/g, "");
  const parts = clean.split(":");
  if (parts.length >= 2) {
    const h = parts[0] === "" ? "" : String(Math.min(23, Math.max(0, parseInt(parts[0], 10) || 0))).padStart(2, "0");
    const m = parts[1] === "" ? "" : String(Math.min(59, Math.max(0, parseInt(parts[1], 10) || 0))).padStart(2, "0");
    return [h, m];
  }
  if (clean.length === 4) {
    const h = String(Math.min(23, Math.max(0, parseInt(clean.slice(0, 2), 10) || 0))).padStart(2, "0");
    const m = String(Math.min(59, Math.max(0, parseInt(clean.slice(2, 4), 10) || 0))).padStart(2, "0");
    return [h, m];
  }
  return ["", ""];
}

/* ===================================================================== */

export default function CustomTimePicker({
  value,
  onChange,
  hasError = false,
  disabled = false,
  compact = false
}: CustomTimePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const formattedValue = (() => {
    const [h, m] = parseParts(value);
    const validH = h ? h.padStart(2, "0") : "00";
    const validM = m ? m.padStart(2, "0") : "00";
    return `${validH}:${validM}`;
  })();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    const input = inputRef.current;
    if (!input) return;

    if (e.key === "Tab" || e.key === "Enter" || e.key === "Escape") {
      return;
    }

    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      const pos = input.selectionStart ?? 0;
      if (e.key === "ArrowLeft" && pos === 3) {
        e.preventDefault();
        input.setSelectionRange(1, 1);
      } else if (e.key === "ArrowRight" && pos === 1) {
        e.preventDefault();
        input.setSelectionRange(3, 3);
      }
      return;
    }

    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const pos = input.selectionStart ?? 0;
      const [curH, curM] = parseParts(formattedValue);
      let numH = parseInt(curH || "0", 10);
      let numM = parseInt(curM || "0", 10);

      if (pos <= 2) {
        numH = e.key === "ArrowUp" ? (numH + 1) % 24 : (numH - 1 + 24) % 24;
      } else {
        numM = e.key === "ArrowUp" ? (numM + 1) % 60 : (numM - 1 + 60) % 60;
      }
      const nextStr = `${String(numH).padStart(2, "0")}:${String(numM).padStart(2, "0")}`;
      onChange(nextStr);
      requestAnimationFrame(() => {
        input.setSelectionRange(pos, pos);
      });
      return;
    }

    if (e.key >= "0" && e.key <= "9") {
      e.preventDefault();
      let pos = input.selectionStart ?? 0;
      if (pos === 2) {
        pos = 3;
      }
      if (pos >= 5) return;

      const chars = formattedValue.split("");
      chars[pos] = e.key;
      chars[2] = ":";

      let h = parseInt(chars[0] + chars[1], 10) || 0;
      if (h > 23) h = 23;
      let m = parseInt(chars[3] + chars[4], 10) || 0;
      if (m > 59) m = 59;

      const validH = String(h).padStart(2, "0");
      const validM = String(m).padStart(2, "0");
      const nextStr = `${validH}:${validM}`;
      onChange(nextStr);

      let nextPos = pos + 1;
      if (nextPos === 2) {
        nextPos = 3;
      }
      requestAnimationFrame(() => {
        input.setSelectionRange(nextPos, nextPos);
      });
      return;
    }

    if (e.key === "Backspace") {
      e.preventDefault();
      const pos = input.selectionStart ?? 0;
      if (pos <= 0) return;

      let targetPos = pos - 1;
      if (targetPos === 2) {
        targetPos = 1;
      }
      if (targetPos < 0) return;

      const chars = formattedValue.split("");
      chars[targetPos] = "0";
      chars[2] = ":";
      const nextStr = chars.join("").slice(0, 5);
      onChange(nextStr);

      requestAnimationFrame(() => {
        input.setSelectionRange(targetPos, targetPos);
      });
      return;
    }

    if (e.key === "Delete") {
      e.preventDefault();
      let pos = input.selectionStart ?? 0;
      if (pos === 2) {
        pos = 3;
      }
      if (pos >= 5) return;

      const chars = formattedValue.split("");
      chars[pos] = "0";
      chars[2] = ":";
      const nextStr = chars.join("").slice(0, 5);
      onChange(nextStr);

      requestAnimationFrame(() => {
        input.setSelectionRange(pos, pos);
      });
      return;
    }

    if (!e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text");
    const [h, m] = parseParts(text);
    if (h || m) {
      const validH = h ? h.padStart(2, "0") : "00";
      const validM = m ? m.padStart(2, "0") : "00";
      onChange(`${validH}:${validM}`);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    if (disabled) return;
    e.preventDefault();
    const input = inputRef.current;
    if (!input) return;

    const pos = input.selectionStart ?? 0;
    const [curH, curM] = parseParts(formattedValue);
    let numH = parseInt(curH || "0", 10);
    let numM = parseInt(curM || "0", 10);

    if (pos <= 2) {
      numH = e.deltaY < 0 ? (numH + 1) % 24 : (numH - 1 + 24) % 24;
    } else {
      numM = e.deltaY < 0 ? (numM + 1) % 60 : (numM - 1 + 60) % 60;
    }
    const nextStr = `${String(numH).padStart(2, "0")}:${String(numM).padStart(2, "0")}`;
    onChange(nextStr);
    requestAnimationFrame(() => {
      input.setSelectionRange(pos, pos);
    });
  };

  const handleSetNow = () => {
    if (disabled) return;
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    onChange(`${h}:${m}`);
  };

  return (
    <div
      className={`relative flex items-center justify-between w-full bg-white/5 border ${
        hasError
          ? "border-rose-500/80 focus-within:border-rose-500"
          : "border-white/10 focus-within:border-primary"
      } rounded-xl ${compact ? "px-3 h-[38px]" : "px-4 h-[46px]"} transition-colors`}
    >
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={formattedValue}
        onChange={() => {}}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onWheel={handleWheel}
        disabled={disabled}
        className={`w-20 bg-transparent border-0 outline-none ring-0 p-0 text-white font-mono font-bold tracking-widest text-center focus:outline-none focus:ring-0 focus:border-0 caret-primary ${
          compact ? "text-xs" : "text-sm"
        }`}
        aria-label="Heure (HH:MM)"
      />

      <button
        type="button"
        onClick={handleSetNow}
        disabled={disabled}
        title="Régler sur l'heure actuelle"
        className={`${compact ? "p-1" : "p-1.5"} rounded-lg text-white/40 hover:text-primary hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <Clock size={compact ? 13 : 16} />
      </button>
    </div>
  );
}
