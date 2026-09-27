"use client"
import { useState, useEffect, ChangeEvent } from 'react';

/* ========================================= */

interface CustomTimePickerProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
}

/* ========================================= */

export default function CustomTimePicker({ value, onChange, label }: CustomTimePickerProps) {
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');

  useEffect(() => {
    if (value && value.includes(':')) {
      const [h, m] = value.split(':');
      setHours(h);
      setMinutes(m);
    }
  }, [value]);

  const handleHoursChange = (e: ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 2) val = val.slice(0, 2);
    if (parseInt(val, 10) > 23) val = '23';
    setHours(val);
    updateValue(val, minutes);
  };

  const handleMinutesChange = (e: ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 2) val = val.slice(0, 2);
    if (parseInt(val, 10) > 59) val = '59';
    setMinutes(val);
    updateValue(hours, val);
  };

  const handleHoursBlur = () => {
    if (hours.length === 1) {
      const padded = `0${hours}`;
      setHours(padded);
      updateValue(padded, minutes);
    }
  };

  const handleMinutesBlur = () => {
    if (minutes.length === 1) {
      const padded = `0${minutes}`;
      setMinutes(padded);
      updateValue(hours, padded);
    }
  };

  const updateValue = (h: string, m: string) => {
    if (h && m) {
      onChange(`${h.padStart(2, '0')}:${m.padStart(2, '0')}`);
    }
  };

  return (
    <div className="w-full">
      {label && <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">{label}</label>}
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={hours}
          onChange={handleHoursChange}
          onBlur={handleHoursBlur}
          placeholder="00"
          className="w-16 bg-white/5 border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-sm text-white text-center transition-colors outline-none"
          maxLength={2}
        />
        <span className="text-white font-bold">:</span>
        <input
          type="text"
          value={minutes}
          onChange={handleMinutesChange}
          onBlur={handleMinutesBlur}
          placeholder="00"
          className="w-16 bg-white/5 border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-sm text-white text-center transition-colors outline-none"
          maxLength={2}
        />
      </div>
    </div>
  );
}
