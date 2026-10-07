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

    if (e.key === "Enter" || e.key === "Escape") {
      input.blur();
      return;
    }

    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      const pos = input.selectionStart ?? 0;
      if (e.key === "ArrowLeft" && pos === 3) {
        e.preventDefault();
        input.setSelectionRange(1, 1);
      } else if (e.key === "ArrowRight" && pos === 2) {
        e.preventDefault();
        input.setSelectionRange(4, 4);
      }
      return;
    }

    if (e.key >= "0" && e.key <= "9") {
      e.preventDefault();
      let pos = input.selectionStart ?? 0;
      if (pos === 2) pos = 3;
      if (pos >= 5) return;

      const chars = formattedValue.split("");
      let nextPos = pos + 1;

      if (pos === 0) {
        const num = parseInt(e.key, 10);
        if (num > 2) {
          chars[0] = "0";
          chars[1] = e.key;
          nextPos = 3;
        } else {
          chars[0] = e.key;
          nextPos = 1;
        }
      } else if (pos === 1) {
        const tens = parseInt(chars[0], 10);
        let unit = parseInt(e.key, 10);
        if (tens === 2 && unit > 3) unit = 3;
        chars[1] = String(unit);
        nextPos = 3;
      } else if (pos === 3) {
        const num = parseInt(e.key, 10);
        if (num > 5) {
          chars[3] = "0";
          chars[4] = e.key;
          nextPos = 5;
        } else {
          chars[3] = e.key;
          nextPos = 4;
        }
      } else if (pos === 4) {
        chars[4] = e.key;
        nextPos = 5;
      }

      chars[2] = ":";
      const nextStr = chars.join("").slice(0, 5);
      onChange(nextStr);

      if (nextPos === 2) nextPos = 3;
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
      if (targetPos === 2) targetPos = 1;

      const chars = formattedValue.split("");
      chars[targetPos] = "0";
      chars[2] = ":";
      onChange(chars.join("").slice(0, 5));

      requestAnimationFrame(() => {
        input.setSelectionRange(targetPos, targetPos);
      });
      return;
    }

    if (e.key === "Delete") {
      e.preventDefault();
      let pos = input.selectionStart ?? 0;
      if (pos === 2) pos = 3;
      if (pos >= 5) return;

      const chars = formattedValue.split("");
      chars[pos] = "0";
      chars[2] = ":";
      onChange(chars.join("").slice(0, 5));

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
    if (disabled) return;
    const text = e.clipboardData.getData("text");
    const [h, m] = parseParts(text);
    if (h !== "" || m !== "") {
      onChange(`${(h || "00").padStart(2, "0")}:${(m || "00").padStart(2, "0")}`);
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={formattedValue}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onChange={() => {}}
          className={`w-full bg-white/5 border font-mono ${
            hasError
              ? "border-rose-500/80 focus:border-rose-500"
              : "border-white/10 focus:border-primary"
          } rounded-xl ${compact ? "pl-3 pr-8 py-2 h-[38px] text-xs" : "pl-3.5 pr-9 py-2.5 text-xs"} text-white outline-none transition-colors select-text`}
        />
        <div
          className={`absolute ${compact ? "right-2" : "right-2.5"} pointer-events-none text-white/40 flex items-center justify-center`}
        >
          <Clock size={compact ? 13 : 15} />
        </div>
      </div>
    </div>
  );
}
