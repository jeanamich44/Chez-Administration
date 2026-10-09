"use client";

import { useState, useEffect, useRef, FormEvent, useMemo } from "react";

import { ArrowLeft, Download, RefreshCw, Sparkles, Eye, User, Shield, Car, LayoutTemplate, ChevronDown, ChevronUp } from "lucide-react";

import { toast } from "sonner";
import DocumentPreviewViewer from "@/components/generate_docs/_shared/DocumentPreviewViewer";
import DocumentActionButtons from "@/components/generate_docs/_shared/DocumentActionButtons";
import CustomDatePicker, { isValidCalendarDate } from "@/components/generate_docs/_shared/CustomDatePicker";
import ImmatriculationInput from "@/components/generate_docs/_shared/ImmatriculationInput";
import { fetchGenerateDocsConfig, usePreviewCooldown } from "@/components/generate_docs/_shared/usePreviewCooldown";
import { getCachedFormSchema, setCachedFormSchema } from "@/components/generate_docs/_shared/formSchemaCache";
import { getAuthHeaders } from "@/components/generate_docs/_shared/telegramAuth";

interface AddressSuggestion {
  label: string;
  name: string;
  postcode: string;
  city: string;
}

interface FormFieldRule {
  required?: boolean;
  min?: number;
  max?: number;
  transform?: string;
}

interface DynamicFormField {
  key: string;
  label: string;
  kind?: "text" | "select" | "date" | "textarea";
  span?: 1 | 2;
  placeholder?: string;
  dateFormat?: "french" | "slash";
  options?: { value: string; label: string }[];
  autocompleteType?: "address" | "city" | "none";
  rules?: FormFieldRule;
  min?: number;
  max?: number;
  required?: boolean;
}

interface DynamicFormSection {
  id: string;
  title: string;
  order?: number;
  fields: DynamicFormField[];
}

interface CustomBlock {
  id: string;
  label: string;
  master?: boolean;
  section: string;
}

interface CustomSection {
  id: string;
  label: string;
}

interface CustomLayout {
  sections: CustomSection[];
  blocks: CustomBlock[];
  visible?: Record<string, boolean>;
}

interface DynamicSchema {
  metadata?: {
    subtitle?: string;
    logo?: string;
    headerBg?: string;
    apiBase?: string;
    priceKey?: string;
    filenameTemplate?: string;
  };
  defaults?: Record<string, string>;
  sections: DynamicFormSection[];
  customLayout?: CustomLayout;
}

// ----------------

function getDynamicAssuranceDateDefaults(defaults: Record<string, string>): Record<string, string> {
  const res = { ...defaults };
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear());
  res.date_delivrance = `${day}/${month}/${year}`;

  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yDay = String(yesterday.getDate()).padStart(2, "0");
  const yMonth = String(yesterday.getMonth() + 1).padStart(2, "0");
  const yYear = String(yesterday.getFullYear());
  res.date_effet = `${yDay}/${yMonth}/${yYear}`;
  res.date_effet_jour = yDay;
  res.date_effet_mois = yMonth;
  res.date_effet_annee = yYear;
  return res;
}

function counterColor(len: number, min?: number, max?: number) {
  if (min && len < min) return "text-amber-400";
  if (max && len > max) return "text-rose-400";
  return "text-emerald-400";
}

function getFieldSpanClass(sectionId: string, fieldKey: string, span?: number): string {
  if (sectionId === "references") {
    if (fieldKey === "courtier") return "md:col-span-12";
    return "md:col-span-4";
  }
  if (sectionId === "assure") {
    if (fieldKey === "civilite") return "md:col-span-3";
    if (fieldKey === "nom") return "md:col-span-4";
    if (fieldKey === "prenom") return "md:col-span-5";
    if (fieldKey === "adresse") return "md:col-span-12";
    if (fieldKey === "cp") return "md:col-span-3";
    if (fieldKey === "ville") return "md:col-span-5";
    if (fieldKey === "pays") return "md:col-span-4";
  }
  if (sectionId === "vehicule_dates") {
    if (fieldKey === "immatriculation") return "md:col-span-5";
    if (fieldKey === "vehicule_marque_modele") return "md:col-span-7";
    if (fieldKey === "date_delivrance") return "md:col-span-6";
    if (fieldKey === "date_effet") return "md:col-span-6";
  }
  return span === 2 ? "md:col-span-12" : "md:col-span-6";
}

