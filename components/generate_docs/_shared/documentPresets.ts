import {
  adidasDelivery,
  adidasInvoice,
  amazonInvoice,
  amazonOrder,
  amiInvoice,
  burberryOrder,
  chanelDate,
  chanelInvoice,
  chanelTime,
  conduiteDate,
  conduiteLessons,
  conduiteTime,
  diorDate,
  diorInvoice,
  diorTime,
  edfAttestation,
  fnacMagasin,
  fnacWeb,
  fredDate,
  isoDate,
  jacquemusDate,
  jacquemusInvoice,
  jacquemusTime,
  nikeInvoice,
  nocibeDate,
  parisDate,
  slashDate,
  slashDateYY
} from "./exampleDates";

/* ===================================================================== */

const AMAZON_SELLER = {
  seller_nom: "Amazon EU S.à r.l., Succursale Française",
  seller_adresse: "67 Boulevard du General Leclerc",
  seller_adresse2: "",
  seller_cp: "92110",
  seller_ville: "Clichy",
  seller_cp_ville: "Clichy 92110",
  seller_pays: "France",
  seller_tva: "LU19647148",
  num_facture: "DS-ASE-INV-FR-2022-172445727"
};

const MARKET_SELLER = {
  seller_nom: "EUROSTORE",
  seller_adresse: "18 Rue du Commerce",
  seller_adresse2: "",
  seller_cp: "75015",
  seller_ville: "Paris",
  seller_cp_ville: "Paris, 75015",
  seller_pays: "FR",
  seller_tva: "FR10011001100",
  num_facture: "FR26MKP10011"
};

/* ===================================================================== */

function boulangerEnLigne(dateStr: string) {
  return {
    mode: "en_ligne",
    store_nom: "BOULANGER WWW.BOULANGER.COM",
    store_rue1: "CRT - BP137",
    store_rue2: "AV DE LA MOTTE",
    store_cp: "59810",
    store_ville: "LESQUIN",
    store_siret: "34738457002017",
    store_tel: "03 86 42 53 08",
    facture_num: "F905 FQ09058-23/002",
    facture_date: dateStr,
    facture_time: "19:23",
    barcode_val: "0008010892",
    extra_line_nom: "BOULANGER FRAIS DE PORT",
    extra_line_total: "3,99",
    extra_line_pu_ttc: "3,99",
    total_ht: "44,99",
    total_ttc: "53,98",
    dont_tva: "9,00",
    dont_ecopart: "0,02",
    reglement_montant: "53,98",
    items: [
      {
        nom: "PACK ADEQWAT Powerbank + Chargeur + C",
        qte: "1",
        code: "0008010892",
        pu_ttc: "49,97",
        ecopart: "0,02",
        tva_taux: "20,00",
        total_ttc: "49,97",
        dispo_pieces: "Pas de pièce disponible",
        garantie_reparation: "Garantie Réparation jusqu'au 19.12.2025"
      }
    ]
  };
}

function boulangerMagasin(dateStr: string) {
  return {
    mode: "magasin",
    store_nom: "BOULANGER CAMBRAI",
    store_rue1: "CENTRE COMMERCIAL CORA",
    store_rue2: "ZAC CAMBRAI SUD",
    store_cp: "59400",
    store_ville: "CAMBRAI",
    store_siret: "34738457001167",
    store_tel: "03 86 42 53 08",
    facture_num: "F905 DR10494-23/003",
    facture_date: dateStr,
    facture_time: "14:39",
    barcode_val: "F905DR10494",
    extra_line_nom: "",
    extra_line_total: "",
    extra_line_pu_ttc: "",
    total_ht: "416,66",
    total_ttc: "499,99",
    dont_tva: "83,33",
    dont_ecopart: "0,50",
    reglement_montant: "499,99",
    items: [
      {
        nom: "Enceinte SONOS Era 300 EU Noir",
        qte: "1",
        code: "0001188819",
        pu_ttc: "499,49",
        ecopart: "0,50",
        tva_taux: "20,00",
        total_ttc: "499,49",
        dispo_pieces: "Pas de pièce disponible",
        garantie_reparation: "Garantie Réparation jusqu'au 27.04.2025"
      }
    ]
  };
}

