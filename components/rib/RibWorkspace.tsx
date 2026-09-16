"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Lock, Eye, Download, Sparkles, ArrowLeft, Building2, MapPin, User, FileText, Briefcase, Hash } from 'lucide-react';
import { BANKS } from '@/data/rib-banks';
import { RibMode, NormalField } from './types';
import { useFormSchema } from '@/components/_shared/formSchemaCache';
import { usePreviewCooldown } from '@/components/_shared/usePreviewCooldown';
import { useToast } from '@/components/NotificationToast';
import CustomDatePicker from '@/components/_shared/CustomDatePicker';
import CustomTimePicker from '@/components/_shared/CustomTimePicker';
import DocumentPreviewViewer from '@/components/_shared/DocumentPreviewViewer';

interface RibWorkspaceProps {
  slug: string;
  onBack: () => void;
}

export default function RibWorkspace({ slug, onBack }: RibWorkspaceProps) {
  const { schema, isLoading, error } = useFormSchema('rib', slug);
  const toast = useToast();
  const bank = BANKS.find(b => b.slug === slug);
  const { cooldown, isBlocked, assertReady, startCooldown, formatTimer } = usePreviewCooldown('rib');

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<RibMode>('normal');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionField, setActiveSuggestionField] = useState<string | null>(null);

  useEffect(() => {
    if (schema?.defaults && Object.keys(formData).length === 0) {
      setFormData(schema.defaults);
    }
  }, [schema]);

  const handleChange = (key: string, value: any, sanitizeType?: string) => {
    let sanitizedValue = value;
    if (typeof value === 'string' && sanitizeType) {
      switch (sanitizeType) {
        case 'digits': sanitizedValue = value.replace(/\D/g, ''); break;
        case 'upper': sanitizedValue = value.toUpperCase(); break;
        case 'cp': sanitizedValue = value.replace(/\D/g, '').slice(0, 5); break;
        case 'alnum': sanitizedValue = value.replace(/[^a-zA-Z0-9]/g, ''); break;
      }
    }
    setFormData(prev => ({ ...prev, [key]: sanitizedValue }));
    if (errors[key]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }

    if (sanitizeType === 'address' && value.length > 3) {
      fetchAddressSuggestions(value);
      setActiveSuggestionField(key);
    } else if (sanitizeType === 'ville' && value.length > 2) {
      fetchCitySuggestions(value);
      setActiveSuggestionField(key);
    } else {
      setShowSuggestions(false);
    }
  };

  const fetchAddressSuggestions = async (query: string) => {
    try {
      const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`);
      const data = await res.json();
      setSuggestions(data.features || []);
      setShowSuggestions(true);
    } catch (e) {
      setShowSuggestions(false);
    }
  };

  const fetchCitySuggestions = async (query: string) => {
    try {
      const res = await fetch(`https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(query)}&fields=nom,codesPostaux&format=json&geometry=centre`);
      const data = await res.json();
      setSuggestions(data.slice(0, 5));
      setShowSuggestions(true);
    } catch (e) {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion: any, type: string) => {
    if (type === 'address') {
      const { name, postcode, city } = suggestion.properties;
      setFormData(prev => ({
        ...prev,
        [activeSuggestionField || '']: name,
        cp: postcode || prev.cp,
        ville: city || prev.ville
      }));
    } else if (type === 'ville') {
      setFormData(prev => ({
        ...prev,
        [activeSuggestionField || '']: suggestion.nom,
        cp: suggestion.codesPostaux?.[0] || prev.cp
      }));
    }
    setShowSuggestions(false);
    setActiveSuggestionField(null);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (schema?.sections) {
      schema.sections.forEach((sec: any) => {
        sec.fields.forEach((field: NormalField) => {
          if (field.required && !formData[field.key]) {
            newErrors[field.key] = 'Ce champ est requis';
          }
        });
      });
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePreview = async () => {
    if (!assertReady() || !validate()) return;
    try {
      startCooldown();
      const res = await fetch(`/api/proxy/generate-docs/rib/${slug}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, mode })
      });
      if (!res.ok) throw new Error('Erreur preview');
      const blob = await res.blob();
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'aperçu');
    }
  };

  const handleGenerate = async () => {
    if (!validate()) {
      toast.error('Veuillez remplir les champs requis');
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/proxy/generate-docs/rib/${slug}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, mode })
      });
      if (!res.ok) throw new Error('Erreur génération');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `RIB_${bank?.name || slug}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
      toast.success('RIB généré avec succès !');
    } catch (err: any) {
      toast.error(err.message || 'Erreur de génération');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExample = () => {
    if (schema?.defaults) {
      setFormData(schema.defaults);
    }
  };

  const handleReset = () => {
    setFormData(schema?.defaults || {});
    setErrors({});
    setPreviewUrl(null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-white/70 space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <p className="font-bold uppercase tracking-wider text-sm">Chargement du formulaire...</p>
      </div>
    );
  }

  if (error || !schema) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-rose-400 space-y-4">
        <Lock className="w-12 h-12 mb-2" />
        <p className="font-bold text-lg">{error || 'Schéma introuvable'}</p>
        <button onClick={onBack} className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-white font-bold uppercase text-xs mt-4 hover:bg-white/10 transition-colors">
          Retour aux banques
        </button>
      </div>
    );
  }

  const getIcon = (name?: string) => {
    switch (name) {
      case 'user': return <User className="w-5 h-5 text-primary" />;
      case 'map-pin': return <MapPin className="w-5 h-5 text-primary" />;
      case 'building': return <Building2 className="w-5 h-5 text-primary" />;
      case 'file-text': return <FileText className="w-5 h-5 text-primary" />;
      case 'briefcase': return <Briefcase className="w-5 h-5 text-primary" />;
      case 'hash': return <Hash className="w-5 h-5 text-primary" />;
      default: return <FileText className="w-5 h-5 text-primary" />;
    }
  };

  const renderField = (field: NormalField) => {
    const value = formData[field.key] || '';
    const isErr = !!errors[field.key];
    const baseClass = `w-full bg-white/5 border ${isErr ? 'border-rose-500/80' : 'border-white/10'} focus:border-primary rounded-xl px-4 py-3 text-sm text-white transition-colors outline-none`;

    return (
      <div key={field.key} className={`flex flex-col space-y-2 relative ${field.grid || 'col-span-1'}`}>
        <label className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center justify-between">
          <span>{field.label} {field.required && <span className="text-primary">*</span>}</span>
          {isErr && <span className="text-rose-400 text-[10px]">{errors[field.key]}</span>}
        </label>

        {field.kind === 'input' && (
          <div className="relative">
            <input
              type="text"
              value={value}
              onChange={(e) => handleChange(field.key, e.target.value, field.sanitize)}
              placeholder={field.placeholder}
              maxLength={field.maxLength}
              className={baseClass}
            />
            {showSuggestions && activeSuggestionField === field.key && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1b26] border border-white/10 rounded-xl overflow-hidden z-50">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => selectSuggestion(s, field.sanitize as string)}
                    className="w-full text-left px-4 py-3 text-sm text-white/90 hover:bg-white/5 border-b border-white/5 last:border-0"
                  >
                    {field.sanitize === 'address' ? s.properties.label : `${s.nom} (${s.codesPostaux?.[0] || ''})`}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {field.kind === 'select' && (
          <select value={value} onChange={(e) => handleChange(field.key, e.target.value)} className={baseClass}>
            <option value="">Sélectionner...</option>
            {field.options?.map(o => (
              <option key={o.value} value={o.value} className="bg-[#1a1b26]">{o.label}</option>
            ))}
          </select>
        )}

        {field.kind === 'date' && (
          <CustomDatePicker value={value} onChange={(v) => handleChange(field.key, v)} />
        )}

        {field.kind === 'time' && (
          <CustomTimePicker value={value} onChange={(v) => handleChange(field.key, v)} />
        )}

        {field.kind === 'textarea' && (
          <textarea
            value={value}
            onChange={(e) => handleChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className={`${baseClass} min-h-[100px] resize-y`}
          />
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-32 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 text-white/70">
        <button onClick={onBack} className="hover:text-white transition-colors p-2 -ml-2 rounded-lg hover:bg-white/5">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-bold uppercase tracking-wider">GÉNÉRATEUR RIB / {bank?.name}</span>
      </div>

      <div className="glass p-6 md:p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className={`w-16 h-16 rounded-xl flex items-center justify-center p-2 ${bank?.headerBg || 'bg-white/10'}`}>
            <img src={bank?.logo} alt={bank?.name} className="max-w-full max-h-full object-contain" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tight text-white">
              RIB <span className="text-primary">{bank?.name}</span>
            </h1>
            <p className="text-white/70 font-medium mt-1">Remplissez les informations ci-dessous</p>
          </div>
        </div>
        <div className="flex bg-black/50 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setMode('normal')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${mode === 'normal' ? 'bg-primary text-slate-950' : 'text-white/70 hover:text-white'}`}
          >
            Normal
          </button>
          <button
            onClick={() => setMode('custom')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${mode === 'custom' ? 'bg-primary text-slate-950' : 'text-white/70 hover:text-white'}`}
          >
            Avancé
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {schema.sections?.map((section: any, idx: number) => (
            <div key={idx} className="glass p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                {getIcon(section.icon)}
                <h2 className="font-black italic uppercase tracking-tight text-white text-lg">{section.title}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.fields.map((f: NormalField) => renderField(f))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="glass p-6 sticky top-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                <h3 className="font-black italic uppercase tracking-tight text-white">Aperçu en direct</h3>
              </div>
            </div>
            
            <div className="bg-black/50 rounded-xl overflow-hidden min-h-[400px] border border-white/10 flex items-center justify-center relative">
              {previewUrl ? (
                <DocumentPreviewViewer imageUrl={previewUrl} onClose={() => { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }} />
              ) : (
                <div className="text-center text-white/50 space-y-3">
                  <FileText className="w-12 h-12 mx-auto opacity-50" />
                  <p className="text-sm font-medium">Générez un aperçu pour prévisualiser le document</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#060710]/90 backdrop-blur-xl border-t border-white/10 p-4 z-50">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-white"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-xs font-bold uppercase hidden sm:inline">Effacer</span>
            </button>
            <button
              onClick={handleExample}
              className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-white"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase hidden sm:inline">Exemple</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePreview}
              disabled={isBlocked}
              className="flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Eye className="w-4 h-4" />
              <span className="text-xs font-bold uppercase">
                {cooldown > 0 ? `Aperçu (${formatTimer(cooldown)})` : 'Aperçu'}
              </span>
            </button>
            
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-8 py-3 bg-primary rounded-xl text-slate-950 hover:bg-primary/90 transition-all font-black uppercase text-sm tracking-widest shadow-[0_0_20px_rgba(0,242,255,0.3)] disabled:opacity-50"
            >
              {isGenerating ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              <span>Générer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
