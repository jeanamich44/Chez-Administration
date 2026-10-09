"use client";


import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Lock,
  MapPin,
  RefreshCw,
  Sparkles,
  User,
  Wallet
} from "lucide-react";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { isValidCalendarDate } from "@/components/generate_docs/_shared/CustomDatePicker";
import MultiPagePreviewViewer from "@/components/generate_docs/_shared/MultiPagePreviewViewer";
import DocumentActionButtons from "@/components/generate_docs/_shared/DocumentActionButtons";
import { getAuthHeaders } from "@/components/generate_docs/_shared/telegramAuth";
import { usePreviewCooldown } from "@/components/generate_docs/_shared/usePreviewCooldown";

/* ===================================================================== */

interface DurationOption {
  months: number;
  label: string;
  sublabel: string;
  price: number;
  badge?: string;
}

const DURATION_OPTIONS: DurationOption[] = [
  { months: 1, label: "1 Mois", sublabel: "Bulletin unitaire", price: 8 },
  { months: 3, label: "3 Mois", sublabel: "Trimestre standard (Dossier locatif / banque)", price: 20, badge: "POPULAIRE" },
  { months: 6, label: "6 Mois", sublabel: "Semestre complet (Dossier crédit)", price: 40 },
  { months: 12, label: "12 Mois", sublabel: "Année entière (Bilan complet)", price: 60, badge: "ÉCONOMIE" }
];

const FRENCH_MONTHS = [
  { id: 1, name: "Janvier" },
  { id: 2, name: "Février" },
  { id: 3, name: "Mars" },
  { id: 4, name: "Avril" },
  { id: 5, name: "Mai" },
  { id: 6, name: "Juin" },
  { id: 7, name: "Juillet" },
  { id: 8, name: "Août" },
  { id: 9, name: "Septembre" },
  { id: 10, name: "Octobre" },
  { id: 11, name: "Novembre" },
  { id: 12, name: "Décembre" }
];

const DEFAULT_FORM = {
  mode: "facile" as "facile" | "personnalise",
  duree_mois: 3,
  mois_debut: 1,
  annee_debut: 2026,

  raison_sociale: "GROUPE EUROPE HANDLING",
  adresse: "3 RUE DU REMBLAI",
  code_postal: "93290",
  ville: "TREMBLAY-EN-FRANCE",
  siret: "40114427400040",
  code_naf: "5223Z",
  etablissement: "Siège social",
  convention_collective: "Convention collective nationale du personnel au sol des entreprises de transport aérien",
  convention_collective_court: "PERSONNEL AU SOL DU TRANSPORT AERIEN",

  civilite: "M.",
  nom: "MARTIN",
  prenom: "Lucas",
  nom_complet: "MARTIN LUCAS",
  salarie_adresse: "12 RUE DES FLEURS",
  salarie_cp: "75011",
  salarie_ville: "PARIS",
  nir: "1950475111001",
  matricule: "05984",
  emploi: "SUPERVISEUR COMMERCIAL",
  qualification: "EMPLOYE",
  echelon: "2",
  coefficient: "215",
  date_anciennete: "18 mars 2023",

  net_a_payer_cible: "2460,00",
  salaire_base: "",
  heures_mensuelles: "151,67",
  prime_habillage: "210,42",
  frais_professionnels: "94,00",
  mutuelle_salarie: "33,59",
  mutuelle_patronale: "64,45",
  allegement_cotisations: "63,15",
  taux_pas: "5,00",

  cp_n1_du: 30.0,
  cp_n1_pris: 5.0,
  cp_n1_reste: 25.0,
  cp_n_du: 10.0,
  cp_n_pris: 0.0,
  cp_n_reste: 10.0,
  repos_compensateur_du: 0.0,
  repos_compensateur_pris: 0.0,
  repos_compensateur_reste: 0.0,

  date_debut: "",
  date_fin: "",
  date_paiement: "",
  mode_paiement: "Virement",

  header: true,
  header_employeur: true,
  header_titre: true,
  header_periode: true,
  header_salarie: true,
  header_convention: true,
  middle: true,
  middle_tableau_cotisations: true,
  middle_net_avant_impot: true,
  middle_impot_source: true,
  footer: true,
  footer_conges: true,
  footer_cumuls: true,
  footer_recapitulatif: true,
  footer_mentions: true
};

