"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Building2, User, Wallet, Sparkles, RefreshCw, Eye, Download, MapPin } from 'lucide-react';

interface FicheDePaieWorkspaceProps {
  onBack: () => void;
}

export default function FicheDePaieWorkspace({ onBack }: FicheDePaieWorkspaceProps) {
  const [mode, setMode] = useState<'normal' | 'custom'>('normal');
  const [duree, setDuree] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pricing, setPricing] = useState({ 1: 8, 3: 20, 6: 40, 12: 60 });
  const [form, setForm] = useState({
    mois: new Date().getMonth() + 1,
    annee: new Date().getFullYear(),
    raisonSociale: '',
    siret: '',
    codeNaf: '6201Z',
    conventionCollective: '',
    entrepriseAdresse: '',
    entrepriseCp: '',
    entrepriseVille: '',
    civilite: 'M',
    nom: '',
    prenom: '',
    emploi: '',
    nir: '',
    salarieAdresse: '',
    salarieCp: '',
    salarieVille: '',
    matricule: '001',
    qualification: 'Employé',
    anciennete: '01/01/2020',
    netAPayer: '2000',
    heures: '151.67',
    tauxPas: '0',
    prime: '0',
    frais: '0',
    mutuelle: '50'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/proxy/generate-docs/emploi/pricing')
      .then(r => r.json())
      .then(d => setPricing(d))
      .catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    }
  };

  const handleCpChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const cp = e.target.value;
    handleChange(e);
    if (cp.length === 5) {
      try {
        const res = await fetch(`https://geo.api.gouv.fr/communes?codePostal=${cp}`);
        const data = await res.json();
        if (data && data.length > 0) {
          setForm(prev => ({ ...prev, salarieVille: data[0].nom }));
        }
      } catch (err) {}
    }
  };

  const validateAll = () => {
    const newErrors: Record<string, string> = {};
    if (!form.raisonSociale) newErrors.raisonSociale = 'Raison sociale requise';
    if (form.siret.length !== 14) newErrors.siret = 'SIRET doit faire 14 chiffres';
    if (!form.nom) newErrors.nom = 'Nom requis';
    if (!form.prenom) newErrors.prenom = 'Prénom requis';
    if (!form.emploi) newErrors.emploi = 'Emploi requis';
    if (!form.nir) newErrors.nir = 'NIR requis (15 chiffres)';
    if (!form.netAPayer) newErrors.netAPayer = 'Net à payer requis';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAction = async (action: 'preview' | 'generate') => {
    if (!validateAll()) return;
    setLoading(true);
    try {
      const endpoint = `/api/proxy/generate-docs/emploi/fiche_de_paie/${action}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, duree, mode })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Fiche_de_paie_${form.nom}_${action}.pdf`;
        a.click();
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
      }
    } catch (err) {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-bold uppercase">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
          <button onClick={() => setMode('normal')} className={`px-4 py-2 rounded-lg text-sm font-bold uppercase transition-colors ${mode === 'normal' ? 'bg-primary text-slate-950' : 'text-white/70 hover:text-white'}`}>Normal</button>
          <button onClick={() => setMode('custom')} className={`px-4 py-2 rounded-lg text-sm font-bold uppercase transition-colors ${mode === 'custom' ? 'bg-primary text-slate-950' : 'text-white/70 hover:text-white'}`}>Personnalisé</button>
        </div>
      </div>

      <div className="glass p-6 md:p-8 space-y-6 rounded-2xl border border-white/10">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <Calendar className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-black italic uppercase tracking-tight text-white">1. Durée & Période</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 3, 6, 12].map((m) => (
            <button key={m} onClick={() => setDuree(m)} className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-colors ${duree === m ? 'border-primary bg-primary/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
              <span className="text-lg font-bold text-white">{m} Mois</span>
              <span className="text-primary font-black">{pricing[m as keyof typeof pricing]}€</span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Mois de fin</label>
            <input type="number" name="mois" value={form.mois} onChange={handleChange} min={1} max={12} className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-sm text-white" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Année de fin</label>
            <input type="number" name="annee" value={form.annee} onChange={handleChange} min={2020} max={2025} className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-sm text-white" />
          </div>
        </div>
      </div>

      <div className="glass p-6 md:p-8 space-y-6 rounded-2xl border border-white/10">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <Building2 className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-black italic uppercase tracking-tight text-white">2. Entreprise</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Raison Sociale</label>
            <input type="text" name="raisonSociale" value={form.raisonSociale} onChange={handleChange} className={`w-full bg-white/5 border ${errors.raisonSociale ? 'border-rose-500/80' : 'border-white/10'} focus:border-primary rounded-xl px-4 py-3 text-sm text-white`} />
            {errors.raisonSociale && <p className="text-xs text-rose-400 mt-1">{errors.raisonSociale}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">SIRET (14 chiffres)</label>
            <input type="text" name="siret" value={form.siret} onChange={handleChange} className={`w-full bg-white/5 border ${errors.siret ? 'border-rose-500/80' : 'border-white/10'} focus:border-primary rounded-xl px-4 py-3 text-sm text-white`} />
            {errors.siret && <p className="text-xs text-rose-400 mt-1">{errors.siret}</p>}
          </div>
          {mode === 'custom' && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Code NAF</label>
                <input type="text" name="codeNaf" value={form.codeNaf} onChange={handleChange} className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Convention Collective</label>
                <input type="text" name="conventionCollective" value={form.conventionCollective} onChange={handleChange} className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-sm text-white" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Adresse Entreprise</label>
                <input type="text" name="entrepriseAdresse" value={form.entrepriseAdresse} onChange={handleChange} className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-sm text-white" />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="glass p-6 md:p-8 space-y-6 rounded-2xl border border-white/10">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <User className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-black italic uppercase tracking-tight text-white">3. Salarié</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Civilité</label>
            <select name="civilite" value={form.civilite} onChange={handleChange} className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-sm text-white">
              <option value="M">Monsieur</option>
              <option value="MME">Madame</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Nom</label>
            <input type="text" name="nom" value={form.nom} onChange={handleChange} className={`w-full bg-white/5 border ${errors.nom ? 'border-rose-500/80' : 'border-white/10'} focus:border-primary rounded-xl px-4 py-3 text-sm text-white`} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Prénom</label>
            <input type="text" name="prenom" value={form.prenom} onChange={handleChange} className={`w-full bg-white/5 border ${errors.prenom ? 'border-rose-500/80' : 'border-white/10'} focus:border-primary rounded-xl px-4 py-3 text-sm text-white`} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">NIR (Numéro Sécu)</label>
            <input type="text" name="nir" value={form.nir} onChange={handleChange} className={`w-full bg-white/5 border ${errors.nir ? 'border-rose-500/80' : 'border-white/10'} focus:border-primary rounded-xl px-4 py-3 text-sm text-white`} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Emploi</label>
            <input type="text" name="emploi" value={form.emploi} onChange={handleChange} className={`w-full bg-white/5 border ${errors.emploi ? 'border-rose-500/80' : 'border-white/10'} focus:border-primary rounded-xl px-4 py-3 text-sm text-white`} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Adresse</label>
            <input type="text" name="salarieAdresse" value={form.salarieAdresse} onChange={handleChange} className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-sm text-white" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Code Postal</label>
            <input type="text" name="salarieCp" value={form.salarieCp} onChange={handleCpChange} className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-sm text-white" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Ville</label>
            <input type="text" name="salarieVille" value={form.salarieVille} onChange={handleChange} className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-sm text-white" />
          </div>
          {mode === 'custom' && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Matricule</label>
                <input type="text" name="matricule" value={form.matricule} onChange={handleChange} className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Ancienneté</label>
                <input type="text" name="anciennete" value={form.anciennete} onChange={handleChange} className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-sm text-white" />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="glass p-6 md:p-8 space-y-6 rounded-2xl border border-white/10">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <Wallet className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-black italic uppercase tracking-tight text-white">4. Rémunération</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Net à payer (€)</label>
            <input type="text" name="netAPayer" value={form.netAPayer} onChange={handleChange} className={`w-full bg-white/5 border ${errors.netAPayer ? 'border-rose-500/80' : 'border-white/10'} focus:border-primary rounded-xl px-4 py-3 text-sm text-white`} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Heures mensuelles</label>
            <input type="text" name="heures" value={form.heures} onChange={handleChange} className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-sm text-white" />
          </div>
          {mode === 'custom' && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Taux PAS (%)</label>
                <input type="text" name="tauxPas" value={form.tauxPas} onChange={handleChange} className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Prime Exceptionnelle</label>
                <input type="text" name="prime" value={form.prime} onChange={handleChange} className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-sm text-white" />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <button onClick={() => setForm(prev => ({ ...prev, nom: '', prenom: '' }))} className="flex-1 bg-white/5 border border-white/10 text-xs font-bold uppercase py-3 rounded-xl hover:bg-white/10 transition-colors">
          Effacer
        </button>
        <button onClick={() => handleAction('preview')} disabled={loading} className="flex-1 bg-white/5 border border-white/10 text-xs font-bold uppercase py-3 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
          <Eye className="w-4 h-4" /> Aperçu
        </button>
        <button onClick={() => handleAction('generate')} disabled={loading} className="flex-[2] bg-primary text-slate-950 font-black text-xs uppercase tracking-widest py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Générer
        </button>
      </div>
    </div>
  );
}
