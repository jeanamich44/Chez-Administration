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
}

export const BANKS: BankInfo[] = [
  { slug: 'lbp', name: 'La Banque Postale', logo: '/logos/lbp.svg', headerBg: 'bg-gradient-to-r from-blue-900/80 to-sky-800/80', category: 'physique', description: '• RIB La Banque Postale\n• CCP classique ou CNE\n• Format PDF', badge: 'FR' },
  { slug: 'ca', name: 'Crédit Agricole', logo: '/logos/ca.svg', headerBg: 'bg-gradient-to-r from-green-900/80 to-emerald-800/80', category: 'physique', description: '• RIB Crédit Agricole\n• Toutes caisses régionales\n• Format PDF', badge: 'FR' },
  { slug: 'sg', name: 'Société Générale', logo: '/logos/sg.svg', headerBg: 'bg-gradient-to-r from-red-900/80 to-rose-800/80', category: 'physique', description: '• RIB Société Générale\n• Compte courant SG\n• Format PDF', badge: 'FR' },
  { slug: 'cm', name: 'Crédit Mutuel', logo: '/logos/cm.svg', headerBg: 'bg-gradient-to-r from-blue-900/80 to-blue-700/80', category: 'physique', description: '• RIB Crédit Mutuel\n• Fédérations régionales\n• Format PDF', badge: 'FR' },
  { slug: 'cic', name: 'CIC', logo: '/logos/cic.svg', headerBg: 'bg-gradient-to-r from-red-900/80 to-red-700/80', category: 'physique', description: '• RIB CIC Banque\n• Toutes régions\n• Format PDF', badge: 'FR' },
  { slug: 'bnp', name: 'BNP Paribas', logo: '/logos/bnp.svg', headerBg: 'bg-gradient-to-r from-green-900/80 to-teal-800/80', category: 'physique', description: '• RIB BNP Paribas\n• Compte courant\n• Format PDF', badge: 'FR' },
  { slug: 'ce', name: 'Caisse d\'Épargne', logo: '/logos/ce.svg', headerBg: 'bg-gradient-to-r from-red-900/80 to-pink-800/80', category: 'physique', description: '• RIB Caisse d\'Épargne\n• BPCE / Écureuil\n• Format PDF', badge: 'FR' },
  { slug: 'bp', name: 'Banque Populaire', logo: '/logos/bp.svg', headerBg: 'bg-gradient-to-r from-blue-900/80 to-indigo-800/80', category: 'physique', description: '• RIB Banque Populaire\n• Réseau BPCE\n• Format PDF', badge: 'FR' },
  { slug: 'lcl', name: 'LCL', logo: '/logos/lcl.svg', headerBg: 'bg-gradient-to-r from-yellow-900/80 to-amber-700/80', category: 'physique', description: '• RIB LCL Le Crédit Lyonnais\n• Compte courant\n• Format PDF', badge: 'FR' },
  { slug: 'helios', name: 'Helios', logo: '/logos/helios.svg', headerBg: 'bg-gradient-to-r from-emerald-900/80 to-green-700/80', category: 'neobanque', description: '• RIB Helios Banque Verte\n• Compte éco-responsable\n• Format PDF', badge: 'FR' },
  { slug: 'noelse', name: 'Noelse', logo: '/logos/noelse.svg', headerBg: 'bg-gradient-to-r from-purple-900/80 to-violet-700/80', category: 'neobanque', description: '• RIB Noelse\n• Néobanque française\n• Format PDF', badge: 'FR' },
  { slug: 'revolut', name: 'Revolut', logo: '/logos/revolut.svg', headerBg: 'bg-gradient-to-r from-slate-800/80 to-gray-600/80', category: 'neobanque', description: '• RIB Revolut\n• Compte multi-devises\n• Format PDF', badge: 'EU' },
  { slug: 'qonto', name: 'Qonto', logo: '/logos/qonto.svg', headerBg: 'bg-gradient-to-r from-purple-900/80 to-fuchsia-700/80', category: 'neobanque', description: '• RIB Qonto\n• Compte professionnel\n• Format PDF', badge: 'EU' },
  { slug: 'bforbank', name: 'BforBank', logo: '/logos/bforbank.svg', headerBg: 'bg-gradient-to-r from-pink-900/80 to-rose-700/80', category: 'neobanque', description: '• RIB BforBank\n• Banque en ligne CA\n• Format PDF', badge: 'FR' },
  { slug: 'boursobank', name: 'BoursoBank', logo: '/logos/boursobank.svg', headerBg: 'bg-gradient-to-r from-sky-900/80 to-cyan-700/80', category: 'neobanque', description: '• RIB BoursoBank\n• Ex-Boursorama Banque\n• Format PDF', badge: 'FR' },
  { slug: 'sumup', name: 'SumUp', logo: '/logos/sumup.svg', headerBg: 'bg-gradient-to-r from-blue-900/80 to-sky-700/80', category: 'neobanque', description: '• RIB SumUp\n• Compte professionnel\n• Format PDF', badge: 'EU' },
  { slug: 'mypos', name: 'myPOS', logo: '/logos/mypos.svg', headerBg: 'bg-gradient-to-r from-teal-900/80 to-emerald-700/80', category: 'neobanque', description: '• RIB myPOS\n• Compte marchand\n• Format PDF', badge: 'EU' },
];
