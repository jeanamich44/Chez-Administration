export interface BrandMetadata {
  slug: string;
  name: string;
  logo: string;
  logoClass?: string;
  headerBg: string;
  category?: string;
  description?: string;
}

export const BRAND_CATALOG: Record<string, BrandMetadata> = {
  ami: {
    slug: "ami",
    name: "AMI",
    logo: "/logos/ami.png",
    logoClass: "scale-[3.2] md:scale-[3.5]",
    headerBg: "bg-white border-white/20",
    category: "luxe",
    description: "• Facture AMI Paris\n• Format PDF / Preview Gratuite\n• Adresse, TVA et articles"
  },
  burberry: {
    slug: "burberry",
    name: "Burberry",
    logo: "/logos/burberry.png",
    logoClass: "scale-[3.3] md:scale-[3.6]",
    headerBg: "bg-white border-neutral-800/30",
    category: "luxe",
    description: "• Déclaration d'expédition Burberry\n• Format PDF / Preview Gratuite\n• Collect-in-store et articles"
  },
  chanel: {
    slug: "chanel",
    name: "Chanel",
    logo: "/logos/chanel.png",
    logoClass: "scale-[1.8] md:scale-[2.0]",
    headerBg: "bg-white border-neutral-800/30",
    category: "luxe",
    description: "• Facture boutique Chanel Mode & Joaillerie\n• Format PDF / Preview Gratuite\n• Vente, conseiller et articles luxe"
  },
  dior: {
    slug: "dior",
    name: "Dior",
    logo: "/logos/dior.svg",
    logoClass: "scale-[0.70] md:scale-[0.75]",
    headerBg: "bg-white border-neutral-800/30",
    category: "luxe",
    description: "• Facture boutique Christian Dior\n• Format PDF / Preview Gratuite\n• Vente, duplicata et articles luxe"
  },
  fred: {
    slug: "fred",
    name: "Fred",
    logo: "/logos/fred.svg",
    logoClass: "scale-100 md:scale-105",
    headerBg: "bg-white border-neutral-800/30",
    category: "luxe",
    description: "• Facture boutique Fred Joaillerie\n• Format PDF / Preview Gratuite\n• Orfèvrerie, force 10 et joaillerie"
  },
  jacquemus: {
    slug: "jacquemus",
    name: "Jacquemus",
    logo: "/logos/jacquemus.svg",
    logoClass: "scale-[0.70] md:scale-[0.75]",
    headerBg: "bg-white border-neutral-800/30",
    category: "luxe",
    description: "• Facture commande en ligne Jacquemus\n• Format PDF / Preview Gratuite\n• Expédition, TVA et articles mode"
  },
  loro_piana: {
    slug: "loro_piana",
    name: "Loro Piana",
    logo: "/logos/loro_piana.png",
    logoClass: "scale-90 md:scale-95",
    headerBg: "bg-white border-neutral-800/30",
    category: "luxe",
    description: "• Ticket de caisse Loro Piana\n• Format PDF / Preview Gratuite\n• Caisse, vendeur et articles luxe"
  },
  "loro-piana": {
    slug: "loro_piana",
    name: "Loro Piana",
    logo: "/logos/loro_piana.png",
    logoClass: "scale-90 md:scale-95",
    headerBg: "bg-white border-neutral-800/30",
    category: "luxe",
    description: "• Ticket de caisse Loro Piana\n• Format PDF / Preview Gratuite\n• Caisse, vendeur et articles luxe"
  },
  adidas: {
    slug: "adidas",
    name: "Adidas",
    logo: "/logos/adidas.svg",
    logoClass: "scale-100 md:scale-110",
    headerBg: "bg-white border-white/20",
    category: "commerce",
    description: "• Facture boutique en ligne Adidas\n• Format PDF / Preview Gratuite\n• Adresses, références et articles"
  },
  amazon: {
    slug: "amazon",
    name: "Amazon",
    logo: "/logos/amazon.svg",
    logoClass: "scale-85 md:scale-90",
    headerBg: "bg-white border-amber-500/30",
    category: "commerce",
    description: "• Facture Amazon ou vendeur marketplace\n• Format PDF / Preview Gratuite\n• Commande, TVA et articles"
  },
  cdiscount: {
    slug: "cdiscount",
    name: "Cdiscount",
    logo: "/logos/cdiscount.svg",
    logoClass: "scale-90 md:scale-95",
    headerBg: "bg-white border-red-500/30",
    category: "commerce",
    description: "• Facture Cdiscount Marketplace\n• Format PDF / Preview Gratuite\n• Commande, vendeur et articles"
  },
  dafy: {
    slug: "dafy",
    name: "Dafy Moto",
    logo: "/logos/dafy.png",
    logoClass: "scale-120 md:scale-130",
    headerBg: "bg-white border-red-500/30",
    category: "commerce",
    description: "• Facture d'achat Dafy Moto\n• Format PDF / Preview Gratuite\n• Adresses, magasin et articles moto"
  },
  "dafy-moto": {
    slug: "dafy",
    name: "Dafy Moto",
    logo: "/logos/dafy.png",
    logoClass: "scale-120 md:scale-130",
    headerBg: "bg-white border-red-500/30",
    category: "commerce",
    description: "• Facture d'achat Dafy Moto\n• Format PDF / Preview Gratuite\n• Adresses, magasin et articles moto"
  },
  darty: {
    slug: "darty",
    name: "Darty",
    logo: "/logos/darty.svg",
    logoClass: "scale-110 md:scale-120",
    headerBg: "bg-white border-red-500/30",
    category: "commerce",
    description: "• Facture d'achat Darty\n• Format PDF / Preview Gratuite\n• Garantie, délivrance et articles"
  },
  boulanger: {
    slug: "boulanger",
    name: "Boulanger",
    logo: "/logos/boulanger.svg",
    logoClass: "scale-110 md:scale-120",
    headerBg: "bg-white border-orange-500/30",
    category: "commerce",
    description: "• Facture Boulanger en ligne ou magasin\n• Format PDF / Preview Gratuite\n• Adresses, garantie et articles"
  },
  fnac: {
    slug: "fnac",
    name: "Fnac",
    logo: "/logos/fnac.svg",
    logoClass: "scale-125 md:scale-130",
    headerBg: "bg-white border-yellow-500/30",
    category: "commerce",
    description: "• Facture Fnac.com ou magasin\n• Format PDF / Preview Gratuite\n• Mode de règlement et articles"
  },
  nike: {
    slug: "nike",
    name: "Nike",
    logo: "/logos/nike.svg",
    logoClass: "scale-85 md:scale-90",
    headerBg: "bg-white border-orange-500/30",
    category: "commerce",
    description: "• Facture Nike.com\n• Format PDF / Preview Gratuite\n• Adresses, références et articles"
  },
  nocibe: {
    slug: "nocibe",
    name: "Nocibé",
    logo: "/logos/nocibe.svg",
    logoClass: "scale-100 md:scale-105",
    headerBg: "bg-white border-pink-500/30",
    category: "commerce",
    description: "• Facture boutique & parfumerie Nocibé\n• Format PDF / Preview Gratuite\n• Parfums, remises et TVA détaillée"
  },
  pack_moto: {
    slug: "pack_moto",
    name: "Pack Moto",
    logo: "/logos/pack_moto.png",
    logoClass: "scale-95 md:scale-105",
    headerBg: "bg-white border-orange-500/30",
    category: "commerce",
    description: "• Facture d'expédition Pack Moto\n• Format PDF / Preview Gratuite\n• Transporteur, société et articles"
  },
  "pack-moto": {
    slug: "pack_moto",
    name: "Pack Moto",
    logo: "/logos/pack_moto.png",
    logoClass: "scale-95 md:scale-105",
    headerBg: "bg-white border-orange-500/30",
    category: "commerce",
    description: "• Facture d'expédition Pack Moto\n• Format PDF / Preview Gratuite\n• Transporteur, société et articles"
  },
  gaz: {
    slug: "gaz",
    name: "Gaz (Engie)",
    logo: "/logos/gaz.svg",
    logoClass: "scale-90 md:scale-95",
    headerBg: "bg-white border-blue-500/30",
    category: "domicile",
    description: "• Facture de souscription gaz Engie\n• Format PDF / Preview Gratuite\n• PCE, lieu de conso et montants"
  },
  engie: {
    slug: "gaz",
    name: "Gaz (Engie)",
    logo: "/logos/gaz.svg",
    logoClass: "scale-90 md:scale-95",
    headerBg: "bg-white border-blue-500/30",
    category: "domicile",
    description: "• Facture de souscription gaz Engie\n• Format PDF / Preview Gratuite\n• PCE, lieu de conso et montants"
  },
  attestation_direct_energie: {
    slug: "attestation_direct_energie",
    name: "Direct Énergie",
    logo: "/logos/direct_energie.svg",
    logoClass: "scale-100 md:scale-110",
    headerBg: "bg-white border-amber-500/30",
    category: "domicile",
    description: "• Titulaire de contrat Direct Énergie\n• Format PDF / Preview Gratuite\n• Identité, référence client et date"
  },
  attestation_edf: {
    slug: "attestation_edf",
    name: "EDF",
    logo: "/logos/edf.svg",
    logoClass: "scale-100 md:scale-110",
    headerBg: "bg-white border-orange-500/30",
    category: "domicile",
    description: "• Titulaire de contrat EDF\n• Format PDF / Preview Gratuite\n• Identité, PDL et cachet"
  },
  conduite_heures: {
    slug: "conduite_heures",
    name: "Heures de conduite",
    logo: "/logos/cfrvitry.png",
    logoClass: "scale-100 md:scale-110",
    headerBg: "bg-white border-sky-500/30",
    category: "formation",
    description: "• Liste des rendez-vous de leçon\n• Format PDF / Preview Gratuite\n• Élève, édition et créneaux"
  },
  conduit_heures: {
    slug: "conduite_heures",
    name: "Heures de conduite",
    logo: "/logos/cfrvitry.png",
    logoClass: "scale-100 md:scale-110",
    headerBg: "bg-white border-sky-500/30",
    category: "formation",
    description: "• Liste des rendez-vous de leçon\n• Format PDF / Preview Gratuite\n• Élève, édition et créneaux"
  },
  maxance: {
    slug: "maxance",
    name: "Maxance Assurances",
    logo: "/logos/maxance.svg",
    logoClass: "scale-90 md:scale-100",
    headerBg: "bg-gradient-to-br from-red-950/50 to-slate-950/80 border-rose-500/30",
    category: "assurance",
    description: "• Générateur d'Attestation Maxance\n• Format PDF / Preview Gratuite\n• 13 Champs à remplir"
  },
  axa: {
    slug: "axa",
    name: "AXA Assurances",
    logo: "/logos/axa.svg",
    logoClass: "scale-90 md:scale-100",
    headerBg: "bg-gradient-to-br from-blue-950/50 to-slate-950/80 border-blue-500/30",
    category: "assurance",
    description: "• Mémo Véhicule Assuré AXA\n• Format PDF / Preview Gratuite\n• Conforme FVA 2024+"
  },
  fiche_de_paie: {
    slug: "fiche_de_paie",
    name: "Fiche de Paie",
    logo: "/logos/fiche_de_paie.svg",
    logoClass: "scale-100 md:scale-110",
    headerBg: "bg-gradient-to-br from-sky-900/40 to-slate-950/80 border-sky-500/30",
    category: "emploi",
    description: "• Bulletin de paie & fiche de salaire conforme\n• Pack 1, 3, 6 ou 12 mois avec continuité et cumuls\n• Calculs automatiques Net, Brut, Cotisations & PAS"
  },
  contrat_travail: {
    slug: "contrat_travail",
    name: "Contrat de Travail",
    logo: "/logos/fiche_de_paie.svg",
    logoClass: "scale-100 md:scale-110",
    headerBg: "bg-gradient-to-br from-indigo-900/40 to-slate-950/80 border-indigo-500/30",
    category: "emploi",
    description: "• Contrat à durée indéterminée ou déterminée\n• Clauses conformes et mentions légales\n• Bientôt disponible"
  },
  attestation_france_travail: {
    slug: "attestation_france_travail",
    name: "Attestation France Travail",
    logo: "/logos/fiche_de_paie.svg",
    logoClass: "scale-100 md:scale-110",
    headerBg: "bg-gradient-to-br from-emerald-900/40 to-slate-950/80 border-emerald-500/30",
    category: "emploi",
    description: "• Attestation employeur pôle emploi\n• Justificatif de fin de contrat et indemnités\n• Bientôt disponible"
  }
};
