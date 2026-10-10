"use client";

import {
ArrowLeft,
Briefcase,
Calendar,
CheckCircle2,
CreditCard,
Download,
Edit3,
Eye,
FileText,
Hash,
Leaf,
MapPin,
MessageSquare,
Navigation,
PiggyBank,
Plus,
RefreshCw,
Settings2,
ShieldCheck,
Sliders,
Sparkles,
Trash2,
User,
Wallet,
X
} from "lucide-react";

import { useEffect,useRef,useState } from "react";
import { toast } from "sonner";
import { isValidCalendarDate } from "@/components/generate_docs/_shared/CustomDatePicker";
import DocumentActionButtons from "@/components/generate_docs/_shared/DocumentActionButtons";
import { usePreviewCooldown } from "@/components/generate_docs/_shared/usePreviewCooldown";
import { getAuthHeaders } from "@/components/generate_docs/_shared/telegramAuth";

interface DurationOption {
  months: number;
  label: string;
  sublabel: string;
  price: number;
  badge?: string;
}

const DURATION_OPTIONS: DurationOption[] = [
  { months: 1, label: "1 Mois", sublabel: "Relevé unitaire", price: 8 },
  { months: 3, label: "3 Mois", sublabel: "Trimestre standard (Location)", price: 20, badge: "POPULAIRE" },
  { months: 6, label: "6 Mois", sublabel: "Semestre complet", price: 40 },
  { months: 12, label: "12 Mois", sublabel: "Année entière", price: 60, badge: "ÉCONOMIE" },
];

const PROFILES = [
  { id: "normal", label: "Salarié Standard", desc: "Salaire CDI, courses, abonnements, virements" },
  { id: "fonctionnaire", label: "Fonctionnaire / Agent Public", desc: "Traitement DGFIP, mutuelle MGEN, prélèvements" },
  { id: "retraite", label: "Retraité / Senior", desc: "Pensions CARSAT & Agirc-Arrco, pharmacie, mutuelle" },
  { id: "independant", label: "Indépendant / Freelance", desc: "Virements clients factures, URSSAF, frais pro" },
  { id: "artisan", label: "Artisan / BTP", desc: "Règlements chantiers, URSSAF, outillage, Point.P" },
  { id: "locataire", label: "Locataire Sain", desc: "Revenus réguliers, gestion saine sans découverts" },
  { id: "demandeur_credit", label: "Dossier Crédit", desc: "Épargne continue, profil stable et irréprochable" },
  { id: "famille", label: "Famille avec enfants", desc: "Prestations CAF, crèche/scolaire, supermarché" },
  { id: "etudiant", label: "Étudiant / Jeune", desc: "Bourse CROUS, petits virements, forfaits jeunes" },
  { id: "chomage", label: "France Travail / ARE", desc: "Allocations chômage, aides sociales, budget maîtrisé" },
  { id: "investisseur", label: "Investisseur / Patrimoine", desc: "Loyers perçus, syndic, hauts revenus" },
];

const WEALTH_PROFILES = [
  { id: "pauvre", label: "Modeste & Économique", desc: "Dépenses mesurées, plafonds de transactions bas" },
  { id: "moyen", label: "Standard & Équilibré", desc: "Dépenses courantes de la vie active (Standard)" },
  { id: "riche", label: "Aisé & Premium", desc: "Hauts revenus, achats fréquents et plafonds élevés" },
];

const LIVRET_TYPES = [
  { id: "LIVRET_A", name: "Livret A", defaultTaux: "3,00", bic: "PSSTFRPPCNE" },
  { id: "LDDS", name: "Livret Développement Durable (LDDS)", defaultTaux: "3,00", bic: "PSSTFRPPCNE" },
  { id: "LEP", name: "Livret d'Épargne Populaire (LEP)", defaultTaux: "4,00", bic: "PSSTFRPPCNE" },
  { id: "CSL", name: "Compte Sur Livret (CSL)", defaultTaux: "0,50", bic: "PSSTFRPPPAR" },
];

const PRELEVEMENT_CHOICES = [
  { id: "EDF", label: "EDF Énergie" },
  { id: "ENGIE", label: "Engie Gaz" },
  { id: "FREE_MOBILE", label: "Free Mobile" },
  { id: "ORANGE", label: "Orange Internet" },
  { id: "BOUYGUES", label: "Bouygues Telecom" },
  { id: "MUTUELLE", label: "Mutuelle Santé" },
  { id: "NETFLIX", label: "Netflix" },
  { id: "SPOTIFY", label: "Spotify" },
  { id: "FITNESS_PARK", label: "Fitness Park" },
  { id: "ASSURANCE_AUTO", label: "Assurance Auto" }
];

const INFO_BLOCK_TYPES = [
  { id: "auto", label: "Automatique selon Profil", desc: "Message officiel généré automatiquement" },
  { id: "releve_en_ligne", label: "Relevé Numérique en Ligne", desc: "Passage aux relevés dématérialisés" },
  { id: "fraude", label: "Alerte Sécurité & Phishing", desc: "Sensibilisation aux fraudes et faux conseillers" },
  { id: "prelevement", label: "Conseil Prélèvement Automatique", desc: "Gestion des factures par prélèvement auto" },
  { id: "alerte_sms", label: "Alertes SMS & Notifications", desc: "Suivi du compte en temps réel" },
  { id: "cheque", label: "Encaissement des Chèques", desc: "Consignes de signature et numéro au verso" },
  { id: "custom", label: "Texte Sur-Mesure", desc: "Rédigez votre propre bloc d'information officiel" },
];

const CENTRES_FINANCIERS_STANDARDS = [
  "PARIS CENTRE FINANCIER",
  "LYON CENTRE FINANCIER",
  "MARSEILLE CENTRE FINANCIER",
  "BORDEAUX CENTRE FINANCIER",
  "TOULOUSE CENTRE FINANCIER",
  "NANTES CENTRE FINANCIER",
  "LILLE CENTRE FINANCIER",
  "STRASBOURG CENTRE FINANCIER",
  "RENNES CENTRE FINANCIER",
  "MONTPELLIER CENTRE FINANCIER",
  "NICE CENTRE FINANCIER",
  "ORLEANS CENTRE FINANCIER",
  "ROUEN CENTRE FINANCIER",
  "DIJON CENTRE FINANCIER",
  "LIMOGES CENTRE FINANCIER",
  "AJACCIO CENTRE FINANCIER"
];

export interface CustomTxItem {
  id: string;
  month: number;
  all_months: boolean;
  date: string;
  type: string;
  signe: "+" | "-";
  libelle: string;
  montant: string;
}

export interface EpargneCompteItem {
  id: string;
  type: string;
  nom: string;
  numero: string;
  iban: string;
  bic: string;
  solde_initial: string;
  taux: string;
  nb_transactions: number;
  enabled: boolean;
}

export const INITIAL_EPARGNE_COMPTES: EpargneCompteItem[] = [
  {
    id: "LIVRET_A",
    type: "LIVRET_A",
    nom: "Livret A",
    numero: "210 5436798 J",
    iban: "FR7610011000202105436798J51",
    bic: "PSSTFRPPCNE",
    solde_initial: "5000,00",
    taux: "3,00",
    nb_transactions: 2,
    enabled: true
  },
  {
    id: "LDDS",
    type: "LDDS",
    nom: "Livret Développement Durable et Solidaire (LDDS)",
    numero: "340 8912475 K",
    iban: "FR7610011000203408912475K38",
    bic: "PSSTFRPPCNE",
    solde_initial: "2500,00",
    taux: "3,00",
    nb_transactions: 1,
    enabled: false
  },
  {
    id: "LEP",
    type: "LEP",
    nom: "Livret d'Épargne Populaire (LEP)",
    numero: "450 7821934 L",
    iban: "FR7610011000204507821934L42",
    bic: "PSSTFRPPCNE",
    solde_initial: "1000,00",
    taux: "4,00",
    nb_transactions: 1,
    enabled: false
  },
  {
    id: "CSL",
    type: "CSL",
    nom: "Compte Sur Livret (CSL)",
    numero: "560 6732819 M",
    iban: "FR7610011000205606732819M19",
    bic: "PSSTFRPPPAR",
    solde_initial: "8000,00",
    taux: "0,50",
    nb_transactions: 1,
    enabled: false
  }
];

const getCurrentYear = () => new Date().getFullYear();

