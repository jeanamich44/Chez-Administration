"use client";

import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

/* ===================================================================== */

const FR_MONTHS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre"
];

const FR_MONTHS_CAP = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre"
];

const EN_MONTHS_CAP = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

const FR_MONTHS_SHORT = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc."
];

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const MONTH_MAP: Record<string, number> = {
  janvier: 0,
  janv: 0,
  jan: 0,
  fevrier: 1,
  février: 1,
  fevr: 1,
  févr: 1,
  fev: 1,
  fév: 1,
  feb: 1,
  mars: 2,
  mar: 2,
  avril: 3,
  avr: 3,
  apr: 3,
  mai: 4,
  may: 4,
  juin: 5,
  jun: 5,
  juillet: 6,
  juil: 6,
  jul: 6,
  aout: 7,
  août: 7,
  aou: 7,
  aug: 7,
  septembre: 8,
  sept: 8,
  sep: 8,
  octobre: 9,
  oct: 9,
  novembre: 10,
  nov: 10,
  decembre: 11,
  décembre: 11,
  dec: 11,
  déc: 11
};

function pad(num: number, size = 2): string {
  return String(num).padStart(size, "0");
}

export function getDaysInMonth(month: number, year: number): number {
  if (month === 2) {
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    return isLeap ? 29 : 28;
  }
  if ([4, 6, 9, 11].includes(month)) return 30;
  return 31;
}

export function isValidCalendarDate(str: string): { valid: boolean; message?: string } {
  if (!str || typeof str !== "string") return { valid: false, message: "Date requise." };
  const s = str.trim();
  const m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (!m) {
    const d = parseInputDate(s);
    return d ? { valid: true } : { valid: false, message: "Format invalide (format JJ/MM/AAAA attendu)." };
  }
  const day = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  const year = parseInt(m[3], 10);
  if (month < 1 || month > 12) return { valid: false, message: "Mois invalide (doit être entre 01 et 12)." };
  if (year < 1900 || year > 2100) return { valid: false, message: "Année invalide." };
  const maxD = getDaysInMonth(month, year);
  if (day < 1 || day > maxD) return { valid: false, message: `Jour invalide (max ${maxD} pour le mois ${month}).` };
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return { valid: false, message: "Date inexistante dans le calendrier." };
  }
  return { valid: true };
}

function parseInputDate(str: string): Date | null {
  if (!str || !str.trim()) return null;
  const s = str
    .trim()
    .toLowerCase()
    .replace(/^[a-zA-ZÀ-ÿ\\s'-]+,\\s*le\\s*/i, "")
    .replace(/,\\s*\\d{1,2}:\\d{2}(?::\\d{2})?(?:\\s*(?:gmt|utc))?$/i, "")
    .trim();

  const frMatch = s.match(/^(\d{1,2})\s+([a-zA-ZÀ-ÿ.]+)\s+(\d{4})$/);
  if (frMatch) {
    const day = parseInt(frMatch[1], 10);
    const mStr = frMatch[2].replace(/\.$/, "").toLowerCase();
    const year = parseInt(frMatch[3], 10);
    const month = MONTH_MAP[mStr];
    if (month !== undefined && day >= 1 && day <= 31) {
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime()) && d.getMonth() === month && d.getDate() === day) return d;
    }
  }

  const monthFirstMatch = s.match(/^([a-zA-ZÀ-ÿ.]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (monthFirstMatch) {
    const mStr = monthFirstMatch[1].replace(/\.$/, "").toLowerCase();
    const day = parseInt(monthFirstMatch[2], 10);
    const year = parseInt(monthFirstMatch[3], 10);
    const month = MONTH_MAP[mStr];
    if (month !== undefined && day >= 1 && day <= 31) {
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime()) && d.getMonth() === month && d.getDate() === day) return d;
    }
  }

  const slashMatch = s.match(/^(\d{1,2})[/.\s-](\d{1,2})[/.\s-](\d{2,4})$/);
  if (slashMatch) {
    const day = parseInt(slashMatch[1], 10);
    const month = parseInt(slashMatch[2], 10) - 1;
    let year = parseInt(slashMatch[3], 10);
    if (year < 100) year += 2000;
    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime()) && d.getMonth() === month && d.getDate() === day) return d;
    }
  }

  const digitsMatch = s.match(/^(\d{2})(\d{2})(\d{4})$/);
  if (digitsMatch) {
    const day = parseInt(digitsMatch[1], 10);
    const month = parseInt(digitsMatch[2], 10) - 1;
    const year = parseInt(digitsMatch[3], 10);
    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime()) && d.getMonth() === month && d.getDate() === day) return d;
    }
  }

  const isoMatch = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime()) && d.getMonth() === month && d.getDate() === day) return d;
  }

  return null;
}