function Switch({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className="flex items-center justify-between gap-3 w-full text-left cursor-pointer"
    >
      <span className="text-xs font-bold text-white/80 uppercase tracking-wide">{label}</span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-primary" : "bg-white/15"}`}>
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-5" : "left-0.5"}`}
        />
      </span>
    </button>
  );
}

// ----------------

export default function MaxanceAssuranceClient({ onBack }: { onBack: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [mode, setMode] = useState<"normal" | "custom">("normal");
  const [schema, setSchema] = useState<DynamicSchema | null>(() => {
    return (getCachedFormSchema("assurance", "maxance")?.schema as DynamicSchema) || null;
  });
  const [isLoadingSchema, setIsLoadingSchema] = useState(
    () => !getCachedFormSchema("assurance", "maxance")
  );
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const cached = getCachedFormSchema("assurance", "maxance");
    if (cached?.schema?.defaults) return getDynamicAssuranceDateDefaults(cached.schema.defaults);
    return {};
  });
  const [customCivilite, setCustomCivilite] = useState<string>("");
  const [isCustomCivilite, setIsCustomCivilite] = useState<boolean>(false);
  const [customVisible, setCustomVisible] = useState<Record<string, boolean>>(() => {
    const cached = getCachedFormSchema("assurance", "maxance");
    return (cached?.schema as DynamicSchema)?.customLayout?.visible || {
      header: true,
      header_logo: true,
      header_identity: true,
      header_banner: true,
      middle: true,
      footer: true
    };
  });
  const [openCustomSections, setOpenCustomSections] = useState<Record<string, boolean>>({
    header: true,
    middle: true,
    footer: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [assurancePrice, setAssurancePrice] = useState(1);
  const { cooldown, isBlocked, allowed, assertReady, startCooldown, formatTimer } = usePreviewCooldown("assurance");

  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const addressContainerRef = useRef<HTMLDivElement>(null);

  const sections = schema?.sections || [];
  const activeFields = useMemo(() => {
    return sections.flatMap(sec => sec.fields || []);
  }, [sections]);

  const customLayout = schema?.customLayout;

  useEffect(() => {
    let isMounted = true;
    async function loadDynamicForm() {
      const cached = getCachedFormSchema("assurance", "maxance");
      if (cached) {
        setSchema(cached.schema as DynamicSchema);
        setFormData(getDynamicAssuranceDateDefaults(cached.schema.defaults || {}));
        if ((cached.schema as DynamicSchema).customLayout?.visible) {
          setCustomVisible((cached.schema as DynamicSchema).customLayout!.visible!);
        }
        setIsLoadingSchema(false);
      } else {
        setIsLoadingSchema(true);
      }

      try {
        const res = await fetch("/api/generate-docs/forms/assurance/maxance");
        if (!res.ok) throw new Error("Erreur de chargement du formulaire");
        const data = await res.json();
        if (!isMounted) return;

        if (cached && data.version && cached.version === data.version) {
          return;
        }

        let sch = data?.schema;
        while (typeof sch === "string") {
          try { sch = JSON.parse(sch); } catch { break; }
        }

        if (sch && typeof sch === "object") {
          setCachedFormSchema("assurance", "maxance", {
            schema: sch,
            version: data.version || 1,
            title: data.title,
            id: data.id
          });
          const dynamicDefaults = getDynamicAssuranceDateDefaults(sch.defaults || {});
          setSchema(sch);
          setFormData(dynamicDefaults);
          if (sch.customLayout?.visible) {
            setCustomVisible(sch.customLayout.visible);
          }
        }
      } catch (err: any) {
        if (!cached) {
          toast.error("Impossible de charger le formulaire d'assurance depuis la base de données");
        }
      } finally {
        if (isMounted) setIsLoadingSchema(false);
      }
    }
    loadDynamicForm();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const closePreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
  };

  useEffect(() => {
    fetchGenerateDocsConfig().then(data => {
      const value = Number(data?.prices?.maxance);
      if (Number.isFinite(value)) setAssurancePrice(value);
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (addressContainerRef.current && !addressContainerRef.current.contains(e.target as Node)) {
        setShowAddressDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchAddressSuggestions = async (query: string) => {
    if (query.trim().length < 3) {
      setAddressSuggestions([]);
      setShowAddressDropdown(false);
      return;
    }

    try {
      const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`);
      if (!res.ok) return;
      const data = await res.json();
      const suggestions: AddressSuggestion[] = (data.features || []).map((feature: any) => ({
        label: feature.properties.label,
        name: feature.properties.name,
        postcode: feature.properties.postcode,
        city: feature.properties.city
      }));
      setAddressSuggestions(suggestions);
      setShowAddressDropdown(suggestions.length > 0);
    } catch {
      setAddressSuggestions([]);
      setShowAddressDropdown(false);
    }
  };

  const selectAddressSuggestion = (sug: AddressSuggestion) => {
    setFormData((prev) => ({
      ...prev,
      adresse: sug.name.toUpperCase(),
      cp: sug.postcode,
      ville: sug.city.toUpperCase(),
      cp_ville: `${sug.postcode} ${sug.city}`.toUpperCase()
    }));
    setShowAddressDropdown(false);
    setAddressSuggestions([]);
    setErrors(prev => ({ ...prev, adresse: "", cp: "", ville: "", cp_ville: "" }));
  };

  const validateField = (spec: DynamicFormField, val: string) => {
    if (spec.key === "civilite") {
      if (isCustomCivilite && !customCivilite.trim()) {
        return "Veuillez saisir une civilité personnalisée";
      }
      const rules = spec.rules || {};
      const max = rules.max ?? spec.max;
      const s = isCustomCivilite ? customCivilite.trim() : String(val || "").trim();
      if (s && max && s.length > max) return `Maximum ${max} caractères autorisés`;
      return "";
    }
    const rules = spec.rules || {};
    const min = rules.min ?? spec.min;
    const max = rules.max ?? spec.max;
    const required = rules.required ?? spec.required;
    const s = String(val || "").trim();
    if (required && !s) return "Ce champ est obligatoire";
    if (spec.key === "immatriculation") {
      if (s) {
        const isValid =
          /^([A-Z]{2}-[0-9]{3}-[A-Z]{2}|[0-9]{1,4}-[A-Z]{1,3}-(?:[0-9]{1,3}|2[AB])|[A-Z0-9]{1,4}-[A-Z0-9]{1,4}-[A-Z0-9]{1,4})$/.test(s) &&
          s.length >= 7 &&
          s.length <= 12;
        if (!isValid) {
          return "Format d'immatriculation invalide (ex: AA-120-AA ou 123-ABC-45)";
        }
      }
      return "";
    }
    if (spec.kind === "date" || spec.key.includes("date")) {
      if (s) {
        const check = isValidCalendarDate(s);
        if (!check.valid) {
          return check.message || "Date invalide (format JJ/MM/AAAA attendu)";
        }
      }
      return "";
    }
    if (min && s.length < min) return `Minimum ${min} caractères requis`;
    if (max && s.length > max) return `Maximum ${max} caractères autorisés`;
    return "";
  };

  const validateAll = () => {
    const newErrors: Record<string, string> = {};
    activeFields.forEach(field => {
      const err = validateField(field, formData[field.key] || "");
      if (err) newErrors[field.key] = err;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (key: string, value: string) => {
    let finalValue = value;
    const field = activeFields.find(f => f.key === key);
    const transform = field?.rules?.transform;
    if (transform === "uppercase") {
      finalValue = value.toUpperCase();
    } else if (transform === "lowercase") {
      finalValue = value.toLowerCase();
    }

    setFormData(prev => {
      const next = { ...prev, [key]: finalValue };
      if (key === "date_effet") {
        const parts = finalValue.trim().split(/[/.\s-]/);
        if (parts.length === 3) {
          next.date_effet_jour = parts[0].padStart(2, "0");
          next.date_effet_mois = parts[1].padStart(2, "0");
          next.date_effet_annee = parts[2];
        }
      }
      return next;
    });

    if (field?.autocompleteType === "address") {
      fetchAddressSuggestions(finalValue);
    }

    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: "" }));
    }
  };

  const handleFillExample = () => {
    if (schema?.defaults) {
      setFormData(getDynamicAssuranceDateDefaults(schema.defaults));
    }
    if (schema?.customLayout?.visible) {
      setCustomVisible(schema.customLayout.visible);
    }
    setIsCustomCivilite(false);
    setCustomCivilite("");
    setErrors({});
    toast.success("Exemple Maxance appliqué !");
  };

  const handleReset = () => {
    const empty: Record<string, string> = {};
    activeFields.forEach(field => {
      empty[field.key] = "";
    });
    setFormData(empty);
    setIsCustomCivilite(false);
    setCustomCivilite("");
    if (schema?.customLayout?.visible) {
      setCustomVisible(schema.customLayout.visible);
    } else {
      setCustomVisible({
        header: true,
        header_logo: true,
        header_identity: true,
        header_banner: true,
        middle: true,
        footer: true
      });
    }
    setErrors({});
    toast.info("Formulaire réinitialisé");
  };

  const getPayload = () => {
    const civVal = isCustomCivilite ? customCivilite.trim() : (formData.civilite ?? "");
    const civ = civVal && civVal !== "__NONE__" && civVal !== "__CUSTOM__" ? `${civVal} ` : "";
    const fullTitulaire = formData.nom && formData.prenom
      ? `${civ}${formData.nom} ${formData.prenom}`.trim().toUpperCase()
      : (formData.titulaire || "");
    const fullCpVille = (formData.cp || formData.ville)
      ? `${formData.cp || ""} ${formData.ville || ""}`.trim().toUpperCase()
      : (formData.cp_ville || "");
    return {
      ...formData,
      ...customVisible,
      civilite: civVal === "__NONE__" || civVal === "__CUSTOM__" ? "" : civVal,
      visible: customVisible,
      titulaire: fullTitulaire,
      cp_ville: fullCpVille,
      date_effet: formData.date_effet || `${formData.date_effet_jour || ""}/${formData.date_effet_mois || ""}/${formData.date_effet_annee || ""}`.replace(/^\/+|\/+$/g, ""),
      vehicule_marque_modele: formData.vehicule_marque_modele || formData.vehicule || ""
    };
  };

  const handlePreview = async () => {
    if (!assertReady()) return;
    if (!validateAll()) {
      toast.error("Formulaire incomplet", { description: "Veuillez corriger les erreurs indiquées." });
      return;
    }

    setIsPreviewLoading(true);
    try {
      const res = await fetch("/api/generate-docs/assurance/maxance/preview", {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(getPayload())
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || "Erreur de prévisualisation");
      }

      const blob = await res.blob();
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
      const objectUrl = URL.createObjectURL(blob);
      previewUrlRef.current = objectUrl;
      setPreviewUrl(objectUrl);
      startCooldown();
      toast.success("Aperçu généré !");
    } catch (err: any) {
      toast.error(err.message || "Impossible de générer l'Aperçu");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!validateAll()) {
      toast.error("Formulaire incomplet", { description: "Veuillez corriger les erreurs indiquées." });
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate-docs/assurance/maxance/generate", {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(getPayload())
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || "Erreur de génération du PDF");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const immatClean = (formData.immatriculation || "vehicule").replace(/[^A-Za-z0-9]/g, "_");
      a.download = `Memo_Vehicule_Assure_Maxance_${immatClean}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Mémo Véhicule Assuré Maxance généré et téléchargé !");
    } catch (err: any) {
      toast.error(err.message || "Impossible de générer le document");
    } finally {
      setIsGenerating(false);
    }
  };

  const getSectionIcon = (id: string) => {
    if (id === "references") return <Shield className="text-primary" size={20} />;
    if (id === "assure") return <User className="text-primary" size={20} />;
    return <Car className="text-primary" size={20} />;
  };

  if (!mounted || isLoadingSchema) {
    return (
      <main className="min-h-screen pt-6 md:pt-36 pb-32 md:pb-20 px-4 md:px-6 max-w-5xl mx-auto select-none">
        <div className="flex items-center gap-3 mb-4">
          <button type="button" onClick={onBack} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/40 hover:text-primary transition-colors">
            <ArrowLeft size={14} /> Retour aux Assurances
          </button>
        </div>
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <RefreshCw className="text-primary animate-spin w-8 h-8" />
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Chargement du formulaire...</p>
        </div>
      </main>
    );
  }

  const meta = schema?.metadata;
  const headerBg = meta?.headerBg || "bg-gradient-to-br from-red-950/50 to-slate-950/80 border-rose-500/30";
  const logo = meta?.logo || "/logos/maxance.svg";
  const subtitle = meta?.subtitle || "Document PDF Maxance Assurances Officiel";

  return (
    <main className="min-h-screen pt-6 md:pt-36 pb-32 md:pb-20 px-4 md:px-6 max-w-5xl mx-auto select-none">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <button type="button" onClick={onBack} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/40 hover:text-primary transition-colors">
            <ArrowLeft size={14} /> Retour aux Assurances
          </button>
        </div>
        <div className="flex items-center gap-4 mb-6">
          <div className={`px-5 py-3.5 ${headerBg} border rounded-2xl backdrop-blur-md flex items-center justify-center`}>
            <img src={logo} alt="Maxance" className="h-8 sm:h-10 w-auto" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-black italic text-white">GÉNÉRATEUR MÉMO VÉHICULE MAXANCE</h1>
            <p className="text-xs text-white/40 font-bold tracking-wider uppercase">{subtitle}</p>
          </div>
        </div>

        <div className="glass p-2 md:p-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("normal")}
              className={`rounded-xl px-4 py-3 text-left transition-all cursor-pointer ${
                mode === "normal"
                  ? "bg-primary text-black shadow-lg shadow-primary/20"
                  : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              <p className="text-xs font-black uppercase tracking-widest">Mode normal</p>
              <p className={`text-[11px] mt-1 ${mode === "normal" ? "text-black/70" : "text-white/40"}`}>
                Informations du titulaire, contrat, véhicule et dates.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setMode("custom")}
              className={`rounded-xl px-4 py-3 text-left transition-all cursor-pointer ${
                mode === "custom"
                  ? "bg-primary text-black shadow-lg shadow-primary/20"
                  : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              <p className="text-xs font-black uppercase tracking-widest">Mode personnalisé</p>
              <p className={`text-[11px] mt-1 ${mode === "custom" ? "text-black/70" : "text-white/40"}`}>
                Visibilité des blocs : en-tête, bandeau, corps et pied.
              </p>
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {sections.map(section => (
          <div key={section.id} className="glass p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              {getSectionIcon(section.id)}
              <h2 className="text-lg font-black italic text-white uppercase">{section.title}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {section.fields.map(field => {
                const val = formData[field.key] || "";
                const min = field.rules?.min ?? field.min;
                const max = field.rules?.max ?? field.max;
                const isAddress = field.autocompleteType === "address";
                const spanClass = getFieldSpanClass(section.id, field.key, field.span);

                if (field.key === "civilite") {
                  const rawOptions = (field.options || []).map(opt => ({ label: opt.label || opt.value, value: opt.value }));

                  const seenCiv = new Set<string>();
                  const allCivOptions = rawOptions.filter(opt => {
                    if (seenCiv.has(opt.value)) return false;
                    seenCiv.add(opt.value);
                    return true;
                  });
                  if (!seenCiv.has("__NONE__")) allCivOptions.push({ label: "Rien", value: "__NONE__" });
                  if (!seenCiv.has("__CUSTOM__")) allCivOptions.push({ label: "Personnalisé", value: "__CUSTOM__" });

                  const currentVal = formData[field.key] ?? "";
                  let selectedSelectVal = currentVal;
                  if (isCustomCivilite) {
                    selectedSelectVal = "__CUSTOM__";
                  } else if (currentVal === "" || currentVal === "__NONE__") {
                    selectedSelectVal = "__NONE__";
                  } else if (allCivOptions.some(o => o.value === currentVal && o.value !== "__CUSTOM__")) {
                    selectedSelectVal = currentVal;
                  } else {
                    selectedSelectVal = "__CUSTOM__";
                  }

                  return (
                    <div key={field.key} className={`space-y-2 ${spanClass}`}>
                      <label className="text-xs font-bold text-white/80 uppercase">{field.label}</label>
                      <select
                        value={selectedSelectVal}
                        onChange={e => {
                          const v = e.target.value;
                          if (v === "__NONE__") {
                            setIsCustomCivilite(false);
                            setFormData(prev => ({ ...prev, [field.key]: "" }));
                          } else if (v === "__CUSTOM__") {
                            setIsCustomCivilite(true);
                            setFormData(prev => ({ ...prev, [field.key]: customCivilite }));
                          } else {
                            setIsCustomCivilite(false);
                            setFormData(prev => ({ ...prev, [field.key]: v }));
                          }
                          if (errors[field.key]) {
                            setErrors(prev => ({ ...prev, [field.key]: "" }));
                          }
                        }}
                        className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors cursor-pointer"
                      >
                        {allCivOptions.map(opt => (
                          <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {(isCustomCivilite || selectedSelectVal === "__CUSTOM__") && (
                        <input
                          type="text"
                          value={customCivilite}
                          placeholder="Civilité personnalisée..."
                          onChange={e => {
                            const text = e.target.value.toUpperCase();
                            setCustomCivilite(text);
                            setFormData(prev => ({ ...prev, [field.key]: text }));
                            if (errors[field.key]) {
                              setErrors(prev => ({ ...prev, [field.key]: "" }));
                            }
                          }}
                          className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors mt-2"
                        />
                      )}
                      {errors[field.key] && <p className="text-xs text-rose-400 font-bold">{errors[field.key]}</p>}
                    </div>
                  );
                }

                if (field.kind === "select") {
                  return (
                    <div key={field.key} className={`space-y-2 ${spanClass}`}>
                      <label className="text-xs font-bold text-white/80 uppercase">{field.label}</label>
                      <select
                        value={val}
                        onChange={e => handleChange(field.key, e.target.value)}
                        className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors"
                      >
                        {(field.options || []).map(opt => (
                          <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {errors[field.key] && <p className="text-xs text-rose-400 font-bold">{errors[field.key]}</p>}
                    </div>
                  );
                }

                if (field.kind === "date") {
                  return (
                    <div key={field.key} className={`space-y-2 ${spanClass}`}>
                      <div className="flex justify-between items-center gap-2">
                        <label className="text-xs font-bold text-white/80 uppercase">{field.label}</label>
                        {max ? (
                          <span className={`text-[10px] font-mono ${counterColor(val.length, min, max)}`}>
                            {val.length < (min || 0) ? `min ${min} car. (${val.length}/${min})` : `${val.length}/${max}`}
                          </span>
                        ) : null}
                      </div>
                      <CustomDatePicker
                        value={val}
                        onChange={v => handleChange(field.key, v)}
                        hasError={Boolean(errors[field.key])}
                        placeholder={field.placeholder || "JJ/MM/AAAA"}
                        dateFormat={field.dateFormat || "slash"}
                      />
                      {errors[field.key] && <p className="text-xs text-rose-400 font-bold">{errors[field.key]}</p>}
                    </div>
                  );
                }

                if (field.key === "immatriculation") {
                  return (
                    <div key={field.key} className={`space-y-2 ${spanClass}`}>
                      <div className="flex justify-between items-center gap-2">
                        <label className="text-xs font-bold text-white/80 uppercase">{field.label}</label>
                      </div>
                      <ImmatriculationInput
                        value={val}
                        onChange={v => handleChange(field.key, v)}
                        hasError={Boolean(errors[field.key])}
                        placeholder={field.placeholder || "AH-120-PO"}
                      />
                      {errors[field.key] && <p className="text-xs text-rose-400 font-bold">{errors[field.key]}</p>}
                    </div>
                  );
                }

                return (
                  <div key={field.key} className={`space-y-2 ${spanClass} ${isAddress ? "relative" : ""}`} ref={isAddress ? addressContainerRef : undefined}>
                    <div className="flex justify-between items-center gap-2">
                      <label className="text-xs font-bold text-white/80 uppercase">{field.label}</label>
                      {max ? (
                        <span className={`text-[10px] font-mono ${counterColor(val.length, min, max)}`}>
                          {val.length < (min || 0) ? `min ${min} car. (${val.length}/${min})` : `${val.length}/${max}`}
                        </span>
                      ) : null}
                    </div>
                    <input
                      type="text"
                      value={val}
                      placeholder={field.placeholder || ""}
                      onChange={e => handleChange(field.key, e.target.value)}
                      className={`w-full bg-white/5 border ${errors[field.key] ? "border-rose-500/80 focus:border-rose-500" : "border-white/10 focus:border-primary"} rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors`}
                    />
                    {isAddress && showAddressDropdown && addressSuggestions.length > 0 && (
                      <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-slate-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                        {addressSuggestions.map((s, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => selectAddressSuggestion(s)}
                            className="w-full text-left px-4 py-2.5 text-xs text-white/80 hover:bg-primary/20 hover:text-white transition-colors border-b border-white/5 last:border-0 cursor-pointer"
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    )}
                    {errors[field.key] && <p className="text-xs text-rose-400 font-bold">{errors[field.key]}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {mode === "custom" && customLayout ? (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <LayoutTemplate className="text-primary" size={20} />
              <div>
                <h2 className="text-lg font-black italic text-white uppercase">Mise en page & Visibilité des blocs</h2>
                <p className="text-xs text-white/40">
                  Activez ou masquez les différentes sections et calques du gabarit Maxance.
                </p>
              </div>
            </div>

            {customLayout.sections.map(section => {
              const master = customLayout.blocks.find(b => b.section === section.id && b.master);
              const subBlocks = customLayout.blocks.filter(b => b.section === section.id && !b.master);
              const open = openCustomSections[section.id] !== false;
              const masterOn = master ? customVisible[master.id] !== false : true;

              return (
                <div key={section.id} className={`glass p-6 md:p-8 space-y-5 transition-opacity ${masterOn ? "" : "opacity-60"}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-4 border-b border-white/10">
                    <button
                      type="button"
                      onClick={() => setOpenCustomSections(prev => ({ ...prev, [section.id]: !open }))}
                      className="flex-1 flex items-center justify-between text-left cursor-pointer"
                    >
                      <div>
                        <h3 className="text-lg font-black italic text-white uppercase">{section.label}</h3>
                        <p className="text-[11px] text-white/40">
                          {master ? "1 bloc maître" : ""} {subBlocks.length > 0 ? `· ${subBlocks.length} éléments configurables` : ""}
                        </p>
                      </div>
                      <div className="text-white/40 pr-2">
                        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </button>
                    {master ? (
                      <div className="sm:w-56">
                        <Switch
                          on={customVisible[master.id] !== false}
                          onToggle={() =>
                            setCustomVisible(prev => ({ ...prev, [master.id]: prev[master.id] === false }))
                          }
                          label={customVisible[master.id] === false ? "Masqué" : "Affiché"}
                        />
                      </div>
                    ) : null}
                  </div>

                  {open && subBlocks.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {subBlocks.map(block => (
                        <div key={block.id} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                          <Switch
                            on={customVisible[block.id] !== false}
                            onToggle={() =>
                              setCustomVisible(prev => ({ ...prev, [block.id]: prev[block.id] === false }))
                            }
                            label={block.label}
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

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
          previewLabel="Aperçu Preview Gratuit"
          generateLabel="Générer le Mémo"
          price={assurancePrice}
          submitType="submit"
        />
      </form>

      {previewUrl ? (
        <DocumentPreviewViewer
          url={previewUrl}
          title="Aperçu - Attestation Maxance"
          onClose={closePreview}
          onAction={() => handleSubmit()}
          isActionLoading={isGenerating}
          actionLabel={`Générer le Mémo (${assurancePrice.toFixed(2)} €)`}
        />
      ) : null}
    </main>
  );
}