const DEFAULT_FORM = {
  mode: "facile" as "facile" | "personnalise",
  duree_mois: 3,
  mois_debut: 1,
  annee_debut: getCurrentYear(),
  numero_releve_debut: 1,
  date_edition_custom: "",
  
  // Identité & Domiciliation
  civilite: "M.",
  nom: "DUPONT",
  prenom: "JEAN",
  nom_prenom: "DUPONT JEAN",
  adresse: "15 RUE DE LA REPUBLIQUE",
  complement_adresse: "",
  cp: "75001",
  ville: "PARIS",
  centre_financier: "PARIS CENTRE FINANCIER",
  is_custom_centre: false,
  
  // HERO & CCP (Compte Courant)
  identifiant: "1455835203", // 10 chiffres (Priorité 1)
  iban: "FR7620041010010012345678945", // IBAN (Priorité 2)
  numero_compte: "00123456789",
  cle_compte: "45",
  bic: "PSSTFRPPPAR",
  card_number: "456",
  decouvert_autorise: "300,00",
  taux_decouvert: "16,00",
  afficher_ccp: true,
  
  // Comptes Épargne & Livrets Multiples
  include_epargne: false,
  epargne_type: "LIVRET_A",
  epargne_nom: "Livret A",
  epargne_numero: "210 5436798 J",
  epargne_iban: "FR7610011000202105436798J51",
  epargne_bic: "PSSTFRPPCNE",
  epargne_solde_initial: "5000,00",
  epargne_taux: "3,00",
  epargne_nb_tx: 2,
  epargne_comptes: INITIAL_EPARGNE_COMPTES as EpargneCompteItem[],
  
  // Profil Financier
  profil: "normal",
  wealth_profile: "moyen",
  solde_initial: "3450,00",
  nb_transactions_moyen: 30,
  strict_zero_incident: true,
  
  // Personnalisé
  employeur_nom: "NEXITY SERVICES SAS",
  salaire_net: "2450,00",
  jour_salaire: 28,
  loyer_montant: "750,00",
  loyer_bailleur: "FONCIA GESTION IMMOBILIERE",
  prelevements_selectionnes: ["EDF", "ORANGE", "MUTUELLE"],
  target_solde_final: "",
  contacts_virements: "",
  
  // Options Visuelles & Annexes
  show_annexe_carbone: true,
  annexe_info_type: "auto",
  annexe_info_custom_text: "",
  
  // Custom Transactions
  custom_transactions: [] as CustomTxItem[]
};

function counterColor(len: number, min?: number, max?: number) {
  if (min !== undefined && len < min) return "text-amber-400 font-bold";
  if (max !== undefined && len > max) return "text-rose-400 font-bold";
  return "text-emerald-400 font-bold";
}

