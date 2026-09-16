export type BankCategory = 'physique' | 'neobanque';

export interface BankInfo {
  slug: string;
  name: string;
  logo: string;
  logoClass?: string;
  headerBg: string;
  category: BankCategory;
  description: string;
  badge?: string;
  isAvailable?: boolean;
}

export const BANKS: BankInfo[] = [
  {
    slug: "lbp",
    name: "La Banque Postale",
    badge: "FR",
    description: "• Générateur de RIB La Banque Postale\n• Format PDF / Preview Gratuite\n• 11 Champs à remplir",
    logo: "/logos/lbp.svg",
    logoClass: "scale-130 md:scale-145 -translate-x-2.5 md:-translate-x-3",
    headerBg: "bg-gradient-to-br from-blue-900/40 to-slate-950/80 border-blue-500/30",
    category: "physique",
    isAvailable: true
  },
  {
    slug: "ca",
    name: "Crédit Agricole",
    badge: "FR",
    description: "• Générateur de RIB Crédit Agricole\n• Format PDF / Preview Gratuite\n• 15 Champs à remplir",
    logo: "/logos/ca.svg",
    logoClass: "scale-110 md:scale-120",
    headerBg: "bg-gradient-to-br from-emerald-900/40 to-slate-950/80 border-emerald-500/30",
    category: "physique",
    isAvailable: true
  },
  {
    slug: "sg",
    name: "Société Générale",
    badge: "FR",
    description: "• Générateur de RIB Société Générale\n• Format PDF / Preview Gratuite\n• 10 Champs à remplir",
    logo: "/logos/sg.svg",
    logoClass: "scale-100 md:scale-110",
    headerBg: "bg-gradient-to-br from-red-900/40 to-slate-950/80 border-red-500/30",
    category: "physique",
    isAvailable: true
  },
  {
    slug: "cm",
    name: "Crédit Mutuel",
    badge: "FR",
    description: "• Générateur de RIB Crédit Mutuel\n• Format PDF / Preview Gratuite\n• 11 Champs à remplir",
    logo: "/logos/cm.svg",
    logoClass: "scale-115 md:scale-125",
    headerBg: "bg-gradient-to-br from-rose-900/40 to-slate-950/80 border-rose-500/30",
    category: "physique",
    isAvailable: true
  },
  {
    slug: "cic",
    name: "CIC",
    badge: "FR",
    description: "• Générateur de RIB CIC\n• Format PDF / Preview Gratuite\n• 11 Champs à remplir",
    logo: "/logos/cic.svg",
    logoClass: "scale-150 md:scale-175",
    headerBg: "bg-gradient-to-br from-cyan-900/40 to-slate-950/80 border-cyan-500/30",
    category: "physique",
    isAvailable: true
  },
  {
    slug: "bnp",
    name: "BNP Paribas",
    badge: "FR",
    description: "• Générateur de RIB BNP Paribas\n• Format PDF / Preview Gratuite\n• 10 Champs à remplir",
    logo: "/logos/bnp.svg",
    logoClass: "scale-135 md:scale-150",
    headerBg: "bg-gradient-to-br from-emerald-950/40 to-slate-950/80 border-emerald-500/30",
    category: "physique",
    isAvailable: true
  },
  {
    slug: "ce",
    name: "Caisse d'Épargne",
    badge: "FR",
    description: "• Générateur de RIB Caisse d'Épargne\n• Format PDF / Preview Gratuite\n• 10 Champs à remplir",
    logo: "/logos/caisse_depargne.svg",
    logoClass: "scale-120 md:scale-135",
    headerBg: "bg-gradient-to-br from-red-950/40 to-slate-950/80 border-red-500/30",
    category: "physique",
    isAvailable: true
  },
  {
    slug: "bp",
    name: "Banque Populaire",
    badge: "FR",
    description: "• Générateur de RIB Banque Populaire\n• Format PDF / Preview Gratuite\n• 10 Champs à remplir",
    logo: "/logos/banque_populaire.svg",
    logoClass: "scale-90 md:scale-105",
    headerBg: "bg-gradient-to-br from-cyan-950/40 to-slate-950/80 border-cyan-500/30",
    category: "physique",
    isAvailable: true
  },
  {
    slug: "lcl",
    name: "LCL",
    badge: "FR",
    description: "• Générateur de RIB LCL\n• Format PDF / Preview Gratuite\n• 8 Champs à remplir",
    logo: "/logos/lcl.svg",
    logoClass: "scale-135 md:scale-150",
    headerBg: "bg-gradient-to-br from-blue-950/40 to-slate-950/80 border-blue-500/30",
    category: "physique",
    isAvailable: true
  },
  {
    slug: "helios",
    name: "Helios",
    badge: "FR",
    description: "• Générateur de RIB Helios\n• Format PDF / Preview Gratuite\n• 9 Champs à remplir",
    logo: "/logos/helios.svg",
    logoClass: "scale-110",
    headerBg: "bg-gradient-to-br from-cyan-900/40 to-slate-950/80 border-cyan-500/30",
    category: "neobanque",
    isAvailable: true
  },
  {
    slug: "noelse",
    name: "Noelse",
    badge: "FR",
    description: "• Générateur de RIB Noelse\n• Format PDF / Preview Gratuite\n• 7 Champs à remplir",
    logo: "/logos/noelse.svg",
    logoClass: "brightness-0 invert scale-130 md:scale-145",
    headerBg: "bg-gradient-to-br from-indigo-950/40 to-slate-950/80 border-indigo-500/30",
    category: "neobanque",
    isAvailable: true
  },
  {
    slug: "revolut",
    name: "Revolut",
    badge: "EU",
    description: "• Générateur de RIB Revolut\n• Format PDF / Preview Gratuite\n• 8 Champs à remplir",
    logo: "/logos/revolut.svg",
    logoClass: "brightness-0 invert scale-110 md:scale-120",
    headerBg: "bg-gradient-to-br from-purple-900/40 to-slate-950/80 border-purple-500/30",
    category: "neobanque",
    isAvailable: true
  },
  {
    slug: "qonto",
    name: "Qonto",
    badge: "FR",
    description: "• Générateur de RIB Qonto\n• Format PDF / Preview Gratuite\n• 9 Champs à remplir",
    logo: "/logos/qonto.svg",
    logoClass: "brightness-0 invert scale-130 md:scale-140",
    headerBg: "bg-gradient-to-br from-violet-900/40 to-slate-950/80 border-violet-500/30",
    category: "neobanque",
    isAvailable: true
  },
  {
    slug: "bfb",
    name: "BforBank",
    badge: "FR",
    description: "• Générateur de RIB BforBank\n• Format PDF / Preview Gratuite\n• 8 Champs à remplir",
    logo: "/logos/bfb.svg",
    logoClass: "brightness-0 invert scale-75 md:scale-85",
    headerBg: "bg-gradient-to-br from-blue-800/30 to-slate-950/80 border-blue-400/30",
    category: "neobanque",
    isAvailable: true
  },
  {
    slug: "boursobank",
    name: "BoursoBank",
    badge: "FR",
    description: "• Générateur de RIB BoursoBank\n• Format PDF / Preview Gratuite\n• 9 Champs à remplir",
    logo: "/logos/boursobank.svg",
    logoClass: "scale-135 md:scale-155",
    headerBg: "bg-gradient-to-br from-pink-950/40 to-slate-950/80 border-pink-500/30",
    category: "neobanque",
    isAvailable: true
  },
  {
    slug: "sumup",
    name: "SumUp",
    badge: "EU",
    description: "• Générateur de RIB SumUp\n• Format PDF / Preview Gratuite\n• 9 Champs à remplir",
    logo: "/logos/sumup.svg",
    logoClass: "brightness-0 invert scale-115 md:scale-130",
    headerBg: "bg-gradient-to-br from-slate-900/60 to-cyan-950/40 border-cyan-500/30",
    category: "neobanque",
    isAvailable: true
  },
  {
    slug: "mypos",
    name: "MyPos",
    badge: "EU",
    description: "• Générateur de RIB MyPos\n• Format PDF / Preview Gratuite\n• 10 Champs à remplir",
    logo: "/logos/mypos.svg",
    logoClass: "scale-115 md:scale-130",
    headerBg: "bg-gradient-to-br from-blue-950/40 to-slate-950/80 border-blue-500/30",
    category: "neobanque",
    isAvailable: true
  }
];