const FIELD_LIMITS: Record<string, { min: number; max: number; label: string; required?: boolean }> = {
  raison_sociale: { min: 2, max: 80, label: "Raison sociale employeur", required: true },
  siret: { min: 14, max: 14, label: "N° SIRET (14 chiffres)", required: true },
  code_naf: { min: 4, max: 6, label: "Code NAF / APE", required: true },
  nom: { min: 2, max: 40, label: "Nom de famille salarié", required: true },
  prenom: { min: 2, max: 40, label: "Prénom salarié", required: true },
  nir: { min: 13, max: 15, label: "N° Sécurité Sociale (NIR)", required: true },
  emploi: { min: 2, max: 60, label: "Emploi / Poste", required: true },
  salarie_adresse: { min: 4, max: 80, label: "Adresse salarié", required: true },
  salarie_cp: { min: 5, max: 5, label: "Code postal salarié", required: true },
  salarie_ville: { min: 2, max: 40, label: "Ville salarié", required: true }
};

interface AddressSuggestion {
  label: string;
  name: string;
  postcode: string;
  city: string;
}

interface CitySuggestion {
  nom: string;
  codePostal: string;
}

// ----------------------------------------------------------------------

export default function FicheDePaieClient({ onBack }: { onBack: () => void }) {
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const [previewPages, setPreviewPages] = useState<string[]>([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const { cooldown, isBlocked, allowed, assertReady, startCooldown, formatTimer } = usePreviewCooldown("emploi");

  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const addressContainerRef = useRef<HTMLDivElement>(null);

  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [cityDropdownTarget, setCityDropdownTarget] = useState<"salarie" | "employeur" | null>(null);
  const salarieCityContainerRef = useRef<HTMLDivElement>(null);
  const employeurCityContainerRef = useRef<HTMLDivElement>(null);
  const cityDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const [dynamicPrices, setDynamicPrices] = useState<Record<number, number>>({ 1: 8, 3: 20, 6: 40, 12: 60 });

  const curYear = new Date().getFullYear();
  const availableYears = [curYear + 1, curYear, curYear - 1, curYear - 2, curYear - 3];
  const durationOptions = DURATION_OPTIONS.map(d => ({ ...d, price: dynamicPrices[d.months] ?? d.price }));
  const selectedDuration = durationOptions.find(d => d.months === formData.duree_mois) || durationOptions[1];

  useEffect(() => {
    fetch("/api/generate-docs/emploi/pricing")
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data?.prices) {
          setDynamicPrices({
            1: data.prices["1_mois"] ?? 8,
            3: data.prices["3_mois"] ?? 20,
            6: data.prices["6_mois"] ?? 40,
            12: data.prices["12_mois"] ?? 60
          });
        }
      })
      .catch(() => {});

    function handleClickOutside(event: MouseEvent) {
      if (addressContainerRef.current && !addressContainerRef.current.contains(event.target as Node)) {
        setShowAddressDropdown(false);
      }
      const targetNode = event.target as Node;
      const clickedSalarie = salarieCityContainerRef.current?.contains(targetNode);
      const clickedEmployeur = employeurCityContainerRef.current?.contains(targetNode);
      if (!clickedSalarie && !clickedEmployeur) {
        setShowCityDropdown(false);
        setCityDropdownTarget(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNameChange = (nomVal: string, prenomVal: string, civVal: string) => {
    const cleanNom = nomVal.trim().toUpperCase();
    const cleanPrenom = prenomVal.trim().toUpperCase();
    const full = `${cleanNom} ${cleanPrenom}`.trim();
    setFormData(prev => ({
      ...prev,
      nom: nomVal,
      prenom: prenomVal,
      civilite: civVal,
      nom_complet: full
    }));
  };

  const fetchCityFromCp = async (cpVal: string, target: "salarie" | "employeur") => {
    if (cpVal.length !== 5) {
      setCitySuggestions([]);
      setShowCityDropdown(false);
      setCityDropdownTarget(null);
      return;
    }
    const targetVilleKey = target === "salarie" ? "salarie_ville" : "ville";
    try {
      const res = await fetch(`https://geo.api.gouv.fr/communes?codePostal=${cpVal}&fields=nom,codePostal,codesPostaux&format=json`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length === 1) {
          const cityName = data[0].nom.toUpperCase();
          setFormData(prev => ({ ...prev, [targetVilleKey]: cityName }));
          setCitySuggestions([]);
          setShowCityDropdown(false);
          setCityDropdownTarget(null);
          setErrors(prev => ({ ...prev, [targetVilleKey]: "" }));
          toast.success(`Commune détectée : ${data[0].nom}`);
        } else if (data && data.length > 1) {
          const suggestions: CitySuggestion[] = data.map((c: any) => ({
            nom: c.nom.toUpperCase(),
            codePostal: cpVal
          }));
          setCitySuggestions(suggestions);
          setCityDropdownTarget(target);
          setShowCityDropdown(true);
        } else {
          setCitySuggestions([]);
          setShowCityDropdown(false);
          setCityDropdownTarget(null);
        }
      }
    } catch {
      setCitySuggestions([]);
      setShowCityDropdown(false);
      setCityDropdownTarget(null);
    }
  };

  const handleCityFieldAutocomplete = (cityVal: string, target: "salarie" | "employeur") => {
    if (cityDebounceRef.current) {
      clearTimeout(cityDebounceRef.current);
    }
    const trimmed = cityVal.trim();
    if (trimmed.length < 2) {
      setCitySuggestions([]);
      setShowCityDropdown(false);
      setCityDropdownTarget(null);
      return;
    }

    cityDebounceRef.current = setTimeout(async () => {
      const targetVilleKey = target === "salarie" ? "salarie_ville" : "ville";
      const targetCpKey = target === "salarie" ? "salarie_cp" : "code_postal";

      const digitsOnly = trimmed.replace(/\D/g, "");
      if (digitsOnly.length === 5 && (trimmed === digitsOnly || /^\d{5}/.test(trimmed))) {
        const cpVal = digitsOnly.slice(0, 5);
        try {
          const res = await fetch(`https://geo.api.gouv.fr/communes?codePostal=${cpVal}&fields=nom,codePostal,codesPostaux&format=json`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length === 1) {
              const cityName = data[0].nom.toUpperCase();
              setFormData(prev => ({
                ...prev,
                [targetVilleKey]: cityName,
                [targetCpKey]: cpVal
              }));
              setErrors(prev => ({
                ...prev,
                [targetVilleKey]: "",
                [targetCpKey]: ""
              }));
              setCitySuggestions([]);
              setShowCityDropdown(false);
              setCityDropdownTarget(null);
              toast.success(`Commune détectée : ${data[0].nom}`);
              return;
            } else if (Array.isArray(data) && data.length > 1) {
              setCitySuggestions(data.map((item: any) => ({ nom: item.nom.toUpperCase(), codePostal: cpVal })));
              setCityDropdownTarget(target);
              setShowCityDropdown(true);
              return;
            }
          }
        } catch {}
      }

      const searchName = trimmed.replace(/^\d{1,5}\s*/, "").trim() || trimmed;
      if (searchName.length < 2) {
        setCitySuggestions([]);
        setShowCityDropdown(false);
        setCityDropdownTarget(null);
        return;
      }

      try {
        const res = await fetch(
          `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(searchName)}&fields=nom,codePostal,codesPostaux&format=json&boost=population&limit=8`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
          setCitySuggestions([]);
          setShowCityDropdown(false);
          setCityDropdownTarget(null);
          return;
        }

        const suggestions: CitySuggestion[] = data.map((item: any) => ({
          nom: item.nom.toUpperCase(),
          codePostal: item.codesPostaux?.[0] || item.codePostal || ""
        }));

        const trimmedUpper = searchName.toUpperCase();
        const exactMatch = data.find((item: any) => item.nom.toUpperCase() === trimmedUpper);
        if (exactMatch && exactMatch.codesPostaux?.length === 1) {
          const zip = exactMatch.codesPostaux[0] || exactMatch.codePostal;
          if (zip) {
            setFormData(prev => ({ ...prev, [targetCpKey]: zip }));
            setErrors(prev => ({ ...prev, [targetCpKey]: "" }));
          }
        }

        setCitySuggestions(suggestions);
        setCityDropdownTarget(target);
        setShowCityDropdown(true);
      } catch {
        setCitySuggestions([]);
        setShowCityDropdown(false);
        setCityDropdownTarget(null);
      }
    }, 200);
  };

  const selectCitySuggestion = (item: CitySuggestion) => {
    if (cityDropdownTarget === "salarie") {
      setFormData(prev => ({
        ...prev,
        salarie_ville: item.nom,
        salarie_cp: item.codePostal || prev.salarie_cp
      }));
      setErrors(prev => ({ ...prev, salarie_ville: "", salarie_cp: "" }));
    } else if (cityDropdownTarget === "employeur") {
      setFormData(prev => ({
        ...prev,
        ville: item.nom,
        code_postal: item.codePostal || prev.code_postal
      }));
      setErrors(prev => ({ ...prev, ville: "", code_postal: "" }));
    }
    setShowCityDropdown(false);
    setCityDropdownTarget(null);
    setCitySuggestions([]);
  };

  const handleAddressChange = async (val: string) => {
    setFormData(prev => ({ ...prev, salarie_adresse: val }));
    if (val.trim().length > 3) {
      try {
        const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(val)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          const list: AddressSuggestion[] = (data.features || []).map((f: any) => ({
            label: f.properties.label,
            name: f.properties.name,
            postcode: f.properties.postcode,
            city: f.properties.city
          }));
          setAddressSuggestions(list);
          setShowAddressDropdown(list.length > 0);
        }
      } catch {
        setAddressSuggestions([]);
      }
    } else {
      setAddressSuggestions([]);
      setShowAddressDropdown(false);
    }
  };

  const selectAddressSuggestion = (item: AddressSuggestion) => {
    setFormData(prev => ({
      ...prev,
      salarie_adresse: item.name.toUpperCase(),
      salarie_cp: item.postcode,
      salarie_ville: item.city.toUpperCase()
    }));
    setErrors(prev => ({
      ...prev,
      salarie_adresse: "",
      salarie_cp: "",
      salarie_ville: ""
    }));
    setShowAddressDropdown(false);
    toast.success(`Adresse appliquée : ${item.label}`);
  };

  const handleFillExample = () => {
    setFormData({
      ...DEFAULT_FORM,
      mode: formData.mode,
      duree_mois: formData.duree_mois,
      mois_debut: formData.mois_debut,
      annee_debut: formData.annee_debut
    });
    setErrors({});
    toast.info("Formulaire réinitialisé avec des données d'exemple");
  };

  const handleReset = () => {
    setFormData({
      ...DEFAULT_FORM,
      raison_sociale: "",
      siret: "",
      code_naf: "",
      nom: "",
      prenom: "",
      nom_complet: "",
      salarie_adresse: "",
      salarie_cp: "",
      salarie_ville: "",
      nir: "",
      matricule: "",
      emploi: "",
      net_a_payer_cible: "0,00"
    });
    setErrors({});
    toast.info("Champs réinitialisés");
  };

  const validateField = (field: string, val: string): string => {
    const v = val.trim();
    if (field === "date_anciennete") {
      if (v) {
        const check = isValidCalendarDate(v);
        if (!check.valid) {
          return check.message || "Date d'ancienneté invalide.";
        }
      }
      return "";
    }
    const rule = FIELD_LIMITS[field];
    if (!rule) return "";
    if (rule.required && !v) return `Le champ ${rule.label} est requis`;
    if (rule.min && v.length < rule.min) return `Minimum ${rule.min} caractères`;
    if (rule.max && v.length > rule.max) return `Maximum ${rule.max} caractères`;
    return "";
  };

  const validateAll = (): boolean => {
    const nextErrors: Record<string, string> = {};
    Object.keys(FIELD_LIMITS).forEach(f => {
      const val = (formData as any)[f] || "";
      const err = validateField(f, String(val));
      if (err) nextErrors[f] = err;
    });

    if (formData.date_anciennete && formData.date_anciennete.trim()) {
      const err = validateField("date_anciennete", formData.date_anciennete);
      if (err) nextErrors.date_anciennete = err;
    }

    const netRaw = formData.net_a_payer_cible.replace("€", "").replace(" ", "").replace(",", ".").trim();
    const netVal = parseFloat(netRaw);
    if (isNaN(netVal) || netVal <= 0) {
      nextErrors.net_a_payer_cible = "Veuillez renseigner un salaire net valide (> 0 €)";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handlePreview = async () => {
    if (!assertReady()) return;
    if (!validateAll()) {
      toast.error("Formulaire incomplet. Veuillez corriger les champs requis.");
      return;
    }
    setIsPreviewLoading(true);
    try {
      const res = await fetch("/api/generate-docs/emploi/fiche_de_paie/preview", {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Erreur de prévisualisation");
      }
      const data = await res.json();
      setPreviewPages(data.pages || []);
      startCooldown();
      toast.success("Aperçu généré !");
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la génération de l'aperçu");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const closePreview = () => {
    setPreviewPages([]);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) {
      toast.error("Formulaire incomplet. Veuillez corriger les champs requis.");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate-docs/emploi/fiche_de_paie/generate", {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Erreur ${res.status}`);
      }
      const contentDisposition = res.headers.get("content-disposition");
      let filename = formData.duree_mois === 1
        ? `Fiche_de_paie_${formData.mois_debut}_${formData.annee_debut}.pdf`
        : `Fiches_de_paie_${formData.duree_mois}_mois.zip`;
      if (contentDisposition && contentDisposition.includes("filename=")) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Fiche(s) de paie générée(s) avec succès (${selectedDuration.price.toFixed(2)} €)`);
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la génération du document");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="min-h-screen pt-6 md:pt-36 pb-32 md:pb-20 px-4 md:px-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/40 hover:text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} /> Emploi et Travail
        </button>
        <span className="text-white/20">/</span>
        <span className="text-xs font-black uppercase tracking-widest text-primary">Fiche de Paie</span>
      </div>

      <div className="mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-900/60 to-slate-950 border border-sky-500/30 flex items-center justify-center p-3 shadow-xl">
              <img src="/logos/fiche_de_paie.svg" alt="Fiche de Paie" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-black italic text-white tracking-tight">
                FICHE DE <span className="text-primary">PAIE</span>
              </h1>
              <p className="text-white/50 text-xs font-medium uppercase tracking-wider mt-1">
                Bulletin de salaire officiel • Multi-mois (1 à 12 mois) • Cumuls YTD & PAS conformes
              </p>
            </div>
          </div>

          <div className="flex items-center p-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md self-start md:self-auto">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, mode: "facile" }))}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                formData.mode === "facile"
                  ? "bg-primary text-slate-950 shadow-lg shadow-primary/20"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Sparkles size={14} /> Mode Normal
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, mode: "personnalise" }))}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                formData.mode === "personnalise"
                  ? "bg-primary text-slate-950 shadow-lg shadow-primary/20"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <FileText size={14} /> Mode Personnalisé
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="space-y-8">
        <section className="glass p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/10 space-y-4 sm:space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <Calendar className="text-primary" size={20} />
            <h2 className="text-lg font-black uppercase tracking-wider text-white">
              1. Durée & Période d&apos;Émission
            </h2>
          </div>

          <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
            {durationOptions.map(opt => {
              const isSelected = formData.duree_mois === opt.months;
              return (
                <button
                  key={opt.months}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, duree_mois: opt.months }))}
                  className={`relative py-2.5 px-1 sm:py-3.5 sm:px-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                    isSelected
                      ? "bg-primary/15 border-primary shadow-md shadow-primary/20 ring-1 ring-primary/40"
                      : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.06]"
                  }`}
                >
                  {opt.badge && (
                    <span className="absolute -top-2 right-1 sm:right-2 px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider bg-primary text-slate-950 shadow">
                      {opt.badge}
                    </span>
                  )}
                  <span className="text-xs sm:text-sm font-black text-white uppercase tracking-tight">
                    {opt.label}
                  </span>
                  <span className="text-[11px] sm:text-xs font-black text-primary mt-0.5">
                    {opt.price.toFixed(2)} €
                  </span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                Mois de début
              </label>
              <select
                value={formData.mois_debut}
                onChange={e => setFormData(prev => ({ ...prev, mois_debut: parseInt(e.target.value, 10) }))}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium focus:border-primary focus:outline-none transition-colors"
              >
                {FRENCH_MONTHS.map(m => (
                  <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                Année
              </label>
              <select
                value={formData.annee_debut}
                onChange={e => setFormData(prev => ({ ...prev, annee_debut: parseInt(e.target.value, 10) }))}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium focus:border-primary focus:outline-none transition-colors"
              >
                {availableYears.map(y => (
                  <option key={y} value={y} className="bg-slate-900 text-white">
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="glass p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <Building2 className="text-primary" size={20} />
            <h2 className="text-lg font-black uppercase tracking-wider text-white">
              2. Informations Entreprise & Employeur
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                Raison Sociale / Nom de l&apos;entreprise *
              </label>
              <input
                type="text"
                value={formData.raison_sociale}
                onChange={e => setFormData(prev => ({ ...prev, raison_sociale: e.target.value }))}
                placeholder="Ex: GROUPE EUROPE HANDLING"
                className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white font-medium focus:border-primary focus:outline-none transition-colors ${
                  errors.raison_sociale ? "border-rose-500/80" : "border-white/10"
                }`}
              />
              {errors.raison_sociale && <p className="text-[11px] text-rose-400 mt-1">{errors.raison_sociale}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                Numéro SIRET (14 chiffres) *
              </label>
              <input
                type="text"
                maxLength={14}
                value={formData.siret}
                onChange={e => setFormData(prev => ({ ...prev, siret: e.target.value.replace(/\D/g, "") }))}
                placeholder="Ex: 40114427400040"
                className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white font-medium focus:border-primary focus:outline-none transition-colors ${
                  errors.siret ? "border-rose-500/80" : "border-white/10"
                }`}
              />
              {errors.siret && <p className="text-[11px] text-rose-400 mt-1">{errors.siret}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                Code NAF / APE *
              </label>
              <input
                type="text"
                maxLength={6}
                value={formData.code_naf}
                onChange={e => setFormData(prev => ({ ...prev, code_naf: e.target.value.toUpperCase() }))}
                placeholder="Ex: 5223Z"
                className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white font-medium focus:border-primary focus:outline-none transition-colors ${
                  errors.code_naf ? "border-rose-500/80" : "border-white/10"
                }`}
              />
              {errors.code_naf && <p className="text-[11px] text-rose-400 mt-1">{errors.code_naf}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                Convention Collective
              </label>
              <input
                type="text"
                value={formData.convention_collective_court}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    convention_collective_court: e.target.value,
                    convention_collective: e.target.value
                  }))
                }
                placeholder="Ex: PERSONNEL AU SOL DU TRANSPORT AERIEN"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium focus:border-primary focus:outline-none transition-colors"
              />
            </div>

            {formData.mode === "personnalise" && (
              <>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                    Adresse postale employeur
                  </label>
                  <input
                    type="text"
                    value={formData.adresse}
                    onChange={e => setFormData(prev => ({ ...prev, adresse: e.target.value }))}
                    placeholder="Ex: 3 RUE DU REMBLAI"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium focus:border-primary focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                    Code Postal
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    value={formData.code_postal}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, "");
                      setFormData(prev => ({ ...prev, code_postal: val }));
                      fetchCityFromCp(val, "employeur");
                    }}
                    placeholder="Ex: 93290"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium focus:border-primary focus:outline-none transition-colors"
                  />
                </div>

                <div className="relative" ref={employeurCityContainerRef}>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                    Ville
                  </label>
                  <input
                    type="text"
                    value={formData.ville}
                    onChange={e => {
                      const val = e.target.value.toUpperCase();
                      setFormData(prev => ({ ...prev, ville: val }));
                      handleCityFieldAutocomplete(val, "employeur");
                    }}
                    placeholder="Ex: TREMBLAY-EN-FRANCE"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium focus:border-primary focus:outline-none transition-colors"
                  />

                  {showCityDropdown && cityDropdownTarget === "employeur" && citySuggestions.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 mt-1 rounded-xl bg-slate-900 border border-white/20 shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                      {citySuggestions.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => selectCitySuggestion(item)}
                          className="px-4 py-2 hover:bg-primary/20 text-xs text-white cursor-pointer border-b border-white/5 last:border-0 flex justify-between"
                        >
                          <span className="font-medium">{item.nom}</span>
                          <span className="text-white/40 text-[10px]">{item.codePostal}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        <section className="glass p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <User className="text-primary" size={20} />
            <h2 className="text-lg font-black uppercase tracking-wider text-white">
              3. Informations Salarié
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                Civilité
              </label>
              <select
                value={formData.civilite}
                onChange={e => handleNameChange(formData.nom, formData.prenom, e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium focus:border-primary focus:outline-none transition-colors"
              >
                <option value="M." className="bg-slate-900 text-white">M.</option>
                <option value="Mme" className="bg-slate-900 text-white">Mme</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                Nom de famille *
              </label>
              <input
                type="text"
                value={formData.nom}
                onChange={e => handleNameChange(e.target.value, formData.prenom, formData.civilite)}
                placeholder="Ex: MARTIN"
                className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white font-medium focus:border-primary focus:outline-none transition-colors ${
                  errors.nom ? "border-rose-500/80" : "border-white/10"
                }`}
              />
              {errors.nom && <p className="text-[11px] text-rose-400 mt-1">{errors.nom}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                Prénom *
              </label>
              <input
                type="text"
                value={formData.prenom}
                onChange={e => handleNameChange(formData.nom, e.target.value, formData.civilite)}
                placeholder="Ex: LUCAS"
                className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white font-medium focus:border-primary focus:outline-none transition-colors ${
                  errors.prenom ? "border-rose-500/80" : "border-white/10"
                }`}
              />
              {errors.prenom && <p className="text-[11px] text-rose-400 mt-1">{errors.prenom}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                Emploi / Intitulé de poste *
              </label>
              <input
                type="text"
                value={formData.emploi}
                onChange={e => setFormData(prev => ({ ...prev, emploi: e.target.value.toUpperCase() }))}
                placeholder="Ex: SUPERVISEUR COMMERCIAL"
                className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white font-medium focus:border-primary focus:outline-none transition-colors ${
                  errors.emploi ? "border-rose-500/80" : "border-white/10"
                }`}
              />
              {errors.emploi && <p className="text-[11px] text-rose-400 mt-1">{errors.emploi}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                Numéro NIR (Sécurité Sociale) *
              </label>
              <input
                type="text"
                maxLength={15}
                value={formData.nir}
                onChange={e => setFormData(prev => ({ ...prev, nir: e.target.value.replace(/\D/g, "") }))}
                placeholder="Ex: 1950475111001"
                className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white font-medium focus:border-primary focus:outline-none transition-colors ${
                  errors.nir ? "border-rose-500/80" : "border-white/10"
                }`}
              />
              {errors.nir && <p className="text-[11px] text-rose-400 mt-1">{errors.nir}</p>}
            </div>

            <div className="sm:col-span-3 relative" ref={addressContainerRef}>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                Adresse postale salarié *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.salarie_adresse}
                  onChange={e => handleAddressChange(e.target.value)}
                  placeholder="Ex: 12 RUE DES FLEURS"
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white font-medium focus:border-primary focus:outline-none transition-colors ${
                    errors.salarie_adresse ? "border-rose-500/80" : "border-white/10"
                  }`}
                />
                <MapPin className="absolute right-3 top-3.5 text-white/30" size={18} />
              </div>
              {errors.salarie_adresse && <p className="text-[11px] text-rose-400 mt-1">{errors.salarie_adresse}</p>}

              {showAddressDropdown && addressSuggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 rounded-xl bg-slate-900 border border-white/20 shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                  {addressSuggestions.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => selectAddressSuggestion(item)}
                      className="px-4 py-2.5 hover:bg-primary/20 text-xs text-white cursor-pointer border-b border-white/5 last:border-0 flex items-center justify-between"
                    >
                      <span className="font-medium">{item.label}</span>
                      <span className="text-white/40 text-[10px]">{item.postcode}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                Code Postal *
              </label>
              <input
                type="text"
                maxLength={5}
                value={formData.salarie_cp}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, "");
                  setFormData(prev => ({ ...prev, salarie_cp: val }));
                  fetchCityFromCp(val, "salarie");
                }}
                placeholder="Ex: 75011"
                className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white font-medium focus:border-primary focus:outline-none transition-colors ${
                  errors.salarie_cp ? "border-rose-500/80" : "border-white/10"
                }`}
              />
              {errors.salarie_cp && <p className="text-[11px] text-rose-400 mt-1">{errors.salarie_cp}</p>}
            </div>

            <div className="sm:col-span-2 relative" ref={salarieCityContainerRef}>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                Ville *
              </label>
              <input
                type="text"
                value={formData.salarie_ville}
                onChange={e => {
                  const val = e.target.value.toUpperCase();
                  setFormData(prev => ({ ...prev, salarie_ville: val }));
                  handleCityFieldAutocomplete(val, "salarie");
                }}
                placeholder="Ex: PARIS"
                className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white font-medium focus:border-primary focus:outline-none transition-colors ${
                  errors.salarie_ville ? "border-rose-500/80" : "border-white/10"
                }`}
              />
              {errors.salarie_ville && <p className="text-[11px] text-rose-400 mt-1">{errors.salarie_ville}</p>}

              {showCityDropdown && cityDropdownTarget === "salarie" && citySuggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 rounded-xl bg-slate-900 border border-white/20 shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                  {citySuggestions.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => selectCitySuggestion(item)}
                      className="px-4 py-2 hover:bg-primary/20 text-xs text-white cursor-pointer border-b border-white/5 last:border-0 flex justify-between"
                    >
                      <span className="font-medium">{item.nom}</span>
                      <span className="text-white/40 text-[10px]">{item.codePostal}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {formData.mode === "personnalise" && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                    Matricule Salarié
                  </label>
                  <input
                    type="text"
                    value={formData.matricule}
                    onChange={e => setFormData(prev => ({ ...prev, matricule: e.target.value }))}
                    placeholder="Ex: 05984"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium focus:border-primary focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                    Qualification
                  </label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={e => setFormData(prev => ({ ...prev, qualification: e.target.value.toUpperCase() }))}
                    placeholder="Ex: EMPLOYE"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium focus:border-primary focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                    Date d&apos;ancienneté
                  </label>
                  <input
                    type="text"
                    value={formData.date_anciennete}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData(prev => ({ ...prev, date_anciennete: val }));
                      const err = validateField("date_anciennete", val);
                      setErrors(prev => ({ ...prev, date_anciennete: err }));
                    }}
                    placeholder="Ex: 18 mars 2023"
                    className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white font-medium focus:outline-none transition-colors ${
                      errors.date_anciennete ? "border-rose-500/80 focus:border-rose-500" : "border-white/10 focus:border-primary"
                    }`}
                  />
                  {errors.date_anciennete ? (
                    <p className="text-[11px] text-rose-400 font-bold mt-1">{errors.date_anciennete}</p>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </section>

        <section className="glass p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <Wallet className="text-primary" size={20} />
            <h2 className="text-lg font-black uppercase tracking-wider text-white">
              4. Rémunération & Prélèvement à la Source
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                Net à payer souhaité (€) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.net_a_payer_cible}
                  onChange={e => setFormData(prev => ({ ...prev, net_a_payer_cible: e.target.value }))}
                  placeholder="Ex: 2460,00"
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white font-bold text-lg focus:border-primary focus:outline-none transition-colors ${
                    errors.net_a_payer_cible ? "border-rose-500/80" : "border-white/10"
                  }`}
                />
                <span className="absolute right-3 top-3.5 text-primary font-black">€</span>
              </div>
              {errors.net_a_payer_cible && <p className="text-[11px] text-rose-400 mt-1">{errors.net_a_payer_cible}</p>}
              <p className="text-[10px] text-white/40 mt-1">Le moteur calcule automatiquement le brut exact et les cotisations</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                Heures mensuelles
              </label>
              <input
                type="text"
                value={formData.heures_mensuelles}
                onChange={e => setFormData(prev => ({ ...prev, heures_mensuelles: e.target.value }))}
                placeholder="Ex: 151,67"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium focus:border-primary focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                Taux PAS (%)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.taux_pas}
                  onChange={e => setFormData(prev => ({ ...prev, taux_pas: e.target.value }))}
                  placeholder="Ex: 5,00"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium focus:border-primary focus:outline-none transition-colors"
                />
                <span className="absolute right-3 top-3.5 text-white/40 font-bold">%</span>
              </div>
            </div>

            {formData.mode === "personnalise" && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                    Prime d&apos;habillage / présence (€)
                  </label>
                  <input
                    type="text"
                    value={formData.prime_habillage}
                    onChange={e => setFormData(prev => ({ ...prev, prime_habillage: e.target.value }))}
                    placeholder="Ex: 210,42"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium focus:border-primary focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                    Remboursement frais (€)
                  </label>
                  <input
                    type="text"
                    value={formData.frais_professionnels}
                    onChange={e => setFormData(prev => ({ ...prev, frais_professionnels: e.target.value }))}
                    placeholder="Ex: 94,00"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium focus:border-primary focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                    Mutuelle part salarié (€)
                  </label>
                  <input
                    type="text"
                    value={formData.mutuelle_salarie}
                    onChange={e => setFormData(prev => ({ ...prev, mutuelle_salarie: e.target.value }))}
                    placeholder="Ex: 33,59"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
              </>
            )}
          </div>
        </section>

        <DocumentActionButtons
          onFillExample={handleFillExample}
          onReset={handleReset}
          onPreview={handlePreview}
          isPreviewLoading={isPreviewLoading}
          isGenerating={isGenerating}
          isPreviewBlocked={isBlocked}
          previewAllowed={allowed}
          previewCooldown={cooldown}
          formatCooldownTimer={formatTimer}
          previewLabel={`Aperçu ${formData.duree_mois} mois`}
          generateLabel="Générer le bulletin"
          price={selectedDuration.price}
          submitType="submit"
        />
      </form>

      {previewPages.length > 0 ? (
        <MultiPagePreviewViewer
          pages={previewPages}
          title={`Aperçu - Fiche de Paie (${formData.duree_mois} mois)`}
          onClose={closePreview}
          onAction={() => handleGenerate({ preventDefault: () => {} } as React.FormEvent)}
          isActionLoading={isGenerating}
          actionLabel={`Générer le bulletin (${selectedDuration.price.toFixed(2)} €)`}
        />
      ) : null}
    </main>
  );
}