const FIELD_LIMITS: Record<string, { min: number; max: number; label: string; required?: boolean }> = {
  nom: { min: 2, max: 40, label: "Nom de famille", required: true },
  prenom: { min: 2, max: 40, label: "Prénom", required: true },
  nom_prenom: { min: 3, max: 60, label: "Nom & Prénom", required: true },
  adresse: { min: 4, max: 80, label: "Adresse postale", required: true },
  cp: { min: 5, max: 5, label: "Code Postal", required: true },
  ville: { min: 2, max: 40, label: "Ville", required: true },
  identifiant: { min: 10, max: 10, label: "Identifiant client", required: true },
  iban: { min: 27, max: 34, label: "IBAN La Banque Postale", required: true },
  numero_compte: { min: 4, max: 14, label: "N° Compte CCP", required: true },
  cle_compte: { min: 1, max: 2, label: "Clé RIB", required: true },
  bic: { min: 8, max: 11, label: "BIC / SWIFT", required: true },
  card_number: { min: 3, max: 4, label: "N° Carte (derniers chiffres)", required: true },
  solde_initial: { min: 1, max: 20, label: "Solde initial", required: true }
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

export default function LbpReleveClient({ onBack }: { onBack: () => void }) {
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const { cooldown, isBlocked, allowed, assertReady, startCooldown, formatTimer } = usePreviewCooldown("releve");
  
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const addressContainerRef = useRef<HTMLDivElement>(null);

  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityContainerRef = useRef<HTMLDivElement>(null);

  const [dynamicPrices, setDynamicPrices] = useState<Record<number, number>>({ 1: 8, 3: 20, 6: 40, 12: 60 });

  const currentYear = getCurrentYear();
  const availableYears = [currentYear + 1, currentYear, currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4];
  const durationOptions = DURATION_OPTIONS.map(d => ({ ...d, price: dynamicPrices[d.months] ?? d.price }));
  const selectedDuration = durationOptions.find(d => d.months === formData.duree_mois) || durationOptions[0];

  useEffect(() => {
    const curY = new Date().getFullYear();
    setFormData(prev => ({
      ...prev,
      annee_debut: curY,
      mois_debut: 1
    }));

    fetch("/api/generate-docs/releve/pricing")
      .then(r => r.ok ? r.json() : null)
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
      if (cityContainerRef.current && !cityContainerRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchCityFromCp = async (cpVal: string) => {
    if (cpVal.length !== 5) {
      setCitySuggestions([]);
      setShowCityDropdown(false);
      return;
    }
    try {
      const res = await fetch(`https://geo.api.gouv.fr/communes?codePostal=${cpVal}&fields=nom,codePostal,codesPostaux&format=json`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length === 1) {
          setFormData(prev => ({ ...prev, ville: data[0].nom.toUpperCase() }));
          setCitySuggestions([]);
          setShowCityDropdown(false);
          toast.success(`Ville détectée : ${data[0].nom}`);
        } else if (data && data.length > 1) {
          const suggestions: CitySuggestion[] = data.map((c: any) => ({
            nom: c.nom.toUpperCase(),
            codePostal: cpVal
          }));
          setCitySuggestions(suggestions);
          setShowCityDropdown(true);
          toast.info(`${data.length} communes trouvées pour le CP ${cpVal}. Choisissez votre ville.`);
        } else {
          setCitySuggestions([]);
          setShowCityDropdown(false);
        }
      }
    } catch {}
  };

  const fetchCpFromCity = async (cityVal: string) => {
    if (cityVal.trim().length < 2) {
      setCitySuggestions([]);
      setShowCityDropdown(false);
      return;
    }
    try {
      const res = await fetch(`https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(cityVal)}&fields=nom,codePostal,codesPostaux&format=json&boost=population&limit=5`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const suggestions: CitySuggestion[] = [];
          data.forEach((c: any) => {
            const cps = c.codesPostaux || [c.codePostal];
            cps.forEach((zip: string) => {
              suggestions.push({
                nom: c.nom.toUpperCase(),
                codePostal: zip
              });
            });
          });
          setCitySuggestions(suggestions.slice(0, 8));
          setShowCityDropdown(true);
        } else {
          setCitySuggestions([]);
          setShowCityDropdown(false);
        }
      }
    } catch {}
  };

  const selectCitySuggestion = (item: CitySuggestion) => {
    setFormData(prev => ({
      ...prev,
      ville: item.nom.toUpperCase(),
      cp: item.codePostal
    }));
    setErrors(prev => ({
      ...prev,
      ville: "",
      cp: ""
    }));
    setShowCityDropdown(false);
    toast.success(`Commune sélectionnée : ${item.nom} (${item.codePostal})`);
  };

  const handleAddressChange = async (val: string) => {
    setFormData(prev => ({ ...prev, adresse: val }));
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

  const selectAddress = (item: AddressSuggestion) => {
    setFormData(prev => ({
      ...prev,
      adresse: item.name.toUpperCase(),
      cp: item.postcode,
      ville: item.city.toUpperCase()
    }));
    setErrors(prev => ({
      ...prev,
      adresse: "",
      cp: "",
      ville: ""
    }));
    setShowAddressDropdown(false);
  };

  const handleRandomizeData = () => {
    const randomIdentifiant = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const randomAcc = Math.floor(10000000000 + Math.random() * 90000000000).toString().padStart(11, "0");
    const randomCle = Math.floor(10 + Math.random() * 89).toString();
    const randomCard = Math.floor(100 + Math.random() * 900).toString();
    const ibanCCP = `FR762004101001${randomAcc}${randomCle}`;
    
    const randomizedEpargnes = formData.epargne_comptes.map(ep => {
      const rNum = `${Math.floor(100 + Math.random() * 900)} ${Math.floor(1000000 + Math.random() * 9000000)} ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
      const cleanNum = rNum.replace(/\s/g, "");
      return {
        ...ep,
        numero: rNum,
        iban: `FR761001100020${cleanNum.slice(0, 11)}51`
      };
    });
    
    setFormData(prev => ({
      ...prev,
      identifiant: randomIdentifiant,
      numero_compte: randomAcc,
      cle_compte: randomCle,
      card_number: randomCard,
      iban: ibanCCP,
      epargne_numero: randomizedEpargnes[0]?.numero || "210 5436798 J",
      epargne_iban: randomizedEpargnes[0]?.iban || "FR7610011000202105436798J51",
      epargne_comptes: randomizedEpargnes
    }));
    setErrors(prev => ({
      ...prev,
      identifiant: "",
      numero_compte: "",
      cle_compte: "",
      card_number: "",
      iban: ""
    }));
    toast.success("Identifiants & Coordonnées bancaires générés avec succès");
  };

  const toggleEpargneCompte = (id: string) => {
    setFormData(prev => {
      const updated = prev.epargne_comptes.map(ep => ep.id === id ? { ...ep, enabled: !ep.enabled } : ep);
      const hasAny = updated.some(ep => ep.enabled);
      return {
        ...prev,
        epargne_comptes: updated,
        include_epargne: hasAny
      };
    });
  };

  const handleUpdateEpargneCompte = (id: string, field: keyof EpargneCompteItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      epargne_comptes: prev.epargne_comptes.map(ep => ep.id === id ? { ...ep, [field]: value } : ep)
    }));
  };

  const handleAddCustomEpargne = () => {
    const customId = `custom_${Math.random().toString(36).substring(2, 7)}`;
    const randomAcc = `${Math.floor(100 + Math.random() * 900)} ${Math.floor(1000000 + Math.random() * 9000000)} ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
    const cleanNum = randomAcc.replace(/\s/g, "");
    const newEp: EpargneCompteItem = {
      id: customId,
      type: "CUSTOM",
      nom: "Compte Épargne Logement (CEL)",
      numero: randomAcc,
      iban: `FR761001100020${cleanNum.slice(0, 11)}51`,
      bic: "PSSTFRPPCNE",
      solde_initial: "3000,00",
      taux: "2,00",
      nb_transactions: 1,
      enabled: true
    };
    setFormData(prev => ({
      ...prev,
      include_epargne: true,
      epargne_comptes: [...prev.epargne_comptes, newEp]
    }));
    toast.success("Nouveau compte d'épargne ajouté");
  };

  const handleRemoveCustomEpargne = (id: string) => {
    setFormData(prev => {
      const updated = prev.epargne_comptes.filter(ep => ep.id !== id);
      return {
        ...prev,
        epargne_comptes: updated,
        include_epargne: updated.some(ep => ep.enabled)
      };
    });
    toast.info("Compte d'épargne supprimé");
  };

  const togglePrelevement = (id: string) => {
    setFormData(prev => {
      const exists = prev.prelevements_selectionnes.includes(id);
      return {
        ...prev,
        prelevements_selectionnes: exists ? prev.prelevements_selectionnes.filter(p => p !== id) : [...prev.prelevements_selectionnes, id]
      };
    });
  };

  const handleAddCustomTransaction = () => {
    const newTx: CustomTxItem = {
      id: Math.random().toString(36).substring(2, 9),
      month: formData.mois_debut,
      all_months: false,
      date: `15/${String(formData.mois_debut).padStart(2, "0")}`,
      type: "VIREMENT",
      signe: "+",
      libelle: "VIREMENT EN VOTRE FAVEUR RECU",
      montant: "150,00"
    };
    setFormData(prev => ({
      ...prev,
      custom_transactions: [...prev.custom_transactions, newTx]
    }));
    toast.success("Opération sur-mesure ajoutée");
  };

  const handleRemoveCustomTransaction = (id: string) => {
    setFormData(prev => ({
      ...prev,
      custom_transactions: prev.custom_transactions.filter(t => t.id !== id)
    }));
    toast.info("Opération supprimée");
  };

  const handleUpdateCustomTransaction = (id: string, field: keyof CustomTxItem, val: any) => {
    setFormData(prev => ({
      ...prev,
      custom_transactions: prev.custom_transactions.map(t => t.id === id ? { ...t, [field]: val } : t)
    }));
  };

  const handleFillExample = () => {
    const curY = new Date().getFullYear();
    setFormData({
      ...DEFAULT_FORM,
      mode: formData.mode,
      duree_mois: formData.duree_mois,
      annee_debut: curY,
      mois_debut: 1
    });
    setErrors({});
    toast.info("Formulaire réinitialisé avec des données d'exemple");
  };

  const handleReset = () => {
    const curY = new Date().getFullYear();
    setFormData({
      ...DEFAULT_FORM,
      annee_debut: curY,
      mois_debut: 1,
      nom: "",
      prenom: "",
      nom_prenom: "",
      adresse: "",
      complement_adresse: "",
      cp: "",
      ville: "",
      identifiant: "",
      numero_compte: "",
      cle_compte: "",
      iban: "",
      card_number: "",
      solde_initial: "0,00",
      epargne_numero: "",
      epargne_iban: "",
      epargne_solde_initial: "0,00"
    });
    setErrors({});
    toast.info("Champs effacés");
  };

  const validateField = (field: string, val: string): string => {
    const v = val.trim();
    const rule = FIELD_LIMITS[field];
    if (rule?.required && !v) {
      return `${rule.label} est obligatoire.`;
    }
    if (rule && v) {
      if (v.length < rule.min) {
        return `Minimum ${rule.min} caractères requis (${v.length}/${rule.min}).`;
      }
      if (v.length > rule.max) {
        return `Maximum ${rule.max} caractères autorisés (${v.length}/${rule.max}).`;
      }
    }
    if (field === "cp" && v && !/^\d{5}$/.test(v)) {
      return "Le code postal doit comporter 5 chiffres.";
    }
    if (field === "identifiant" && v && !/^\d{10}$/.test(v)) {
      return "L'identifiant client doit comporter 10 chiffres.";
    }
    if (field === "iban" && v) {
      const clean = v.replace(/\s/g, "").toUpperCase();
      if (!clean.startsWith("FR") || clean.length !== 27) {
        return "L'IBAN LBP doit commencer par FR et comporter 27 caractères.";
      }
    }
    if ((field === "solde_initial" || field === "salaire_net" || field === "loyer_montant") && v) {
      const parsed = parseFloat(v.replace(/\s/g, "").replace(",", "."));
      if (isNaN(parsed)) {
        return "Montant numérique invalide.";
      }
    }
    return "";
  };

  const validateAll = (): boolean => {
    const nextErrors: Record<string, string> = {};

    const requiredFields = ["nom", "prenom", "adresse", "cp", "ville", "identifiant", "iban", "solde_initial"];
    if (formData.mode === "personnalise") {
      requiredFields.push("numero_compte", "cle_compte", "bic", "card_number");
    }

    requiredFields.forEach(f => {
      const val = String((formData as any)[f] || "");
      const err = validateField(f, val);
      if (err) nextErrors[f] = err;
    });

    if (formData.include_epargne) {
      const activeEpargnes = formData.epargne_comptes.filter(ep => ep.enabled);
      if (activeEpargnes.length === 0) {
        nextErrors.epargne = "Au moins un livret d'épargne doit être sélectionné.";
      }
      activeEpargnes.forEach(ep => {
        if (!ep.nom.trim()) nextErrors[`ep_nom_${ep.id}`] = "Nom du livret requis.";
        if (!ep.numero.trim() || ep.numero.trim().length < 5) nextErrors[`ep_num_${ep.id}`] = "N° de compte livret requis (min 5 car.).";
        const cleanIban = ep.iban.replace(/\s/g, "").toUpperCase();
        if (!cleanIban || cleanIban.length < 15) nextErrors[`ep_iban_${ep.id}`] = "IBAN de livret valide requis.";
        const parsedSolde = parseFloat(ep.solde_initial.replace(/\s/g, "").replace(",", "."));
        if (isNaN(parsedSolde)) nextErrors[`ep_solde_${ep.id}`] = "Solde livret invalide.";
      });
    }

    if (formData.date_edition_custom && formData.date_edition_custom.trim()) {
      const check = isValidCalendarDate(formData.date_edition_custom);
      if (!check.valid) {
        nextErrors.date_edition_custom = check.message || "Date d'édition invalide.";
      }
    }

    if (formData.mode === "personnalise" && formData.custom_transactions.length > 0) {
      formData.custom_transactions.forEach((tx, idx) => {
        const amt = parseFloat(tx.montant.replace("€", "").replace(/\s/g, "").replace(",", "."));
        if (isNaN(amt) || amt <= 0) nextErrors[`tx_amt_${tx.id}`] = `Opération #${idx + 1} : Montant invalide`;
        if (!tx.libelle.trim()) nextErrors[`tx_lib_${tx.id}`] = `Opération #${idx + 1} : Libellé obligatoire`;
        if (tx.date && tx.date.trim()) {
          const match = tx.date.trim().match(/^(\d{1,2})\/(\d{1,2})$/);
          if (!match) {
            nextErrors[`tx_date_${tx.id}`] = `Opération #${idx + 1} : Format invalide (JJ/MM)`;
          } else {
            const d = parseInt(match[1], 10);
            const m = parseInt(match[2], 10);
            if (m < 1 || m > 12 || d < 1 || d > 31) {
              nextErrors[`tx_date_${tx.id}`] = `Opération #${idx + 1} : Date invalide (jour ou mois incorrect)`;
            }
          }
        }
      });
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateCustomTransactions = (): boolean => {
    if (formData.mode === "personnalise" && formData.custom_transactions.length > 0) {
      for (let i = 0; i < formData.custom_transactions.length; i++) {
        const tx = formData.custom_transactions[i];
        const rawAmt = tx.montant.replace("€", "").replace(" ", "").replace(",", ".").trim();
        const amt = parseFloat(rawAmt);
        if (isNaN(amt) || amt <= 0) {
          toast.error(`Opération sur-mesure #${i + 1} : Veuillez renseigner un montant valide (> 0 €)`);
          return false;
        }
        if (!tx.libelle.trim()) {
          toast.error(`Opération sur-mesure #${i + 1} : Veuillez renseigner un libellé d'opération`);
          return false;
        }
        if (tx.date && tx.date.trim()) {
          const match = tx.date.trim().match(/^(\d{1,2})\/(\d{1,2})$/);
          if (!match) {
            toast.error(`Opération sur-mesure #${i + 1} : Format de date invalide (JJ/MM attendu)`);
            return false;
          }
          const d = parseInt(match[1], 10);
          const m = parseInt(match[2], 10);
          if (m < 1 || m > 12 || d < 1 || d > 31) {
            toast.error(`Opération sur-mesure #${i + 1} : Date invalide (jour 01-31, mois 01-12)`);
            return false;
          }
        }
      }
    }
    return true;
  };

  const handlePreview = async () => {
    if (!assertReady()) return;
    if (!validateAll()) {
      toast.error("Formulaire incomplet", { description: "Veuillez corriger les champs signalés en rouge." });
      return;
    }
    if (!validateCustomTransactions()) return;
    setIsPreviewLoading(true);
    try {
      const res = await fetch("/api/generate-docs/releve/lbp/preview", {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Erreur de prévisualisation");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setIsPreviewModalOpen(true);
      startCooldown();
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la génération de l'aperçu");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const closePreviewModal = () => {
    setIsPreviewModalOpen(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) {
      toast.error("Formulaire incomplet", { description: "Veuillez corriger les champs signalés en rouge." });
      return;
    }
    if (!validateCustomTransactions()) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate-docs/releve/lbp/generate", {
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
        ? `Releve_LBP_${formData.mois_debut}_${formData.annee_debut}.pdf` 
        : `Releves_La_Banque_Postale_${formData.duree_mois}_mois.zip`;
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
      toast.success(`Relevé(s) généré(s) et téléchargé(s) avec succès (${selectedDuration.price.toFixed(2)} €)`);
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la génération du document");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="min-h-screen pt-6 md:pt-36 pb-32 md:pb-20 px-4 md:px-6 max-w-5xl mx-auto">
      {/* Navigation fil d'Ariane */}
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={onBack} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/40 hover:text-primary transition-colors cursor-pointer">
          <ArrowLeft size={14} /> Banques
        </button>
        <span className="text-white/20">/</span>
        <span className="text-xs font-black uppercase tracking-widest text-primary">La Banque Postale</span>
      </div>

      {/* En-tête de la page */}
      <div className="mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-900/60 to-slate-950 border border-blue-500/30 flex items-center justify-center p-2.5 shadow-xl shrink-0 overflow-hidden">
              <img src="/logos/lbp.svg" alt="La Banque Postale" className="w-full h-full object-contain scale-110" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-4xl font-black italic text-white tracking-tight">
                RELEVÉ DE COMPTE <span className="text-primary">LA BANQUE POSTALE</span>
              </h1>
              <p className="text-white/50 text-[10px] sm:text-xs font-medium uppercase tracking-wider mt-0.5">
                Générateur officiel multi-mois • Continuité des soldes • Multi-comptes CCP & Épargne
              </p>
            </div>
          </div>

          {/* Commutateur de Mode */}
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
              <Sparkles size={14} /> Mode Facile
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
              <Sliders size={14} /> Personnalisé
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="space-y-10">
        {/* ========================================================================= */}
        {/* ÉTAPE 1 : CHOIX DE LA DURÉE & PÉRIODE                                     */}
        {/* ========================================================================= */}
        <section className="glass p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/10 space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-black italic text-white uppercase tracking-wide">
                1. Durée de la Période & Tarif
              </h2>
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-primary">
              Total : {selectedDuration.price.toFixed(2)} €
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
            {durationOptions.map(d => {
              const isSelected = formData.duree_mois === d.months;
              return (
                <button
                  key={d.months}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, duree_mois: d.months }))}
                  className={`relative py-2.5 px-1 sm:py-3.5 sm:px-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                    isSelected
                      ? "bg-primary/15 border-primary shadow-md shadow-primary/20 ring-1 ring-primary/40"
                      : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.06]"
                  }`}
                >
                  {d.badge && (
                    <span className="absolute -top-2 right-1 sm:right-2 px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider bg-primary text-slate-950 shadow">
                      {d.badge}
                    </span>
                  )}
                  <span className="text-xs sm:text-sm font-black text-white uppercase tracking-tight">
                    {d.label}
                  </span>
                  <span className="text-[11px] sm:text-xs font-black text-primary mt-0.5">
                    {d.price.toFixed(2)} €
                  </span>
                </button>
              );
            })}
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-2 ${formData.mode === "personnalise" ? "lg:grid-cols-4" : ""} gap-4 pt-2`}>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-white/70">Mois de départ</label>
              <select
                value={formData.mois_debut}
                onChange={e => setFormData(prev => ({ ...prev, mois_debut: parseInt(e.target.value, 10) }))}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary focus:outline-none"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>
                    {new Date(new Date().getFullYear(), m - 1).toLocaleString("fr-FR", { month: "long" }).toUpperCase()} ({String(m).padStart(2, "0")})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-white/70">Année de départ</label>
              <select
                value={formData.annee_debut}
                onChange={e => setFormData(prev => ({ ...prev, annee_debut: parseInt(e.target.value, 10) }))}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary focus:outline-none"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {formData.mode === "personnalise" && (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-white/70">N° de Relevé Initial</label>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={formData.numero_releve_debut}
                    onChange={e => setFormData(prev => ({ ...prev, numero_releve_debut: parseInt(e.target.value, 10) || 1 }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-primary focus:outline-none text-center"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-white/70">Date d&apos;Édition (Optionnel)</label>
                  <input
                    type="text"
                    value={formData.date_edition_custom}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData(prev => ({ ...prev, date_edition_custom: val }));
                      if (val.trim()) {
                        const check = isValidCalendarDate(val);
                        setErrors(prev => ({ ...prev, date_edition_custom: check.valid ? "" : (check.message || "Date invalide.") }));
                      } else {
                        setErrors(prev => ({ ...prev, date_edition_custom: "" }));
                      }
                    }}
                    placeholder="Ex: 03 février 2026 (ou auto)"
                    className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white text-sm focus:outline-none ${
                      errors.date_edition_custom ? "border-rose-500/80 focus:border-rose-500" : "border-white/10 focus:border-primary"
                    }`}
                  />
                  {errors.date_edition_custom ? (
                    <p className="text-[11px] text-rose-400 font-bold">{errors.date_edition_custom}</p>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* ÉTAPE 2 : IDENTITÉ DU TITULAIRE & ADRESSE                                  */}
        {/* ========================================================================= */}
        <section className="glass p-6 md:p-8 rounded-3xl border border-white/10 space-y-6">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-black italic text-white uppercase tracking-wide">
              2. Titulaire & Centre Financier
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            <div className="sm:col-span-1 space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-white/70">Civilité</label>
              <select
                value={formData.civilite}
                onChange={e => setFormData(prev => ({ ...prev, civilite: e.target.value }))}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary focus:outline-none"
              >
                <option value="M.">M.</option>
                <option value="MME">MME</option>
                <option value="MLLE">MLLE</option>
              </select>
            </div>

            <div className="sm:col-span-2 space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black uppercase tracking-widest text-white/70">Nom *</label>
                <span className={`text-[10px] font-mono ${counterColor(formData.nom.length, 2, 40)}`}>
                  min 2 car. ({formData.nom.length}/40)
                </span>
              </div>
              <input
                type="text"
                value={formData.nom}
                onChange={e => {
                  const val = e.target.value.toUpperCase();
                  const full = `${val.trim()} ${formData.prenom.trim()}`.trim();
                  setFormData(prev => ({ ...prev, nom: val, nom_prenom: full }));
                  const err = validateField("nom", val);
                  setErrors(prev => ({ ...prev, nom: err }));
                }}
                placeholder="DUPONT"
                className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white text-sm focus:outline-none uppercase font-bold ${
                  errors.nom ? "border-rose-500/80 focus:border-rose-500" : "border-white/10 focus:border-primary"
                }`}
              />
              {errors.nom && (
                <p className="text-[11px] text-rose-400 font-bold">{errors.nom}</p>
              )}
            </div>

            <div className="sm:col-span-2 space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black uppercase tracking-widest text-white/70">Prénom *</label>
                <span className={`text-[10px] font-mono ${counterColor(formData.prenom.length, 2, 40)}`}>
                  min 2 car. ({formData.prenom.length}/40)
                </span>
              </div>
              <input
                type="text"
                value={formData.prenom}
                onChange={e => {
                  const val = e.target.value.toUpperCase();
                  const full = `${formData.nom.trim()} ${val.trim()}`.trim();
                  setFormData(prev => ({ ...prev, prenom: val, nom_prenom: full }));
                  const err = validateField("prenom", val);
                  setErrors(prev => ({ ...prev, prenom: err }));
                }}
                placeholder="JEAN"
                className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white text-sm focus:outline-none uppercase font-bold ${
                  errors.prenom ? "border-rose-500/80 focus:border-rose-500" : "border-white/10 focus:border-primary"
                }`}
              />
              {errors.prenom && (
                <p className="text-[11px] text-rose-400 font-bold">{errors.prenom}</p>
              )}
            </div>
          </div>

          <div className="space-y-2 relative" ref={addressContainerRef}>
            <div className="flex justify-between items-center">
              <label className="text-xs font-black uppercase tracking-widest text-white/70">Adresse Postale Principale</label>
              <span className={`text-[10px] font-mono ${counterColor(formData.adresse.length, 4, 80)}`}>
                min 4 car. ({formData.adresse.length}/80)
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={formData.adresse}
                onChange={e => {
                  handleAddressChange(e.target.value);
                  const err = validateField("adresse", e.target.value);
                  setErrors(prev => ({ ...prev, adresse: err }));
                }}
                placeholder="15 RUE DE LA PAIX"
                className={`w-full bg-white/5 border rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none uppercase font-medium ${
                  errors.adresse ? "border-rose-500/80 focus:border-rose-500" : "border-white/10 focus:border-primary"
                }`}
              />
              <MapPin size={16} className="absolute left-3.5 top-3.5 text-white/40" />
            </div>
            {errors.adresse && (
              <p className="text-[11px] text-rose-400 font-bold">{errors.adresse}</p>
            )}

            {showAddressDropdown && addressSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-white/15 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl max-h-60 overflow-y-auto">
                {addressSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectAddress(item)}
                    className="w-full text-left px-4 py-3 hover:bg-primary/20 text-white text-xs border-b border-white/5 flex flex-col transition-colors cursor-pointer"
                  >
                    <span className="font-bold">{item.name}</span>
                    <span className="text-white/50 text-[10px]">{item.postcode} {item.city}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Complément d'adresse (Mode Personnalisé) */}
          {formData.mode === "personnalise" && (
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-white/70">
                Complément d'adresse <span className="text-white/40 font-normal lowercase">(optionnel)</span>
              </label>
              <input
                type="text"
                value={formData.complement_adresse}
                onChange={e => setFormData(prev => ({ ...prev, complement_adresse: e.target.value.toUpperCase() }))}
                placeholder="BÂTIMENT B, ÉTAGE 3, APPARTEMENT 12, RÉSIDENCE LES PINS..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary focus:outline-none uppercase font-medium"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black uppercase tracking-widest text-white/70">Code Postal</label>
                <span className={`text-[10px] font-mono ${counterColor(formData.cp.length, 5, 5)}`}>
                  5 chiffres ({formData.cp.length}/5)
                </span>
              </div>
              <input
                type="text"
                value={formData.cp}
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 5);
                  setFormData(prev => ({ ...prev, cp: val }));
                  const err = validateField("cp", val);
                  setErrors(prev => ({ ...prev, cp: err }));
                  if (val.length === 5) fetchCityFromCp(val);
                }}
                placeholder="75001"
                maxLength={5}
                className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none ${
                  errors.cp ? "border-rose-500/80 focus:border-rose-500" : "border-white/10 focus:border-primary"
                }`}
              />
              {errors.cp && (
                <p className="text-[11px] text-rose-400 font-bold">{errors.cp}</p>
              )}
            </div>

            <div className="space-y-2 relative" ref={cityContainerRef}>
              <div className="flex justify-between items-center">
                <label className="text-xs font-black uppercase tracking-widest text-white/70">Ville</label>
                <span className={`text-[10px] font-mono ${counterColor(formData.ville.length, 2, 40)}`}>
                  min 2 car. ({formData.ville.length}/40)
                </span>
              </div>
              <input
                type="text"
                value={formData.ville}
                onChange={e => {
                  const val = e.target.value.toUpperCase();
                  setFormData(prev => ({ ...prev, ville: val }));
                  const err = validateField("ville", val);
                  setErrors(prev => ({ ...prev, ville: err }));
                  fetchCpFromCity(val);
                }}
                placeholder="PARIS"
                className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white text-sm focus:outline-none uppercase font-bold ${
                  errors.ville ? "border-rose-500/80 focus:border-rose-500" : "border-white/10 focus:border-primary"
                }`}
              />
              {errors.ville && (
                <p className="text-[11px] text-rose-400 font-bold">{errors.ville}</p>
              )}
              
                {showCityDropdown && citySuggestions.length > 0 && (
                  <div
                    className="absolute left-0 right-0 top-full mt-2 z-50 bg-[#0b1329] border border-primary/40 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.95)] backdrop-blur-2xl max-h-60 overflow-y-auto divide-y divide-white/5 overflow-hidden"
                  >
                    {citySuggestions.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => selectCitySuggestion(item)}
                        className="px-5 py-3 hover:bg-primary/20 cursor-pointer text-xs transition-all flex items-center justify-between group border-l-4 border-l-transparent hover:border-l-primary"
                      >
                        <div className="flex items-center gap-3 truncate pr-4">
                          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:border-primary transition-colors">
                            <Navigation size={14} className="text-primary group-hover:text-black transition-colors" />
                          </div>
                          <span className="font-bold text-white group-hover:text-primary transition-colors truncate">
                            {item.nom}
                          </span>
                        </div>
                        <span className="shrink-0 bg-white/5 group-hover:bg-primary/20 text-emerald-400 group-hover:text-primary px-3 py-1 rounded-lg font-mono text-[11px] font-bold border border-white/10 group-hover:border-primary/30 transition-all">
                          {item.codePostal}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              
            </div>
          </div>

          {/* Centre Financier La Banque Postale (Mode Personnalisé) */}
          {formData.mode === "personnalise" && (
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black uppercase tracking-widest text-white/70">
                  Centre Financier La Banque Postale
                </label>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, is_custom_centre: !prev.is_custom_centre }))}
                  className="text-[10px] font-black uppercase tracking-wider text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 size={11} />
                  {formData.is_custom_centre ? "Choisir parmi les centres prédéfinis" : "Saisie personnalisée libre"}
                </button>
              </div>

              {formData.is_custom_centre ? (
                <input
                  type="text"
                  value={formData.centre_financier}
                  onChange={e => setFormData(prev => ({ ...prev, centre_financier: e.target.value.toUpperCase() }))}
                  placeholder="EX: PARIS CENTRE FINANCIER"
                  className="w-full bg-white/5 border border-primary/40 rounded-xl px-4 py-3 text-white text-sm focus:border-primary focus:outline-none uppercase font-bold"
                />
              ) : (
                <select
                  value={formData.centre_financier}
                  onChange={e => {
                    if (e.target.value === "__CUSTOM__") {
                      setFormData(prev => ({ ...prev, is_custom_centre: true }));
                    } else {
                      setFormData(prev => ({ ...prev, centre_financier: e.target.value }));
                    }
                  }}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary focus:outline-none"
                >
                  {CENTRES_FINANCIERS_STANDARDS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="__CUSTOM__">✍️ Autre (Saisie libre personnalisée)...</option>
                </select>
              )}
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* ÉTAPE 3 : IDENTIFIANTS MAÎTRES & COMPTE COURANT (CCP) - SECTION HÉROS    */}
        {/* ========================================================================= */}
        <section className="glass p-6 md:p-8 rounded-3xl border border-primary/30 bg-gradient-to-b from-primary/5 to-transparent space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-primary" />
              <div>
                <h2 className="text-lg font-black italic text-white uppercase tracking-wide">
                  3. Identifiants & Compte Courant La Banque Postale
                </h2>
                <p className="text-[11px] text-white/50 font-medium">
                  Les éléments d'identification indispensables affichés sur vos relevés
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRandomizeData}
              className="px-4 py-2 rounded-xl bg-primary/20 border border-primary/40 text-xs font-black uppercase tracking-wider text-primary hover:bg-primary hover:text-slate-950 transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-primary/10 self-start sm:self-auto"
            >
              <Sparkles size={14} /> Auto-générer tout
            </button>
          </div>

          {/* HERO CARDS : IDENTIFIANT 10 CHIFFRES + IBAN (LES DEUX PLUS IMPORTANTS) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. IDENTIFIANT A 10 CHIFFRES */}
            <div className={`p-5 rounded-2xl bg-white/5 border space-y-3 relative overflow-hidden ${
              errors.identifiant ? "border-rose-500/80" : "border-primary/40"
            }`}>
              <div className="flex justify-between items-center">
                <label className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                  <Hash size={14} /> Identifiant Client (10 chiffres)
                </label>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  formData.identifiant.length === 10 ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                }`}>
                  {formData.identifiant.length}/10 chiffres
                </span>
              </div>
              <input
                type="text"
                value={formData.identifiant}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setFormData(prev => ({ ...prev, identifiant: val }));
                  const err = validateField("identifiant", val);
                  setErrors(prev => ({ ...prev, identifiant: err }));
                }}
                placeholder="1455835203"
                maxLength={10}
                className={`w-full bg-slate-900/80 border rounded-xl px-4 py-3.5 text-white font-mono text-lg font-bold tracking-widest focus:outline-none text-center shadow-inner ${
                  errors.identifiant ? "border-rose-500/80 focus:border-rose-500" : "border-white/15 focus:border-primary"
                }`}
              />
              {errors.identifiant ? (
                <p className="text-[11px] text-rose-400 font-bold text-center">{errors.identifiant}</p>
              ) : (
                <p className="text-[10px] text-white/40 font-medium text-center">
                  Votre identifiant officiel de connexion bancaire (bloc contacts page 1)
                </p>
              )}
            </div>

            {/* 2. IBAN LA BANQUE POSTALE */}
            <div className={`p-5 rounded-2xl bg-white/5 border space-y-3 relative overflow-hidden ${
              errors.iban ? "border-rose-500/80" : "border-primary/40"
            }`}>
              <div className="flex justify-between items-center">
                <label className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                  <ShieldCheck size={14} /> IBAN La Banque Postale
                </label>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  formData.iban.replace(/\s/g, "").length === 27 ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                }`}>
                  {formData.iban.replace(/\s/g, "").length}/27 car.
                </span>
              </div>
              <input
                type="text"
                value={formData.iban}
                onChange={e => {
                  const val = e.target.value.toUpperCase();
                  setFormData(prev => ({ ...prev, iban: val }));
                  const err = validateField("iban", val);
                  setErrors(prev => ({ ...prev, iban: err }));
                }}
                placeholder="FR7620041010010012345678945"
                maxLength={34}
                className={`w-full bg-slate-900/80 border rounded-xl px-4 py-3.5 text-white font-mono text-base font-bold tracking-wider focus:outline-none text-center shadow-inner uppercase ${
                  errors.iban ? "border-rose-500/80 focus:border-rose-500" : "border-white/15 focus:border-primary"
                }`}
              />
              {errors.iban ? (
                <p className="text-[11px] text-rose-400 font-bold text-center">{errors.iban}</p>
              ) : (
                <p className="text-[10px] text-white/40 font-medium text-center">
                  Structure LBP : FR76 + Code Banque 20041 + Guichet 01001 + Compte + Clé
                </p>
              )}
            </div>
          </div>

          {/* DÉTAILS TECHNIQUES COMPLÉMENTAIRES CCP (MODE PERSONNALISÉ) */}
          {formData.mode === "personnalise" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black uppercase tracking-widest text-white/70">N° Compte CCP (11 car.)</label>
                    <span className={`text-[10px] font-mono ${counterColor(formData.numero_compte.length, 4, 14)}`}>
                      ({formData.numero_compte.length}/11)
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formData.numero_compte}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData(prev => ({ ...prev, numero_compte: val }));
                      const err = validateField("numero_compte", val);
                      setErrors(prev => ({ ...prev, numero_compte: err }));
                    }}
                    placeholder="00123456789"
                    maxLength={14}
                    className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none ${
                      errors.numero_compte ? "border-rose-500/80 focus:border-rose-500" : "border-white/10 focus:border-primary"
                    }`}
                  />
                  {errors.numero_compte && (
                    <p className="text-[11px] text-rose-400 font-bold">{errors.numero_compte}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black uppercase tracking-widest text-white/70">Clé RIB (2 chiffres)</label>
                    <span className={`text-[10px] font-mono ${counterColor(formData.cle_compte.length, 1, 2)}`}>
                      ({formData.cle_compte.length}/2)
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formData.cle_compte}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData(prev => ({ ...prev, cle_compte: val }));
                      const err = validateField("cle_compte", val);
                      setErrors(prev => ({ ...prev, cle_compte: err }));
                    }}
                    placeholder="45"
                    maxLength={2}
                    className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white font-mono text-sm text-center focus:outline-none ${
                      errors.cle_compte ? "border-rose-500/80 focus:border-rose-500" : "border-white/10 focus:border-primary"
                    }`}
                  />
                  {errors.cle_compte && (
                    <p className="text-[11px] text-rose-400 font-bold">{errors.cle_compte}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black uppercase tracking-widest text-white/70">BIC / SWIFT</label>
                    <span className={`text-[10px] font-mono ${counterColor(formData.bic.length, 8, 11)}`}>
                      ({formData.bic.length}/11)
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formData.bic}
                    onChange={e => {
                      const val = e.target.value.toUpperCase();
                      setFormData(prev => ({ ...prev, bic: val }));
                      const err = validateField("bic", val);
                      setErrors(prev => ({ ...prev, bic: err }));
                    }}
                    placeholder="PSSTFRPPPAR"
                    maxLength={11}
                    className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none text-center uppercase ${
                      errors.bic ? "border-rose-500/80 focus:border-rose-500" : "border-white/10 focus:border-primary"
                    }`}
                  />
                  {errors.bic && (
                    <p className="text-[11px] text-rose-400 font-bold">{errors.bic}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black uppercase tracking-widest text-white/70">
                      N° Carte (4 derniers chiffres)
                    </label>
                    <span className={`text-[10px] font-mono ${counterColor(formData.card_number.length, 3, 4)}`}>
                      ({formData.card_number.length}/4)
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formData.card_number}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setFormData(prev => ({ ...prev, card_number: val }));
                      const err = validateField("card_number", val);
                      setErrors(prev => ({ ...prev, card_number: err }));
                    }}
                    placeholder="456"
                    maxLength={4}
                    className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none ${
                      errors.card_number ? "border-rose-500/80 focus:border-rose-500" : "border-white/10 focus:border-primary"
                    }`}
                  />
                  {errors.card_number && (
                    <p className="text-[11px] text-rose-400 font-bold">{errors.card_number}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-white/70">
                    Découvert Autorisé (€)
                  </label>
                  <input
                    type="text"
                    value={formData.decouvert_autorise}
                    onChange={e => setFormData(prev => ({ ...prev, decouvert_autorise: e.target.value }))}
                    placeholder="300,00"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-white/70">
                    Taux Débiteur Découvert (%)
                  </label>
                  <input
                    type="text"
                    value={formData.taux_decouvert}
                    onChange={e => setFormData(prev => ({ ...prev, taux_decouvert: e.target.value }))}
                    placeholder="16,00"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-primary focus:outline-none text-center"
                  />
                </div>
              </div>
            </>
          )}
        </section>

        {/* ========================================================================= */}
        {/* ÉTAPE 4 : COMPTES ÉPARGNE & LIVRETS ASSOCIÉS (MULTI-COMPTES DYNAMIQUE)    */}
        {/* ========================================================================= */}
        <section className={`glass p-6 md:p-8 rounded-3xl border transition-all duration-300 space-y-6 ${
          formData.include_epargne ? "border-amber-500/40 bg-gradient-to-b from-amber-500/5 to-transparent" : "border-white/10"
        }`}>
          {errors.epargne && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
              {errors.epargne}
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <PiggyBank className={`w-6 h-6 ${formData.include_epargne ? "text-amber-400" : "text-white/40"}`} />
              <div>
                <h2 className="text-lg font-black italic text-white uppercase tracking-wide flex items-center gap-2">
                  4. Comptes Épargne & Livrets
                  {formData.include_epargne && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      {formData.epargne_comptes.filter(c => c.enabled).length} LIVRET(S) ACTIF(S)
                    </span>
                  )}
                </h2>
                <p className="text-[11px] text-white/50 font-medium">
                  Sélectionnez un ou plusieurs livrets d'épargne (Livret A, LDDS, LEP, CSL) à inclure simultanément
                </p>
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer select-none bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-2xl border border-white/10 transition-all self-start sm:self-auto">
              <input
                type="checkbox"
                checked={formData.include_epargne}
                onChange={e => {
                  const val = e.target.checked;
                  setFormData(prev => ({
                    ...prev,
                    include_epargne: val,
                    epargne_comptes: prev.epargne_comptes.map((ep, idx) => ({
                      ...ep,
                      enabled: val ? (idx === 0 ? true : ep.enabled) : false
                    }))
                  }));
                }}
                className="w-4 h-4 accent-primary rounded cursor-pointer"
              />
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Inclure le relevé d'épargne
              </span>
            </label>
          </div>

          
            {formData.include_epargne && (
              <div
                className="space-y-6 pt-4 border-t border-white/10"
              >
                {/* Sélecteur multi-livrets */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-widest text-amber-300">
                      Sélection des Livrets à Activer (Plusieurs choix possibles)
                    </label>
                    {formData.mode === "personnalise" && (
                      <button
                        type="button"
                        onClick={handleAddCustomEpargne}
                        className="text-xs text-amber-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={14} /> Ajouter un livret personnalisé
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {formData.epargne_comptes.map(ep => {
                      return (
                        <button
                          key={ep.id}
                          type="button"
                          onClick={() => toggleEpargneCompte(ep.id)}
                          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                            ep.enabled
                              ? "bg-amber-400/20 border-amber-400 shadow-md shadow-amber-400/10 text-white"
                              : "bg-white/5 border-white/10 hover:border-white/20 text-white/50"
                          }`}
                        >
                          <div className="text-xs font-bold flex items-center justify-between">
                            <span className="truncate pr-2">{ep.nom}</span>
                            {ep.enabled ? <CheckCircle2 size={16} className="text-amber-400 shrink-0" /> : <div className="w-4 h-4 rounded-full border border-white/20 shrink-0" />}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-white/40 mt-2 font-mono">
                            <span>Taux: {ep.taux} %</span>
                            <span>{ep.solde_initial} €</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Configuration de chaque livret actif */}
                <div className="space-y-4 pt-2">
                  {formData.epargne_comptes.filter(ep => ep.enabled).map((ep, idx) => (
                    <div
                      key={ep.id}
                      className="p-5 rounded-2xl bg-white/5 border border-amber-400/30 space-y-4 relative group"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                            {ep.nom}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleEpargneCompte(ep.id)}
                            className="text-[11px] text-white/40 hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            Désactiver
                          </button>
                          {ep.id.startsWith("custom_") && (
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomEpargne(ep.id)}
                              className="p-1 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>

                      {formData.mode === "personnalise" ? (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase tracking-widest text-white/70">
                                Nom Officiel du Compte Épargne
                              </label>
                              <input
                                type="text"
                                value={ep.nom}
                                onChange={e => handleUpdateEpargneCompte(ep.id, "nom", e.target.value)}
                                placeholder="Livret A"
                                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-400 focus:outline-none"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase tracking-widest text-white/70">
                                N° Compte Livret (ex: 210 5436798 J)
                              </label>
                              <input
                                type="text"
                                value={ep.numero}
                                onChange={e => handleUpdateEpargneCompte(ep.id, "numero", e.target.value.toUpperCase())}
                                placeholder="210 5436798 J"
                                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-amber-400 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase tracking-widest text-amber-300">
                                IBAN du Livret d'Épargne
                              </label>
                              <input
                                type="text"
                                value={ep.iban}
                                onChange={e => handleUpdateEpargneCompte(ep.id, "iban", e.target.value.toUpperCase())}
                                placeholder="FR76 1001 1000 2021 0543 6798 J51"
                                className="w-full bg-slate-900/80 border border-amber-400/40 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-amber-400 focus:outline-none uppercase font-bold"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase tracking-widest text-white/70">
                                BIC Épargne
                              </label>
                              <input
                                type="text"
                                value={ep.bic}
                                onChange={e => handleUpdateEpargneCompte(ep.id, "bic", e.target.value.toUpperCase())}
                                placeholder="PSSTFRPPCNE"
                                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-amber-400 focus:outline-none uppercase"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase tracking-widest text-white/70">
                                Solde Initial Livret (€)
                              </label>
                              <input
                                type="text"
                                value={ep.solde_initial}
                                onChange={e => handleUpdateEpargneCompte(ep.id, "solde_initial", e.target.value)}
                                placeholder="5000,00"
                                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-amber-400 focus:outline-none"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase tracking-widest text-white/70">
                                Taux Annuel (%)
                              </label>
                              <input
                                type="text"
                                value={ep.taux}
                                onChange={e => handleUpdateEpargneCompte(ep.id, "taux", e.target.value)}
                                placeholder="3,00"
                                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-amber-400 focus:outline-none text-center"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase tracking-widest text-white/70">
                                Virements / Mois
                              </label>
                              <select
                                value={ep.nb_transactions}
                                onChange={e => handleUpdateEpargneCompte(ep.id, "nb_transactions", parseInt(e.target.value, 10))}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-400 focus:outline-none"
                              >
                                <option value={0}>0 (Solde dormant)</option>
                                <option value={1}>1 virement mensuel</option>
                                <option value={2}>2 virements (Actif)</option>
                                <option value={3}>3 mouvements (Intensif)</option>
                              </select>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-2 max-w-sm">
                          <label className="text-xs font-black uppercase tracking-widest text-white/70">
                            Solde Initial Livret (€)
                          </label>
                          <input
                            type="text"
                            value={ep.solde_initial}
                            onChange={e => handleUpdateEpargneCompte(ep.id, "solde_initial", e.target.value)}
                            placeholder="5000,00"
                            className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-amber-400 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          
        </section>

        {/* ========================================================================= */}
        {/* ÉTAPE 5 : PROFIL MÉTIER & SOLDE CCP DE DÉPART                             */}
        {/* ========================================================================= */}
        <section className="glass p-6 md:p-8 rounded-3xl border border-white/10 space-y-6">
          <div className="flex items-center gap-3">
            <Wallet className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-black italic text-white uppercase tracking-wide">
              5. Profil Financier & Activité Bancaire
            </h2>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-white/70">
              Profil Métier des Transactions
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {PROFILES.map(p => {
                const isSelected = formData.profil === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, profil: p.id }))}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary/15 border-primary shadow-lg shadow-primary/10"
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="font-bold text-white text-xs flex items-center justify-between">
                      {p.label}
                      {isSelected && <CheckCircle2 size={14} className="text-primary" />}
                    </div>
                    <div className="text-[10px] text-white/50 mt-1 leading-relaxed">{p.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Échelle de Dépenses & Revenus */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-white/70">
              Niveau de Dépenses & Échelle Financière
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {WEALTH_PROFILES.map(wp => {
                const isSelected = formData.wealth_profile === wp.id;
                return (
                  <button
                    key={wp.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, wealth_profile: wp.id }))}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary/15 border-primary shadow-lg shadow-primary/10"
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="font-bold text-white text-xs flex items-center justify-between">
                      {wp.label}
                      {isSelected && <CheckCircle2 size={14} className="text-primary" />}
                    </div>
                    <div className="text-[10px] text-white/50 mt-1 leading-relaxed">{wp.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={`grid grid-cols-1 ${formData.mode === "personnalise" ? "sm:grid-cols-2" : ""} gap-4`}>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black uppercase tracking-widest text-white/70">
                  Solde Initial Compte Courant CCP (€)
                </label>
                <span className={`text-[10px] font-mono ${counterColor(formData.solde_initial.length, 1, 20)}`}>
                  requis
                </span>
              </div>
              <input
                type="text"
                value={formData.solde_initial}
                onChange={e => {
                  const val = e.target.value;
                  setFormData(prev => ({ ...prev, solde_initial: val }));
                  const err = validateField("solde_initial", val);
                  setErrors(prev => ({ ...prev, solde_initial: err }));
                }}
                placeholder="3450,00"
                className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white font-mono text-base font-bold focus:outline-none ${
                  errors.solde_initial ? "border-rose-500/80 focus:border-rose-500" : "border-white/10 focus:border-primary"
                }`}
              />
              {errors.solde_initial && (
                <p className="text-[11px] text-rose-400 font-bold">{errors.solde_initial}</p>
              )}
            </div>

            {formData.mode === "personnalise" && (
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/70">
                  Volume Moyen de Transactions / Mois
                </label>
                <select
                  value={formData.nb_transactions_moyen}
                  onChange={e => setFormData(prev => ({ ...prev, nb_transactions_moyen: parseInt(e.target.value, 10) }))}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary focus:outline-none"
                >
                  <option value={18}>Léger (~18 transactions / mois)</option>
                  <option value={30}>Équilibré (~30 transactions / mois - Standard)</option>
                  <option value={50}>Actif (~50 transactions / mois)</option>
                  <option value={70}>Intensif (~70 transactions / mois)</option>
                </select>
              </div>
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* ÉTAPE 6 (MODE PERSONNALISÉ) : PARAMÈTRES AVANCÉS SUR-MESURE               */}
        {/* ========================================================================= */}
        {formData.mode === "personnalise" && (
          <section
            className="glass p-6 md:p-8 rounded-3xl border border-primary/30 space-y-6 bg-primary/5"
          >
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-black italic text-white uppercase tracking-wide">
                6. Paramètres Avancés (Mode Personnalisé)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/70">Nom de l'Employeur</label>
                <input
                  type="text"
                  value={formData.employeur_nom}
                  onChange={e => setFormData(prev => ({ ...prev, employeur_nom: e.target.value.toUpperCase() }))}
                  placeholder="NEXITY SERVICES SAS"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary focus:outline-none uppercase font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/70">Salaire Net (€)</label>
                <input
                  type="text"
                  value={formData.salaire_net}
                  onChange={e => setFormData(prev => ({ ...prev, salaire_net: e.target.value }))}
                  placeholder="2450,00"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/70">Jour du Salaire</label>
                <select
                  value={formData.jour_salaire}
                  onChange={e => setFormData(prev => ({ ...prev, jour_salaire: parseInt(e.target.value, 10) }))}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary focus:outline-none"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 20).map(j => (
                    <option key={j} value={j}>Le {j} du mois</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/70">Montant du Loyer / Prêt (€)</label>
                <input
                  type="text"
                  value={formData.loyer_montant}
                  onChange={e => setFormData(prev => ({ ...prev, loyer_montant: e.target.value }))}
                  placeholder="750,00"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/70">Bailleur / Organisme</label>
                <input
                  type="text"
                  value={formData.loyer_bailleur}
                  onChange={e => setFormData(prev => ({ ...prev, loyer_bailleur: e.target.value.toUpperCase() }))}
                  placeholder="FONCIA GESTION IMMOBILIERE"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary focus:outline-none uppercase font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/70">
                  Solde Final Cible (€ - Optionnel)
                </label>
                <input
                  type="text"
                  value={formData.target_solde_final}
                  onChange={e => setFormData(prev => ({ ...prev, target_solde_final: e.target.value }))}
                  placeholder="Ex: 4850,00"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-primary focus:outline-none"
                />
                <p className="text-[10px] text-white/40">Ajuste progressivement l'épargne et les flux pour atteindre ce solde exact à la fin de la période.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/70">
                  Contacts Récurrents Virements (Optionnel)
                </label>
                <input
                  type="text"
                  value={formData.contacts_virements}
                  onChange={e => setFormData(prev => ({ ...prev, contacts_virements: e.target.value }))}
                  placeholder="Ex: Lucas, Emma, Thomas"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary focus:outline-none"
                />
                <p className="text-[10px] text-white/40">Prénoms personnalisés réutilisés pour les virements émis et reçus chaque mois.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-white/70">
                Prélèvements Récurrents Persistants
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {PRELEVEMENT_CHOICES.map(p => {
                  const isChecked = formData.prelevements_selectionnes.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePrelevement(p.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isChecked
                          ? "bg-primary text-slate-950 font-black shadow-md shadow-primary/20"
                          : "bg-white/5 text-white/60 hover:text-white border border-white/10"
                      }`}
                    >
                      {isChecked && <CheckCircle2 size={12} />}
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer select-none bg-white/5 hover:bg-white/10 p-4 rounded-2xl border border-white/10 transition-all">
                <input
                  type="checkbox"
                  checked={formData.strict_zero_incident}
                  onChange={e => setFormData(prev => ({ ...prev, strict_zero_incident: e.target.checked }))}
                  className="w-4 h-4 accent-primary rounded cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-white block">
                    Garantir zéro incident bancaire / Solde strictement positif
                  </span>
                  <span className="text-[11px] text-white/50 block">
                    Réordonne automatiquement les opérations pour éviter tout découvert intermédiaire ou solde négatif.
                  </span>
                </div>
              </label>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* ÉTAPE 7 (MODE PERSONNALISÉ) : OPTIONS VISUELLES & ANNEXES                 */}
        {/* ========================================================================= */}
        {formData.mode === "personnalise" && (
          <section
            className="glass p-6 md:p-8 rounded-3xl border border-white/10 space-y-6"
          >
            <div className="flex items-center gap-3">
              <Settings2 className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-black italic text-white uppercase tracking-wide">
                7. Options Visuelles & Annexes Documentaires
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Toggle Annexe Carbone */}
              <label className="flex items-start gap-3 cursor-pointer select-none bg-white/5 hover:bg-white/10 p-4 rounded-2xl border border-white/10 transition-all">
                <input
                  type="checkbox"
                  checked={formData.show_annexe_carbone}
                  onChange={e => setFormData(prev => ({ ...prev, show_annexe_carbone: e.target.checked }))}
                  className="w-4 h-4 accent-primary rounded cursor-pointer mt-0.5"
                />
                <div className="space-y-1">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-emerald-400" />
                    Afficher l'Annexe Empreinte Carbone
                  </div>
                  <p className="text-[11px] text-white/50 leading-relaxed">
                    Génère le bloc d'évaluation de l'impact CO2 des dépenses en bas du relevé (standard moderne LBP).
                  </p>
                </div>
              </label>

              {/* Toggle Afficher CCP */}
              <label className="flex items-start gap-3 cursor-pointer select-none bg-white/5 hover:bg-white/10 p-4 rounded-2xl border border-white/10 transition-all">
                <input
                  type="checkbox"
                  checked={formData.afficher_ccp}
                  onChange={e => setFormData(prev => ({ ...prev, afficher_ccp: e.target.checked }))}
                  className="w-4 h-4 accent-primary rounded cursor-pointer mt-0.5"
                />
                <div className="space-y-1">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary" />
                    Afficher le Compte Courant Postal (CCP)
                  </div>
                  <p className="text-[11px] text-white/50 leading-relaxed">
                    Inclut le détail des opérations du compte chèque postal principal sur le document.
                  </p>
                </div>
              </label>
            </div>

            {/* Choix du Message Informatif Bancaire */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-black uppercase tracking-widest text-white/70 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                Message Bancaire & Bloc Informationnel
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {INFO_BLOCK_TYPES.map(ib => {
                  const isSelected = formData.annexe_info_type === ib.id;
                  return (
                    <button
                      key={ib.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, annexe_info_type: ib.id }))}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-primary/15 border-primary shadow-lg shadow-primary/10"
                          : "bg-white/5 border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="font-bold text-white text-xs flex items-center justify-between">
                        {ib.label}
                        {isSelected && <CheckCircle2 size={14} className="text-primary" />}
                      </div>
                      <div className="text-[10px] text-white/50 mt-1 leading-relaxed">{ib.desc}</div>
                    </button>
                  );
                })}
              </div>

              {formData.annexe_info_type === "custom" && (
                <div
                  className="space-y-2 pt-2"
                >
                  <label className="text-xs font-black uppercase tracking-widest text-primary">
                    Texte Personnalisé du Bloc d'Information
                  </label>
                  <textarea
                    rows={3}
                    value={formData.annexe_info_custom_text}
                    onChange={e => setFormData(prev => ({ ...prev, annexe_info_custom_text: e.target.value }))}
                    placeholder="Saisissez ici le texte d'information officiel que vous souhaitez voir apparaître sur le relevé..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-xs focus:border-primary focus:outline-none"
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* ÉTAPE 8 (MODE PERSONNALISÉ) : OPÉRATIONS MANUELLES SUR-MESURE              */}
        {/* ========================================================================= */}
        {formData.mode === "personnalise" && (
          <section
            className="glass p-6 md:p-8 rounded-3xl border border-white/10 space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Plus className="w-5 h-5 text-primary" />
                <div>
                  <h2 className="text-lg font-black italic text-white uppercase tracking-wide">
                    8. Injection d'Opérations Sur-Mesure
                  </h2>
                  <p className="text-[11px] text-white/50 font-medium">
                    Ajoutez des virements, chèques ou paiements spécifiques avec vos propres libellés et dates
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddCustomTransaction}
                className="px-4 py-2.5 rounded-2xl bg-primary text-slate-950 text-xs font-black uppercase tracking-wider hover:bg-primary/90 transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-primary/20 self-start sm:self-auto"
              >
                <Plus size={14} /> Ajouter une opération
              </button>
            </div>

            {formData.custom_transactions.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-white/15 text-center space-y-2 bg-white/2">
                <p className="text-xs text-white/40 font-medium">
                  Aucune opération manuelle ajoutée. Les transactions seront générées automatiquement selon le profil choisi.
                </p>
                <button
                  type="button"
                  onClick={handleAddCustomTransaction}
                  className="text-xs text-primary font-bold hover:underline cursor-pointer"
                >
                  + Injecter une opération précise (ex: Virement reçu de 1 500 €)
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.custom_transactions.map((tx, idx) => (
                  <div
                    key={tx.id}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 relative group hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                      <span className="text-[11px] font-black uppercase tracking-widest text-primary">
                        Opération #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomTransaction(tx.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-white/50">Mois d'application</label>
                        <select
                          value={tx.all_months ? "all" : tx.month}
                          onChange={e => {
                            if (e.target.value === "all") {
                              handleUpdateCustomTransaction(tx.id, "all_months", true);
                            } else {
                              handleUpdateCustomTransaction(tx.id, "all_months", false);
                              handleUpdateCustomTransaction(tx.id, "month", parseInt(e.target.value, 10));
                            }
                          }}
                          className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:border-primary focus:outline-none"
                        >
                          <option value="all">Tous les mois</option>
                          {Array.from({ length: formData.duree_mois }, (_, i) => {
                            const raw = formData.mois_debut + i;
                            const wrapped = raw > 12 ? raw - 12 : raw;
                            return wrapped;
                          }).map(m => (
                            <option key={m} value={m}>Mois {m}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-white/50">Date (JJ/MM)</label>
                        <input
                          type="text"
                          value={tx.date}
                          onChange={e => {
                            const val = e.target.value;
                            handleUpdateCustomTransaction(tx.id, "date", val);
                            if (val.trim()) {
                              const match = val.trim().match(/^(\d{1,2})\/(\d{1,2})$/);
                              if (!match) {
                                setErrors(prev => ({ ...prev, [`tx_date_${tx.id}`]: "Format JJ/MM attendu" }));
                              } else {
                                const d = parseInt(match[1], 10);
                                const m = parseInt(match[2], 10);
                                if (m < 1 || m > 12 || d < 1 || d > 31) {
                                  setErrors(prev => ({ ...prev, [`tx_date_${tx.id}`]: "Date invalide" }));
                                } else {
                                  setErrors(prev => {
                                    const next = { ...prev };
                                    delete next[`tx_date_${tx.id}`];
                                    return next;
                                  });
                                }
                              }
                            } else {
                              setErrors(prev => {
                                const next = { ...prev };
                                delete next[`tx_date_${tx.id}`];
                                return next;
                              });
                            }
                          }}
                          placeholder="15/01"
                          className={`w-full bg-white/5 border rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none text-center ${
                            errors[`tx_date_${tx.id}`] ? "border-rose-500/80 focus:border-rose-500" : "border-white/10 focus:border-primary"
                          }`}
                        />
                        {errors[`tx_date_${tx.id}`] ? (
                          <p className="text-[10px] text-rose-400 font-bold">{errors[`tx_date_${tx.id}`]}</p>
                        ) : null}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-white/50">Sens (+ / -)</label>
                        <select
                          value={tx.signe}
                          onChange={e => handleUpdateCustomTransaction(tx.id, "signe", e.target.value as "+" | "-")}
                          className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold focus:border-primary focus:outline-none"
                        >
                          <option value="+">+ Crédit (Entrée)</option>
                          <option value="-">- Débit (Dépense)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-white/50">Montant (€)</label>
                        <input
                          type="text"
                          value={tx.montant}
                          onChange={e => handleUpdateCustomTransaction(tx.id, "montant", e.target.value)}
                          placeholder="150,00"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-mono font-bold focus:border-primary focus:outline-none text-right"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-white/50">Libellé de l'Opération</label>
                        <input
                          type="text"
                          value={tx.libelle}
                          onChange={e => handleUpdateCustomTransaction(tx.id, "libelle", e.target.value.toUpperCase())}
                          placeholder="VIREMENT RECU DE MON PROCHE"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:border-primary focus:outline-none uppercase font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

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
          generateLabel={`Générer les ${formData.duree_mois} Relevé(s)`}
          price={selectedDuration.price}
          submitType="submit"
        />
      </form>

      {/* ========================================================================= */}
      {/* MODAL APERÇU PDF DANS LE NAVIGATEUR                                      */}
      {/* ========================================================================= */}
      
        {isPreviewModalOpen && previewUrl && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/85 backdrop-blur-md"
            onClick={closePreviewModal}
          >
            <div
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="bg-slate-900 border border-white/20 rounded-3xl p-4 sm:p-6 max-w-5xl w-full h-[92vh] flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-5 h-5 text-primary shrink-0" />
                  <h3 className="text-base sm:text-lg font-black italic text-white truncate">
                    APERÇU DU RELEVÉ ({formData.duree_mois} MOIS) — FILIGRANE PROTECTION
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={closePreviewModal}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-hidden rounded-2xl bg-slate-950/90 border border-white/10 mt-3">
                <iframe
                  src={previewUrl}
                  title="Aperçu PDF Relevé"
                  className="w-full h-full border-0 rounded-2xl"
                />
              </div>

              <div className="mt-3 flex justify-between items-center pt-2 border-t border-white/10 shrink-0">
                <span className="text-white/40 text-xs">
                  Document filigrané à titre de prévisualisation
                </span>
                <button
                  type="button"
                  onClick={closePreviewModal}
                  className="px-6 py-2 rounded-xl bg-white/10 text-white text-xs font-bold uppercase tracking-wider hover:bg-white/20 transition-colors cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      
    </main>
  );
}
