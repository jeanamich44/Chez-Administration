"use client";

import React, { useState } from "react";
import { ArrowLeft, Eye, Download, Send, Sparkles, Loader2 } from "lucide-react";
import { DocSubItem } from "@/types";
import { useTelegram } from "./TelegramContext";
import { useToast } from "./NotificationToast";
import CustomModal from "./CustomModal";

// ----------------------------------------------------
interface DocumentFormProps {
  item: DocSubItem;
  onBack: () => void;
}

// ----------------------------------------------------
export default function DocumentForm({ item, onBack }: DocumentFormProps) {
  const { user, initData, hapticFeedback } = useTelegram();
  const { showToast } = useToast();

  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingBotSend, setLoadingBotSend] = useState(false);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successModalMessage, setSuccessModalMessage] = useState("");

  const [formData, setFormData] = useState<Record<string, any>>(() => {
    if (item.category === "rib") {
      return {
        titulaire: user ? `${user.first_name} ${user.last_name || ""}`.trim() : "JEAN DUPONT",
        adresse: "12 RUE DE LA PAIX",
        cp_ville: "75001 PARIS",
        iban: "FR76 1001 1001 1001 1001 1001 100",
        bic: "BNPAFR2PXXX",
        domiciliation: "PARIS OPERA",
        date_edition: new Date().toLocaleDateString("fr-FR")
      };
    }
    if (item.category === "emploi") {
      return {
        salarie_nom: user ? `${user.first_name} ${user.last_name || ""}`.trim() : "JEAN DUPONT",
        salarie_adresse: "15 AVENUE DES CHAMPS ELYSEES",
        salarie_cp_ville: "75008 PARIS",
        salarie_secu: "1850575123456 78",
        salarie_emploi: "CADRE TECHNIQUE",
        employeur_nom: "TECH SERVICES SAS",
        employeur_adresse: "20 BOULEVARD HAUSSMANN",
        employeur_cp_ville: "75009 PARIS",
        employeur_siret: "80123456700012",
        salaire_brut: "3500.00",
        duree_mois: 1
      };
    }
    if (item.category === "facture") {
      return {
        nom: user ? `${user.first_name} ${user.last_name || ""}`.trim() : "JEAN DUPONT",
        adresse: "12 RUE DES FLEURS",
        cp_ville: "75011 PARIS",
        pays: "FR",
        num_commande: "CMD-982341",
        num_facture: "FACT-2026-0042",
        nom_article: "COMMANDE EN LIGNE",
        qte: "1",
        pu_ttc: "149.00"
      };
    }
    return {
      nom: user ? `${user.first_name} ${user.last_name || ""}`.trim() : "JEAN DUPONT",
      adresse: "12 RUE DE PARIS",
      cp_ville: "75001 PARIS",
      date_effet: new Date().toLocaleDateString("fr-FR")
    };
  });

  const handleInputChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const executeApi = async (endpointType: "preview" | "generate", sendToBot: boolean = false) => {
    hapticFeedback("light");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-telegram-init-data": initData
    };

    if (sendToBot && user?.id) {
      headers["x-send-to-telegram"] = "true";
      headers["x-telegram-user-id"] = String(user.id);
    }

    const response = await fetch(`/api/generate-docs/${item.category}/${item.slug}/${endpointType}`, {
      method: "POST",
      headers,
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.detail || errJson.error || "Erreur de génération");
    }

    return response;
  };

  const handlePreview = async () => {
    try {
      setLoadingPreview(true);
      const res = await executeApi("preview");
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      setPreviewUrl(objectUrl);
      setIsPreviewOpen(true);
      hapticFeedback("success");
      showToast("Aperçu généré avec succès", "success");
    } catch (err: any) {
      hapticFeedback("error");
      showToast(err.message || "Impossible de générer l'aperçu", "error");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDownload = async () => {
    try {
      setLoadingGenerate(true);
      const res = await executeApi("generate");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${item.slug}_officiel.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      hapticFeedback("success");
      showToast("Téléchargement du PDF démarré", "success");
    } catch (err: any) {
      hapticFeedback("error");
      showToast(err.message || "Échec du téléchargement", "error");
    } finally {
      setLoadingGenerate(false);
    }
  };

  const handleSendToBot = async () => {
    if (!user?.id) {
      showToast("Impossible de récupérer votre identifiant Telegram", "error");
      return;
    }
    try {
      setLoadingBotSend(true);
      await executeApi("generate", true);
      hapticFeedback("success");
      setSuccessModalMessage("Votre document officiel a été expédié directement dans votre discussion avec le bot Telegram.");
      setIsSuccessModalOpen(true);
    } catch (err: any) {
      hapticFeedback("error");
      showToast(err.message || "Échec de l'envoi vers le bot", "error");
    } finally {
      setLoadingBotSend(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-12">
      <div className="sticky top-0 z-30 bg-[#0a0818]/90 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour</span>
        </button>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {item.badge || item.category.toUpperCase()}
        </span>
      </div>

      <div className="p-4 max-w-lg mx-auto w-full">
        <div className="mb-6">
          <h2 className="text-xl font-black text-white tracking-wide">{item.name}</h2>
          <p className="text-xs text-slate-400 mt-1">{item.description}</p>
        </div>

        <div className="bg-[#120f26] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
          {Object.entries(formData).map(([key, val]) => (
            <div key={key} className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {key.replace(/_/g, " ")}
              </label>
              {key === "duree_mois" ? (
                <select
                  value={val}
                  onChange={(e) => handleInputChange(key, Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 outline-none"
                >
                  <option value={1} className="bg-[#120f26]">1 mois</option>
                  <option value={3} className="bg-[#120f26]">3 mois</option>
                  <option value={6} className="bg-[#120f26]">6 mois</option>
                  <option value={12} className="bg-[#120f26]">12 mois</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={val}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 outline-none transition-colors"
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          <button
            onClick={handlePreview}
            disabled={loadingPreview}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-bold transition-all active:scale-98 disabled:opacity-50"
          >
            {loadingPreview ? (
              <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
            ) : (
              <>
                <Eye className="w-5 h-5 text-emerald-400" />
                <span>Générer un aperçu (Filigrane)</span>
              </>
            )}
          </button>

          <button
            onClick={handleSendToBot}
            disabled={loadingBotSend}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-sm font-black shadow-lg shadow-emerald-500/20 transition-all active:scale-98 disabled:opacity-50"
          >
            {loadingBotSend ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Recevoir dans Telegram (@Bot)</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            disabled={loadingGenerate}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-transparent hover:bg-white/5 text-slate-400 hover:text-white text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {loadingGenerate ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Télécharger directement le PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      <CustomModal
        isOpen={isPreviewOpen}
        title="Aperçu du Document"
        onClose={() => setIsPreviewOpen(false)}
        confirmText="Fermer"
      >
        <div className="relative w-full max-h-[60vh] overflow-y-auto rounded-xl bg-black/40 border border-white/10 p-2 flex justify-center items-center">
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Aperçu filigrane"
              className="w-full h-auto object-contain rounded-lg shadow-inner"
            />
          )}
        </div>
      </CustomModal>

      <CustomModal
        isOpen={isSuccessModalOpen}
        type="success"
        title="Envoi Terminé"
        message={successModalMessage}
        onClose={() => setIsSuccessModalOpen(false)}
        confirmText="Compris"
      />
    </div>
  );
}
