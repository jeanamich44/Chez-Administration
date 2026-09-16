"use client"
import { useState, useRef, useEffect } from 'react';

/* ========================================= */

interface CustomDatePickerProps {
  value: string;
  onChange: (v: string) => void;
  format?: 'fr' | 'slash' | 'en';
  placeholder?: string;
  label?: string;
}

/* ========================================= */

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const DAYS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

/* ========================================= */

export default function CustomDatePicker({ value, onChange, format = 'fr', placeholder = 'Sélectionner une date', label }: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    if (format === 'fr') return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
    if (format === 'slash') {
      const d = date.getDate().toString().padStart(2, '0');
      const m = (date.getMonth() + 1).toString().padStart(2, '0');
      return `${d}/${m}/${date.getFullYear()}`;
    }
    if (format === 'en') {
      const enMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      return `${enMonths[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    }
    return dateString;
  };

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const isoString = selectedDate.toISOString().split('T')[0];
    onChange(isoString);
    setIsOpen(false);
  };

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const setToday = () => {
    const today = new Date();
    setCurrentDate(today);
    onChange(today.toISOString().split('T')[0]);
    setIsOpen(false);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month - 1);

  const days = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ day: daysInPrevMonth - i, isCurrentMonth: false, isPrevMonth: true });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, isCurrentMonth: true });
  }
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push({ day: i, isCurrentMonth: false, isNextMonth: true });
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">{label}</label>}
      <div
        className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white cursor-pointer hover:border-primary transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {value ? formatDisplayDate(value) : <span className="text-white/50">{placeholder}</span>}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 p-4 bg-slate-900 border border-white/15 rounded-2xl shadow-2xl z-50 w-72 fade-in">
          <div className="flex justify-between items-center mb-4">
            <button type="button" className="p-2 hover:bg-white/5 rounded-lg text-white" onClick={() => changeMonth(-1)}>
              &lt;
            </button>
            <div className="font-bold text-white">
              {MONTHS[month]} {year}
            </div>
            <button type="button" className="p-2 hover:bg-white/5 rounded-lg text-white" onClick={() => changeMonth(1)}>
              &gt;
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs font-bold text-white/50 py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 mb-4">
            {days.map((d, i) => {
              const isToday = d.isCurrentMonth && d.day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
              const isSelected = value && d.isCurrentMonth && d.day === new Date(value).getDate() && month === new Date(value).getMonth() && year === new Date(value).getFullYear();

              return (
                <div
                  key={i}
                  onClick={() => d.isCurrentMonth && handleDateSelect(d.day)}
                  className={`
                    text-center py-2 text-sm rounded-lg cursor-pointer transition-colors
                    ${!d.isCurrentMonth ? 'text-white/20' : 'text-white hover:bg-white/10'}
                    ${isToday ? 'ring-1 ring-primary/50' : ''}
                    ${isSelected ? 'bg-primary text-slate-950 font-bold hover:bg-primary/90' : ''}
                  `}
                >
                  {d.day}
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={setToday}
            className="w-full bg-white/5 border border-white/10 text-white text-xs font-bold uppercase py-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            Aujourd'hui
          </button>
        </div>
      )}
    </div>
  );
}