function formatDate(d: Date, format: "french" | "slash" | "english" | "month_first" | "dot" | "french_short"): string {
  if (format === "french_short") {
    return `${d.getDate()} ${FR_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
  }
  if (format === "dot") {
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
  }
  if (format === "slash") {
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  }
  if (format === "english") {
    return `${pad(d.getDate())} ${EN_MONTHS_CAP[d.getMonth()]} ${d.getFullYear()}`;
  }
  if (format === "month_first") {
    return `${FR_MONTHS_CAP[d.getMonth()]} ${pad(d.getDate())} ${d.getFullYear()}`;
  }
  return `${d.getDate()} ${FR_MONTHS_CAP[d.getMonth()]} ${d.getFullYear()}`;
}

/* ===================================================================== */

interface CustomDatePickerProps {
  value: string;
  onChange: (val: string) => void;
  hasError?: boolean;
  placeholder?: string;
  dateFormat?: "french" | "slash" | "english" | "month_first" | "dot" | "french_short" | "iso";
  compact?: boolean;
}

export default function CustomDatePicker({
  value,
  onChange,
  hasError = false,
  placeholder = "Sélectionner une date",
  dateFormat = "slash",
  compact = false
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isIso = dateFormat === "iso" || /^\\d{4}-\\d{2}-\\d{2}$/.test(value || "");
  const sep = dateFormat === "dot" || (!isIso && (value || "").includes(".")) ? "." : isIso ? "-" : "/";
  const sepIndices = isIso ? [4, 7] : [2, 5];

  const parsed = parseInputDate(value);
  const defaultFallback = parsed
    ? (isIso
        ? `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`
        : `${pad(parsed.getDate())}${sep}${pad(parsed.getMonth() + 1)}${sep}${parsed.getFullYear()}`)
    : (isIso
        ? `${new Date().getFullYear()}-${pad(new Date().getMonth() + 1)}-${pad(new Date().getDate())}`
        : `${pad(new Date().getDate())}${sep}${pad(new Date().getMonth() + 1)}${sep}${new Date().getFullYear()}`);

  const displayValue = parsed
    ? (isIso
        ? `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`
        : `${pad(parsed.getDate())}${sep}${pad(parsed.getMonth() + 1)}${sep}${parsed.getFullYear()}`)
    : value && value.length === 10
      ? value
      : defaultFallback;

  const [viewYear, setViewYear] = useState<number>(
    parsed ? parsed.getFullYear() : new Date().getFullYear()
  );
  const [viewMonth, setViewMonth] = useState<number>(
    parsed ? parsed.getMonth() : new Date().getMonth()
  );

  useEffect(() => {
    if (parsed) {
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleKeyDownInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = inputRef.current;
    if (!input) return;

    if (e.key === "Enter" || e.key === "Escape") {
      setIsOpen(false);
      input.blur();
      return;
    }

    if (e.key === "Tab") {
      setIsOpen(false);
      return;
    }

    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      const pos = input.selectionStart ?? 0;
      if (e.key === "ArrowLeft" && sepIndices.includes(pos - 1)) {
        e.preventDefault();
        input.setSelectionRange(pos - 2, pos - 2);
      } else if (e.key === "ArrowRight" && sepIndices.includes(pos + 1)) {
        e.preventDefault();
        input.setSelectionRange(pos + 2, pos + 2);
      }
      return;
    }

    if (e.key >= "0" && e.key <= "9") {
      e.preventDefault();
      let pos = input.selectionStart ?? 0;
      if (sepIndices.includes(pos)) {
        pos += 1;
      }
      if (pos >= 10) return;

      const chars = displayValue.split("");
      let nextPos = pos + 1;

      if (!isIso) {
        if (pos === 0) {
          const num = parseInt(e.key, 10);
          if (num > 3) {
            chars[0] = "0";
            chars[1] = e.key;
            nextPos = 3;
          } else {
            chars[0] = e.key;
            nextPos = 1;
          }
        } else if (pos === 1) {
          const tens = parseInt(chars[0], 10) || 0;
          let unit = parseInt(e.key, 10);
          if (tens === 3 && unit > 1) unit = 1;
          if (tens === 0 && unit === 0) unit = 1;
          chars[1] = String(unit);
          nextPos = 3;
        } else if (pos === 3) {
          const num = parseInt(e.key, 10);
          if (num > 1) {
            chars[3] = "0";
            chars[4] = e.key;
            nextPos = 6;
          } else {
            chars[3] = e.key;
            nextPos = 4;
          }
        } else if (pos === 4) {
          const tens = parseInt(chars[3], 10) || 0;
          let unit = parseInt(e.key, 10);
          if (tens === 1 && unit > 2) unit = 2;
          if (tens === 0 && unit === 0) unit = 1;
          chars[4] = String(unit);
          nextPos = 6;
        } else if (pos >= 6 && pos <= 9) {
          chars[pos] = e.key;
          nextPos = pos + 1;
        }

        const currentMonth = parseInt(chars.slice(3, 5).join(""), 10) || 1;
        const currentYear = parseInt(chars.slice(6, 10).join(""), 10) || 2026;
        const maxD = getDaysInMonth(currentMonth, currentYear);
        const currentDay = parseInt(chars.slice(0, 2).join(""), 10) || 1;
        if (currentDay > maxD) {
          const clamped = String(maxD).padStart(2, "0");
          chars[0] = clamped[0];
          chars[1] = clamped[1];
        }
      } else {
        chars[pos] = e.key;
      }

      chars[sepIndices[0]] = sep;
      chars[sepIndices[1]] = sep;
      const nextStr = chars.join("").slice(0, 10);
      onChange(nextStr);

      if (sepIndices.includes(nextPos)) {
        nextPos += 1;
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
      if (sepIndices.includes(targetPos)) {
        targetPos -= 1;
      }
      if (targetPos < 0) return;

      const chars = displayValue.split("");
      chars[targetPos] = "0";
      chars[sepIndices[0]] = sep;
      chars[sepIndices[1]] = sep;
      const nextStr = chars.join("").slice(0, 10);
      onChange(nextStr);

      requestAnimationFrame(() => {
        input.setSelectionRange(targetPos, targetPos);
      });
      return;
    }

    if (e.key === "Delete") {
      e.preventDefault();
      let pos = input.selectionStart ?? 0;
      if (sepIndices.includes(pos)) {
        pos += 1;
      }
      if (pos >= 10) return;

      const chars = displayValue.split("");
      chars[pos] = "0";
      chars[sepIndices[0]] = sep;
      chars[sepIndices[1]] = sep;
      const nextStr = chars.join("").slice(0, 10);
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
    const parsedPasted = parseInputDate(text);
    if (parsedPasted) {
      const formatted = isIso
        ? `${parsedPasted.getFullYear()}-${pad(parsedPasted.getMonth() + 1)}-${pad(parsedPasted.getDate())}`
        : `${pad(parsedPasted.getDate())}${sep}${pad(parsedPasted.getMonth() + 1)}${sep}${parsedPasted.getFullYear()}`;
      onChange(formatted);
      return;
    }
    const digits = text.replace(/\\D/g, "");
    if (digits.length >= 8) {
      let candidate = "";
      if (isIso) {
        const y = digits.slice(0, 4);
        const m = digits.slice(4, 6);
        const d = digits.slice(6, 8);
        candidate = `${y}-${m}-${d}`;
      } else {
        const d = digits.slice(0, 2);
        const m = digits.slice(2, 4);
        const y = digits.slice(4, 8);
        candidate = `${d}${sep}${m}${sep}${y}`;
      }
      const check = isValidCalendarDate(candidate);
      if (check.valid) {
        onChange(candidate);
      }
    }
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const prevYear = () => setViewYear(y => y - 1);
  const nextYear = () => setViewYear(y => y + 1);

  const handleSelectDay = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    const formatted = isIso
      ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
      : `${pad(d.getDate())}${sep}${pad(d.getMonth() + 1)}${sep}${d.getFullYear()}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    const formatted = isIso
      ? `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
      : `${pad(today.getDate())}${sep}${pad(today.getMonth() + 1)}${sep}${today.getFullYear()}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === viewMonth &&
      today.getFullYear() === viewYear
    );
  };

  const isSelected = (day: number) => {
    if (!parsed) return false;
    return (
      parsed.getDate() === day &&
      parsed.getMonth() === viewMonth &&
      parsed.getFullYear() === viewYear
    );
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onChange={() => {}}
          onKeyDown={handleKeyDownInput}
          onPaste={handlePaste}
          className={`w-full bg-white/5 border font-mono ${
            hasError
              ? "border-rose-500/80 focus:border-rose-500"
              : "border-white/10 focus:border-primary"
          } rounded-xl ${compact ? "pl-3 pr-9 py-2 h-[38px] text-sm" : "pl-4 pr-11 py-3 text-sm"} text-white outline-none transition-colors select-text`}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => {
            setIsOpen(!isOpen);
            inputRef.current?.focus();
          }}
          className={`absolute ${compact ? "right-2.5 p-1" : "right-3 p-1.5"} rounded-lg text-white/50 hover:text-primary hover:bg-white/10 transition-colors cursor-pointer`}
          title="Ouvrir le calendrier"
        >
          <CalendarIcon size={compact ? 14 : 16} />
        </button>
      </div>

      {isOpen && (
        <div
          onMouseDown={e => e.preventDefault()}
          className="absolute z-50 mt-2 w-full max-w-[320px] p-4 rounded-2xl bg-[#0c1322]/95 border border-white/15 backdrop-blur-2xl shadow-2xl shadow-black/80"
        >
          <div className="flex items-center justify-between gap-1 pb-3 mb-3 border-b border-white/10">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevYear}
                className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                title="Année précédente"
              >
                <ChevronsLeft size={14} />
              </button>
              <button
                type="button"
                onClick={prevMonth}
                className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                title="Mois précédent"
              >
                <ChevronLeft size={14} />
              </button>
            </div>

            <div className="text-xs font-black uppercase tracking-wider text-white select-none">
              {FR_MONTHS_CAP[viewMonth]} {viewYear}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={nextMonth}
                className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                title="Mois suivant"
              >
                <ChevronRight size={14} />
              </button>
              <button
                type="button"
                onClick={nextYear}
                className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                title="Année suivante"
              >
                <ChevronsRight size={14} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2 text-center select-none">
            {WEEKDAYS.map(w => (
              <span key={w} className="text-[10px] font-bold text-white/40 uppercase">
                {w}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 select-none">
            {Array.from({ length: firstDayIndex }).map((_, i) => {
              const dayNum = daysInPrevMonth - firstDayIndex + i + 1;
              return (
                <div
                  key={`prev-${i}`}
                  className="h-8 flex items-center justify-center text-xs text-white/15"
                >
                  {dayNum}
                </div>
              );
            })}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const selected = isSelected(day);
              const today = isToday(day);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                    selected
                      ? "bg-primary text-black font-black shadow-md shadow-primary/30 scale-105"
                      : today
                        ? "border border-primary/50 text-primary hover:bg-primary/20"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {day}
                </button>
              );
            })}

            {Array.from({
              length: (7 - ((firstDayIndex + daysInMonth) % 7)) % 7
            }).map((_, i) => (
              <div
                key={`next-${i}`}
                className="h-8 flex items-center justify-center text-xs text-white/15"
              >
                {i + 1}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/10">
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-[10px] font-black uppercase tracking-wider text-primary hover:underline"
            >
              Aujourd'hui
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                inputRef.current?.blur();
              }}
              className="text-[10px] font-bold uppercase tracking-wider text-white/40 hover:text-white"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