/* ===================================================================== */

function fnacWebChannel() {
  const stamp = fnacWeb();
  return {
    store_nom: "FNAC DIRECT",
    store_l1: "ZONE LOGISTIQUE NORD",
    store_l2: "91000 EVRY",
    store_l3: "FRANCE",
    payment_mode: "Carte bancaire",
    tva_code: "I",
    date_commande: stamp,
    date_facture: stamp,
    echeance: stamp,
    livraison_pays: "FR",
    facturation_pays: "FR"
  };
}

function fnacMagasinChannel() {
  const stamp = fnacMagasin();
  return {
    store_nom: "FNAC Forum",
    store_l1: "Forum des Halles",
    store_l2: "75001 Paris",
    store_l3: "",
    payment_mode: "A la caisse",
    tva_code: "1",
    date_commande: stamp,
    date_facture: stamp,
    echeance: stamp,
    livraison_pays: "",
    facturation_pays: ""
  };
}

/* ===================================================================== */

export const FACTURE_DATES: Record<string, (defaults: Record<string, any>) => Record<string, any>> = {
  adidas: (defaults) => {
    const res = { ...defaults };
    res.date_facture = adidasInvoice();
    res.date_livraison = adidasDelivery();
    return res;
  },
  amazon: (defaults) => {
    const res = { ...defaults };
    res.date_commande = amazonOrder();
    res.date_facture = amazonInvoice();
    return res;
  },
  ami: (defaults) => ({
    ...defaults,
    date_facture: amiInvoice()
  }),
  boulanger: (defaults) => {
    const dateStr = slashDate();
    const res = { ...defaults };
    res.facture_date = dateStr;
    const isMagasin = res.mode === "magasin";
    const channelData = isMagasin ? boulangerMagasin(dateStr) : boulangerEnLigne(dateStr);
    return { ...res, ...channelData };
  },
  burberry: (defaults) => {
    const stamp = burberryOrder();
    return {
      ...defaults,
      date_commande: stamp,
      date_expedition: stamp
    };
  },
  cdiscount: (defaults) => ({
    ...defaults,
    date_commande: slashDate()
  }),
  chanel: (defaults) => ({
    ...defaults,
    date_vente: chanelDate(),
    heure_vente: chanelTime(),
    date_str: chanelInvoice()
  }),
  dafy: (defaults) => {
    const dateStr = slashDate();
    const res = { ...defaults };
    res.date_commande = dateStr;
    res.date_facture = dateStr;
    return res;
  },
  darty: (defaults) => {
    const dateStr = slashDate();
    const res = { ...defaults };
    res.date_commande = dateStr;
    res.date_facture = dateStr;
    if (Array.isArray(res.items) && res.items.length > 0) {
      res.items = res.items.map((it: any) => ({
        ...it,
        date_delivrance: dateStr
      }));
    }
    return res;
  },
  dior: (defaults) => {
    const next: Record<string, any> = {
      ...defaults,
      client_tel: defaults.client_tel || "0658692545",
      date_vente: diorDate(),
      heure_vente: diorTime(),
      date_str: diorInvoice()
    };
    delete next.count_label;
    return next;
  },
  engie: (defaults) => ({
    ...defaults,
    date_facture: slashDateYY()
  }),
  fnac: (defaults) => {
    const res: Record<string, any> = { ...defaults };
    res.num_facture = res.num_facture || "2027880107";
    res.num_commande = res.num_commande || "BXU7ZFTY2SUE2";
    res.matricule = res.matricule || "7000575";
    if (!res.nref || String(res.nref).startsWith("100110078")) {
      res.nref = `${res.num_facture} - MLUCAS -FND`;
    }
    const isOnline = res.en_ligne === true || res.en_ligne === "true";
    const channelData = isOnline ? fnacWebChannel() : fnacMagasinChannel();
    return { ...res, ...channelData };
  },
  fred: (defaults) => ({
    ...defaults,
    date_facture: fredDate(),
    ville_emission: defaults.ville_emission || "Neuilly Sur Marne"
  }),
  gaz: (defaults) => ({
    ...defaults,
    date_facture: slashDateYY()
  }),
  jacquemus: (defaults) => ({
    ...defaults,
    date_commande: jacquemusDate(),
    heure_commande: jacquemusTime(),
    val_date: jacquemusInvoice()
  }),
  loro_piana: (defaults) => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return {
      ...defaults,
      date_ticket: slashDate(),
      heure_ticket: `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
    };
  },
  nike: (defaults) => {
    const stamp = nikeInvoice();
    return {
      ...defaults,
      date_facture: stamp,
      date_envoi: stamp,
      date_echeance: stamp
    };
  },
  nocibe: (defaults) => {
    const today = nocibeDate();
    return {
      ...defaults,
      date_emission: today,
      commande_date: today,
      commande_expedition: today,
      reglement_date: today
    };
  },
  pack_moto: (defaults) => {
    const dateStr = slashDate();
    return {
      ...defaults,
      date_facture: dateStr,
      date_commande: dateStr
    };
  },
  sfr: (defaults) => {
    const dateStr = isoDate();
    const res = { ...defaults };
    res.date_facture = dateStr;
    if (Array.isArray(res.items) && res.items.length > 0) {
      res.items = res.items.map((it: any) => ({
        ...it,
        date: dateStr
      }));
    }
    return res;
  }
};

/* ===================================================================== */

export const FACTURE_TOGGLES: Record<string, (key: string, value: any, prev: Record<string, any>) => Record<string, any>> = {
  amazon: (key, value, prev) => {
    if (key !== "sold_by_amazon") return { ...prev, [key]: value };
    const isAmazon = value === true || value === "true";
    return {
      ...prev,
      sold_by_amazon: isAmazon ? "true" : "false",
      ...(isAmazon ? AMAZON_SELLER : MARKET_SELLER)
    };
  },
  boulanger: (key, value, prev) => {
    if (key !== "mode") return { ...prev, [key]: value };
    const dateStr = prev.facture_date || slashDate();
    const channelData = value === "magasin" ? boulangerMagasin(dateStr) : boulangerEnLigne(dateStr);
    return {
      ...prev,
      ...channelData
    };
  },
  fnac: (key, value, prev) => {
    if (key !== "en_ligne") return { ...prev, [key]: value };
    const isOnline = value === true || value === "true";
    return {
      ...prev,
      en_ligne: isOnline ? "true" : "false",
      ...(isOnline ? fnacWebChannel() : fnacMagasinChannel())
    };
  }
};

/* ===================================================================== */

export const JUSTIFICATIF_DATES: Record<string, (defaults: Record<string, any>) => Record<string, any>> = {
  attestation_direct_energie: (defaults) => {
    const res = { ...defaults };
    if ("date" in res) {
      res.date = parisDate();
    }
    return res;
  },
  attestation_edf: (defaults) => {
    const res = { ...defaults };
    if ("date" in res) {
      res.date = edfAttestation();
    }
    return res;
  },
  conduite_heures: (defaults) => {
    const res = { ...defaults };
    if ("edition_date" in res) {
      res.edition_date = conduiteDate();
    }
    if ("edition_time" in res) {
      res.edition_time = conduiteTime();
    }
    if ("rdvs" in res && Array.isArray(res.rdvs) && res.rdvs.length > 0) {
      res.rdvs = conduiteLessons();
    }
    return res;
  }
};

/* ===================================================================== */

export function axaApplyDynamicDates(defaults: Record<string, any>) {
  const res = { ...defaults };
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdaySlash = `${pad(yesterday.getDate())}/${pad(yesterday.getMonth() + 1)}/${yesterday.getFullYear()}`;
  res.date_delivrance = yesterdaySlash;
  res.date_effet = yesterdaySlash;
  return res;
}
