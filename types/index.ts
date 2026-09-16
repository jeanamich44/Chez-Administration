export interface DocSubItem {
  id: string;
  name: string;
  badge?: string;
  description: string;
  category: "emploi" | "rib" | "releve" | "assurance" | "facture" | "justificatif";
  slug: string;
}

// ----------------------------------------------------
export interface CategoryMeta {
  id: "emploi" | "rib" | "releve" | "assurance" | "facture" | "justificatif";
  title: string;
  subtitle: string;
  badge: string;
  items: DocSubItem[];
}

// ----------------------------------------------------
export const CATEGORIES_DATA: CategoryMeta[] = [
  {
    id: "rib",
    title: "RIB Bancaires",
    subtitle: "Générateur de Relevés d'Identité Bancaire",
    badge: "BANQUE",
    items: [
      { id: "lbp", name: "La Banque Postale", slug: "lbp", category: "rib", description: "Relevé d'Identité Bancaire officiel LBP" },
      { id: "bnp", name: "BNP Paribas", slug: "bnp", category: "rib", description: "Relevé d'Identité Bancaire BNP Paribas" },
      { id: "sg", name: "Société Générale", slug: "sg", category: "rib", description: "Relevé d'Identité Bancaire Société Générale" },
      { id: "boursobank", name: "BoursoBank", slug: "boursobank", category: "rib", description: "RIB officiel BoursoBank / Boursorama" },
      { id: "ca", name: "Crédit Agricole", slug: "ca", category: "rib", description: "Relevé de compte & RIB Crédit Agricole" },
      { id: "ce", name: "Caisse d'Épargne", slug: "ce", category: "rib", description: "RIB officiel Caisse d'Épargne" },
      { id: "cic", name: "CIC", slug: "cic", category: "rib", description: "Relevé d'Identité Bancaire CIC" },
      { id: "lcl", name: "LCL", slug: "lcl", category: "rib", description: "RIB officiel LCL Le Crédit Lyonnais" },
      { id: "revolut", name: "Revolut", slug: "revolut", category: "rib", description: "Relevé de compte & RIB Revolut France" },
      { id: "qonto", name: "Qonto", slug: "qonto", category: "rib", description: "RIB professionnel Qonto" }
    ]
  },
  {
    id: "emploi",
    title: "Emploi & Bulletins",
    subtitle: "Fiches de paie et bulletins de salaire conformes",
    badge: "EMPLOI",
    items: [
      { id: "fiche_de_paie", name: "Bulletin de Paie Simplifié", slug: "fiche_de_paie", category: "emploi", description: "Bulletin de salaire officiel (1, 3, 6 ou 12 mois)" }
    ]
  },
  {
    id: "releve",
    title: "Relevés de Compte",
    subtitle: "Relevés d'opérations bancaires périodiques",
    badge: "RELEVÉS",
    items: [
      { id: "lbp", name: "La Banque Postale", slug: "lbp", category: "releve", description: "Relevé de compte bancaire avec historique" },
      { id: "bnp", name: "BNP Paribas", slug: "bnp", category: "releve", description: "Relevé mensuel BNP Paribas" },
      { id: "sg", name: "Société Générale", slug: "sg", category: "releve", description: "Relevé bancaire Société Générale" }
    ]
  },
  {
    id: "facture",
    title: "Factures",
    subtitle: "Factures d'achats marchands certifiées",
    badge: "FACTURE",
    items: [
      { id: "amazon", name: "Amazon", slug: "amazon", category: "facture", description: "Facture d'achat officielle Amazon EU" },
      { id: "adidas", name: "Adidas", slug: "adidas", category: "facture", description: "Facture de commande Adidas France" },
      { id: "nike", name: "Nike", slug: "nike", category: "facture", description: "Facture de commande Nike Europe" },
      { id: "fnac", name: "Fnac", slug: "fnac", category: "facture", description: "Facture d'achat Fnac Darty" },
      { id: "burberry", name: "Burberry", slug: "burberry", category: "facture", description: "Facture boutique de luxe Burberry" },
      { id: "ami", name: "AMI Paris", slug: "ami", category: "facture", description: "Facture d'achat boutique AMI Paris" }
    ]
  },
  {
    id: "assurance",
    title: "Assurances Véhicules",
    subtitle: "Attestations d'assurance véhicule",
    badge: "AUTO",
    items: [
      { id: "maxance", name: "Maxance Assurance", slug: "maxance", category: "assurance", description: "Attestation & carte verte Maxance" }
    ]
  },
  {
    id: "justificatif",
    title: "Justificatifs & Attestations",
    subtitle: "Attestations diverses et domicile",
    badge: "JUSTIF",
    items: [
      { id: "edf", name: "Attestation EDF", slug: "edf", category: "justificatif", description: "Justificatif de domicile officiel EDF" },
      { id: "conduite", name: "Fiche d'Heures de Conduite", slug: "conduite", category: "justificatif", description: "Attestation d'heures de conduite auto-école" }
    ]
  }
];
