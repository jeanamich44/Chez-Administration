"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, User, Wallet, Sparkles, RefreshCw, Eye, Download, Building2 } from 'lucide-react';

interface LbpReleveWorkspaceProps {
  onBack: () => void;
}

export default function LbpReleveWorkspace({ onBack }: LbpReleveWorkspaceProps) {
  const [mode, setMode] = useState<'facile' | 'custom'>('facile');
  const [duree, setDuree] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pricing, setPricing] = useState({ 1: 10, 3: 25, 6: 45, 12: 70 });
  const [form, setForm] = useState({
    moisDebut: new Date().getMonth() + 1,
    anneeDebut: new Date().getFullYear(),
    numeroReleve: '1',
    civilite: 'M',
    nom: '',
    prenom: '',
    adresse: '',
    cp: '',
    ville: '',
    identifiant: '',
    iban: '',
    profil: 'normal',
    richesse: 'moyen',
    soldeInitial: '1500',
    employeur: '',
    salaireNet: '2000',
    jourSalaire: '1',
    loyer: '600'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/proxy/generate-docs/releve/pricing')
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
          setForm(prev => ({ ...prev, ville: data[0].nom }));
        }
      } catch (err) {}
    }
  };

  const generateAutoIds = () => {
    setForm(prev => ({
      ...prev,
      identifiant: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
      iban: 'FR76' + Math.floor(10000000000000000000000 + Math.random() * 9000000000000000000000).toString()
    }));
  };

  const validateAll = () => {
    const newErrors: Record<string, string> = {};
    if (!form.nom) newErrors.nom = 'Nom requis';
    if (!form.prenom) newErrors.prenom = 'Prénom requis';
    if (!form.identifiant) newErrors.identifiant = 'Identifiant requis';
    if (!form.iban) newErrors.iban = 'IBAN requis';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAction = async (action: 'preview' | 'generate') => {
    if (!validateAll()) return;
    setLoading(true);
    try {
      const endpoint = `/api/proxy/generate-docs/releve/lbp/${action}`;
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
        a.download = `Releve_LBP_${form.nom}_${action}.pdf`;
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
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-bold uppercase cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
          <button onClick={() => setMode('facile')} className={`px-4 py-2 rounded-lg text-sm font-bold uppercase transition-colors cursor-pointer ${mode === 'facile' ? 'bg-primary text-slate-950' : 'text-white/70 hover:text-white'}`}>Facile</button>
          <button onClick={() => setMode('custom')} className={`px-4 py-2 rounded-lg text-sm font-bold uppercase transition-colors cursor-pointer ${mode === 'custom' ? 'bg-primary text-slate-950' : 'text-white/70 hover:text-white'}`}>Personnalisé</button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="px-5 py-3.5 border rounded-2xl backdrop-blur-md flex items-center justify-center overflow-hidden shrink-0 shadow-lg bg-gradient-to-br from-blue-900/40 to-slate-950/80 border-blue-500/30">
          <img src="/logos/lbp.svg" alt="La Banque Postale" className="h-8 sm:h-10 w-auto max-w-[140px] object-contain scale-125" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-4xl font-black italic text-white tracking-tight">RELEVÉ DE COMPTE</h1>
          <p className="text-white/50 text-xs font-medium uppercase tracking-wider mt-0.5">La Banque Postale · Relevé officiel</p>
        </div>
      </div>

      <div className="glass p-6 md:p-8 space-y-6 rounded-2xl border border-white/10">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <Calendar className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-black italic uppercase tracking-tight text-white">1. Durée & Tarif</h2>
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
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Mois de début</label>
            <input type="number" name="moisDebut" value={form.moisDebut} onChange={handleChange} min={1} max={12} className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-sm text-white" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Année de début</label>
            <input type="number" name="anneeDebut" value={form.anneeDebut} onChange={handleChange} min={2020} max={2025} className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-sm text-white" />
          </div>
        </div>
      </div>

      <div className="glass p-6 md:p-8 space-y-6 rounded-2xl border border-white/10">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <User className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-black italic uppercase tracking-tight text-white">2. Titulaire</h2>
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
            <input type="text" name="nom" value={form.nom} onChange={handleChange} className={`w-full bg-white/5 border ${errors.nom ? 'border-rose-500/80' : 'border-white/10'} focus:border-primary rounded-xl px-4 py-3 text-sm text-white uppercase`} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Prénom</label>
            <input type="text" name="prenom" value={form.prenom} onChange={handleChange} className={`w-full bg-white/5 border ${errors.prenom ? 'border-rose-500/80' : 'border-white/10'} focus:border-primary rounded-xl px-4 py-3 text-sm text-white uppercase`} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Adresse</label>
            <input type="text" name="adresse" value={form.adresse} onChange={handleChange} className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-sm text-white" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Code Postal</label>
            <input type="text" name="cp" value={form.cp} onChange={handleCpChange} className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-sm text-white" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Ville</label>
            <input type="text" name="ville" value={form.ville} onChange={handleChange} className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-sm text-white" />
          </div>
        </div>
      </div>

      <div className="glass p-6 md:p-8 space-y-6 rounded-2xl border border-white/10">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-black italic uppercase tracking-tight text-white">3. Identifiants & Comptes</h2>
          </div>
          <button onClick={generateAutoIds} className="text-xs font-bold text-primary hover:text-white uppercase">Auto-générer</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Identifiant</label>
            <input type="text" name="identifiant" value={form.identifiant} onChange={handleChange} className={`w-full bg-white/5 border ${errors.identifiant ? 'border-rose-500/80' : 'border-white/10'} focus:border-primary rounded-xl px-4 py-3 text-sm text-white`} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">IBAN</label>
            <input type="text" name="iban" value={form.iban} onChange={handleChange} className={`w-full bg-white/5 border ${errors.iban ? 'border-rose-500/80' : 'border-white/10'} focus:border-primary rounded-xl px-4 py-3 text-sm text-white`} />
          </div>
        </div>
      </div>

      {mode === 'custom' && (
        <div className="glass p-6 md:p-8 space-y-6 rounded-2xl border border-white/10">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <Wallet className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-black italic uppercase tracking-tight text-white">4. Paramètres Avancés</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Profil</label>
              <select name="profil" value={form.profil} onChange={handleChange} className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-sm text-white">
                <option value="normal">Normal</option>
                <option value="fonctionnaire">Fonctionnaire</option>
                <option value="independant">Indépendant</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Niveau de richesse</label>
              <select name="richesse" value={form.richesse} onChange={handleChange} className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-sm text-white">
                <option value="pauvre">Faible</option>
                <option value="moyen">Moyen</option>
                <option value="riche">Élevé</option>
              </select>
            </div>
          </div>
        </div>
      )}

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
