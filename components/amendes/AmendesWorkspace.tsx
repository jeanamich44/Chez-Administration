"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTelegram } from "@/components/TelegramContext";
import { useToast } from "@/components/NotificationToast";
import {
  ArrowLeft,
  FileText,
  UploadCloud,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Trash2,
  Eye,
  CreditCard,
  Wallet,
  Sparkles,
  RefreshCw,
  FileCheck,
  X,
  ExternalLink,
  ShieldCheck
} from "lucide-react";

/* ===================================================================== */

interface AmendeRequest {
  id: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "PAID" | "FINISHED";
  price: number | null;
  file_urls: string[];
  note: string;
  admin_notes: string;
  created_at: string | null;
  updated_at: string | null;
}

interface AmendesWorkspaceProps {
  onBack: () => void;
  onGoRecharge?: () => void;
}

/* ===================================================================== */

export default function AmendesWorkspace({ onBack, onGoRecharge }: AmendesWorkspaceProps) {
  const { user, balance, refreshBalance, initData, haptic } = useTelegram();
  const toast = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"new" | "my-cases">("new");
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const [amendes, setAmendes] = useState<AmendeRequest[]>([]);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);

  const [payModalItem, setPayModalItem] = useState<AmendeRequest | null>(null);
  const [isPaying, setIsPaying] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  /* ===================================================================== */

  const fetchAmendes = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const res = await fetch("/api/proxy/amendes/list", {
        headers: { "X-Telegram-Init-Data": initData },
      });
      if (res.ok) {
        const data = await res.json();
        setAmendes(data.amendes || []);
      }
    } catch {
      toast.error("Impossible de récupérer la liste des dossiers");
    } finally {
      setIsLoadingList(false);
    }
  }, [initData, toast]);

  useEffect(() => {
    fetchAmendes();
  }, [fetchAmendes]);

  /* ===================================================================== */

  const validateAndAddFiles = (incomingFiles: File[]) => {
    const validExts = ["image/jpeg", "image/png", "application/pdf"];
    const accepted: File[] = [];

    for (const f of incomingFiles) {
      const ext = f.name.toLowerCase();
      const isAllowed = validExts.includes(f.type) || ext.endsWith(".jpg") || ext.endsWith(".jpeg") || ext.endsWith(".png") || ext.endsWith(".pdf");
      if (!isAllowed) {
        toast.error(`Format non supporté pour ${f.name}. Seuls JPEG, PNG et PDF sont acceptés.`);
        continue;
      }
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`Fichier trop lourd (${f.name}). Limite: 10 Mo par document.`);
        continue;
      }
      accepted.push(f);
    }

    if (accepted.length === 0) return;

    setFiles((prev) => {
      const combined = [...prev, ...accepted].slice(0, 4);
      if (prev.length + accepted.length > 4) {
        toast.info("Limite fixée à 4 documents maximum par dossier.");
      }
      return combined;
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeFile = (idx: number) => {
    haptic("selection");
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  /* ===================================================================== */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      toast.error("Veuillez sélectionner au moins un document ou avis de contravention.");
      return;
    }

    haptic("impact");
    setIsUploading(true);

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    if (note.trim()) {
      formData.append("note", note.trim());
    }

    try {
      const res = await fetch("/api/proxy/amendes/submit", {
        method: "POST",
        headers: { "X-Telegram-Init-Data": initData },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.detail || data.error || "Échec de l'envoi du dossier.");
        return;
      }

      toast.success("Votre dossier d'amende a été transmis avec succès !");
      haptic("notification");
      setFiles([]);
      setNote("");
      setActiveTab("my-cases");
      fetchAmendes();
    } catch {
      toast.error("Erreur de connexion lors de la transmission.");
    } finally {
      setIsUploading(false);
    }
  };

  /* ===================================================================== */

  const handleOpenPayModal = (amende: AmendeRequest) => {
    haptic("impact");
    setPayModalItem(amende);
  };

  const handleConfirmPay = async () => {
    if (!payModalItem || !payModalItem.price) return;
    const price = payModalItem.price;

    if (balance < price) {
      toast.error(`Solde insuffisant (${balance.toFixed(2)} € disponible, ${price.toFixed(2)} € requis).`);
      return;
    }

    setIsPaying(true);
    try {
      const res = await fetch("/api/proxy/amendes/pay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Telegram-Init-Data": initData,
        },
        body: JSON.stringify({ amendeId: payModalItem.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.detail || data.error || "Échec du règlement du dossier.");
        return;
      }

      toast.success("Règlement effectué avec succès ! Traitement en cours.");
      haptic("notification");
      setPayModalItem(null);
      refreshBalance();
      fetchAmendes();
    } catch {
      toast.error("Erreur de communication lors du règlement.");
    } finally {
      setIsPaying(false);
    }
  };

  /* ===================================================================== */

  const renderStatusBadge = (status: AmendeRequest["status"]) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
            <Clock size={10} /> En analyse
          </span>
        );
      case "ACCEPTED":
        return (
          <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            <CheckCircle2 size={10} /> Accepté
          </span>
        );
      case "REJECTED":
        return (
          <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
            <XCircle size={10} /> Refusé
          </span>
        );
      case "PAID":
        return (
          <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full">
            <CreditCard size={10} /> Réglé (En cours)
          </span>
        );
      case "FINISHED":
        return (
          <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
            <ShieldCheck size={10} /> Annulée
          </span>
        );
    }
  };

  const pendingOrAcceptedCount = amendes.filter(
    (a) => a.status === "PENDING" || a.status === "ACCEPTED"
  ).length;

  /* ===================================================================== */

  return (
    <div className="space-y-4 pb-20 fade-in">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            haptic("selection");
            onBack();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 active:scale-95 transition-all text-xs font-semibold text-white/80"
        >
          <ArrowLeft size={14} /> Retour
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              haptic("selection");
              fetchAmendes();
            }}
            className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/60 hover:text-white active:scale-95 transition-all"
            title="Rafraîchir"
          >
            <RefreshCw size={14} className={isLoadingList ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <FileCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black italic tracking-tight text-white">
                  ANNULATION AMENDE 24H
                </h2>
                <span className="px-1.5 py-0.2 rounded-full border text-[7px] font-black uppercase bg-amber-500/10 border-amber-500/20 text-amber-400">
                  24H CHRONO
                </span>
              </div>
              <p className="text-[10px] text-white/50 leading-tight mt-0.5">
                Envoyez vos avis de contravention. Prise en charge et analyse rapide sous 24h.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 p-1 rounded-xl bg-[#0f121d] border border-white/5">
        <button
          type="button"
          onClick={() => {
            haptic("selection");
            setActiveTab("new");
          }}
          className={`flex-1 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "new"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
              : "text-white/40 hover:text-white"
          }`}
        >
          <UploadCloud size={14} /> Nouveau Dossier
        </button>

        <button
          type="button"
          onClick={() => {
            haptic("selection");
            setActiveTab("my-cases");
          }}
          className={`flex-1 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 relative ${
            activeTab === "my-cases"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
              : "text-white/40 hover:text-white"
          }`}
        >
          <FileText size={14} /> Mes Dossiers
          {pendingOrAcceptedCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[9px] font-black">
              {pendingOrAcceptedCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === "new" && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragOver
                ? "border-amber-400 bg-amber-500/10 scale-[1.01]"
                : "border-white/10 hover:border-amber-400/40 bg-white/[0.02]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,application/pdf"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto mb-2">
              <UploadCloud size={24} />
            </div>
            <p className="text-xs font-black text-white mb-1">
              Appuyez pour sélectionner vos documents
            </p>
            <p className="text-[10px] text-white/40">
              Photos ou scans de l&apos;avis (1 à 4 fichiers, JPEG, PNG, PDF - Max 10 Mo)
            </p>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1">
                Documents sélectionnés ({files.length}/4)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#0f121d] border border-white/5 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                        <FileText size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-white truncate">{file.name}</p>
                        <p className="text-[9px] text-white/40">
                          {(file.size / 1024 / 1024).toFixed(2)} Mo
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(idx);
                      }}
                      className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shrink-0"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1">
              Note explicative ou précisions (optionnel)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 200))}
              placeholder="Ex: Avis reçu le 12/03, véhicule prêté à un tiers..."
              rows={3}
              className="w-full bg-[#0f121d] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-amber-400/50 transition-colors resize-none"
            />
            <div className="flex justify-end text-[9px] text-white/30 px-1">
              {note.length}/200 caractères
            </div>
          </div>

          <button
            type="submit"
            disabled={isUploading || files.length === 0}
            className={`w-full py-3.5 rounded-xl font-black italic text-xs tracking-wider transition-all flex items-center justify-center gap-2 ${
              isUploading || files.length === 0
                ? "bg-white/10 text-white/30 cursor-not-allowed"
                : "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 active:scale-[0.98]"
            }`}
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
                Transmission du dossier...
              </>
            ) : (
              <>
                <FileCheck size={16} /> Envoyer mon dossier d&apos;amende
              </>
            )}
          </button>
        </form>
      )}

      {activeTab === "my-cases" && (
        <div className="space-y-3">
          {isLoadingList ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-white/40">
              <div className="w-6 h-6 border-2 border-amber-400/20 border-t-amber-400 rounded-full animate-spin" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Chargement des dossiers...</span>
            </div>
          ) : amendes.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#0f121d]/50 border border-white/5">
              <FileText size={32} className="text-white/20 mx-auto mb-2" />
              <p className="text-xs font-bold text-white/60 mb-1">Aucun dossier déposé</p>
              <p className="text-[10px] text-white/40 mb-3">
                Vous n&apos;avez pas encore soumis d&apos;avis d&apos;amende.
              </p>
              <button
                type="button"
                onClick={() => {
                  haptic("selection");
                  setActiveTab("new");
                }}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-black shadow-md"
              >
                Créer un dossier
              </button>
            </div>
          ) : (
            amendes.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-[#0f121d] border border-white/5 space-y-3 hover:border-white/10 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black italic text-white">
                        Dossier #{item.id.slice(0, 8)}
                      </span>
                      {renderStatusBadge(item.status)}
                    </div>
                    <div className="text-[10px] text-white/40">
                      Déposé le {item.created_at ? new Date(item.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "N/A"}
                    </div>
                  </div>

                  {item.price !== null && (
                    <div className="text-right shrink-0">
                      <div className="text-[9px] text-white/40 font-bold uppercase">Tarif fixé</div>
                      <div className="text-xs font-black text-amber-400">
                        {item.price.toFixed(2)} €
                      </div>
                    </div>
                  )}
                </div>

                {item.note && (
                  <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-white/70 italic">
                    &ldquo;{item.note}&rdquo;
                  </div>
                )}

                {item.file_urls && item.file_urls.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[9px] font-black text-white/40 uppercase tracking-widest">
                      Documents ({item.file_urls.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.file_urls.map((url, fIdx) => (
                        <a
                          key={fIdx}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 hover:border-amber-400/40 text-[10px] font-bold text-white/80 transition-colors"
                        >
                          <Eye size={10} className="text-amber-400" />
                          <span>Pièce {fIdx + 1}</span>
                          <ExternalLink size={9} className="opacity-40" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {item.status === "ACCEPTED" && item.price !== null && (
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-3">
                    <div className="text-[10px] text-white/60 leading-tight">
                      Prêt à être traité dès règlement.
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenPayModal(item)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black italic tracking-wide transition-all shadow-md shadow-emerald-500/20 active:scale-95 shrink-0 flex items-center gap-1.5"
                    >
                      <CreditCard size={12} /> Payer {item.price.toFixed(2)} €
                    </button>
                  </div>
                )}

                {item.status === "PENDING" && (
                  <div className="pt-1 text-[10px] text-amber-400/70 flex items-center gap-1">
                    <Clock size={11} /> Un gestionnaire examine actuellement vos pièces jointes.
                  </div>
                )}

                {item.status === "REJECTED" && (
                  <div className="pt-1 text-[10px] text-rose-400/70 flex items-center gap-1">
                    <AlertCircle size={11} /> Prise en charge impossible pour ce dossier.
                  </div>
                )}

                {item.status === "PAID" && (
                  <div className="pt-1 text-[10px] text-sky-400/80 flex items-center gap-1">
                    <CheckCircle2 size={11} /> Dossier réglé. Procédure d&apos;annulation en cours.
                  </div>
                )}

                {item.status === "FINISHED" && (
                  <div className="pt-1 text-[10px] text-emerald-400/80 flex items-center gap-1">
                    <ShieldCheck size={11} /> Procédure terminée et clôturée.
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {payModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-[#0f121d] border border-amber-500/30 p-5 space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setPayModalItem(null)}
              className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white"
            >
              <X size={14} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <CreditCard size={20} />
              </div>
              <div>
                <h3 className="text-xs font-black italic text-white">CONFIRMATION DU RÈGLEMENT</h3>
                <p className="text-[10px] text-white/50">Dossier #{payModalItem.id.slice(0, 8)}</p>
              </div>
            </div>

            <div className="space-y-2 p-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs">
              <div className="flex justify-between items-center text-white/60">
                <span>Montant à débiter :</span>
                <span className="font-black text-amber-400">
                  {payModalItem.price?.toFixed(2)} €
                </span>
              </div>
              <div className="flex justify-between items-center text-white/60">
                <span>Votre solde actuel :</span>
                <span className="font-black text-white">{balance.toFixed(2)} €</span>
              </div>
              <div className="border-t border-white/5 pt-2 flex justify-between items-center text-white font-bold">
                <span>Solde restant après paiement :</span>
                <span
                  className={
                    balance >= (payModalItem.price || 0) ? "text-emerald-400" : "text-rose-400"
                  }
                >
                  {(balance - (payModalItem.price || 0)).toFixed(2)} €
                </span>
              </div>
            </div>

            {balance < (payModalItem.price || 0) ? (
              <div className="space-y-2">
                <p className="text-[11px] text-rose-400 font-medium text-center">
                  Solde insuffisant pour régler ce dossier.
                </p>
                {onGoRecharge && (
                  <button
                    type="button"
                    onClick={() => {
                      setPayModalItem(null);
                      onGoRecharge();
                    }}
                    className="w-full py-2.5 rounded-xl bg-primary text-slate-950 text-xs font-black flex items-center justify-center gap-1.5"
                  >
                    <Wallet size={14} /> Recharger mon solde
                  </button>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPayModalItem(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={isPaying}
                  onClick={handleConfirmPay}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                >
                  {isPaying ? (
                    <div className="w-4 h-4 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 size={14} /> Confirmer
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
