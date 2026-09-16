export type RibMode = 'normal' | 'custom';
export type FieldKind = 'input' | 'textarea' | 'select' | 'date' | 'time' | 'country';
export type AutoIbanPart = 'code_banque' | 'code_guichet' | 'numero_compte' | 'cle_rib';

export interface NormalField {
  key: string;
  label: string;
  kind: FieldKind;
  placeholder?: string;
  grid?: string;
  maxLength?: number;
  sanitize?: 'digits' | 'alnum' | 'iban' | 'bic' | 'upper' | 'address' | 'cp' | 'ville';
  autoIban?: AutoIbanPart;
  required?: boolean;
  options?: { value: string; label: string }[];
  section?: string;
  sectionIcon?: string;
  hideInNormal?: boolean;
}

export interface EditorBlock {
  id: string;
  label: string;
  enabled: boolean;
}

export interface EditorField {
  key: string;
  label: string;
  blockId: string;
  enabled: boolean;
}

export interface EditorSchema {
  blocks: EditorBlock[];
  fields: EditorField[];
}

export interface RibBankConfig {
  slug: string;
  bankName: string;
  bankLogo: string;
  bankLogoClass?: string;
  headerBg?: string;
  defaultValues: Record<string, string>;
  ibanPrefix?: string;
  computeIban?: boolean;
  customSections?: { title: string; icon?: string; fields: NormalField[] }[];
}
