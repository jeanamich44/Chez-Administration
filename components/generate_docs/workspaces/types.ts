export type RibMode = "normal" | "custom";

export type FieldKind =
  | "text"
  | "date"
  | "time"
  | "textarea"
  | "civilite"
  | "address"
  | "cp"
  | "ville"
  | "cp_ville"
  | "digits"
  | "alnum"
  | "iban"
  | "bic"
  | "upper";

export type AutoIbanPart = "banque" | "guichet" | "compte" | "cle";

export type NormalField = {
  key: string;
  label: string;
  kind: FieldKind;
  section: string;
  span?: 1 | 2 | 4;
  min?: number;
  max?: number;
  rec?: number;
  required?: boolean;
  placeholder?: string;
  autoIban?: AutoIbanPart;
  options?: (string | { label: string; value: string })[];
};

export type RibBankConfig = {
  slug: string;
  title: string;
  subtitle: string;
  logo: string;
  logoAlt: string;
  logoClass: string;
  headerBg: string;
  pdfName: string;
  previewName: string;
  composeIban?: boolean;
  defaults?: Record<string, string>;
  fields?: NormalField[];
};

export type EditorField = {
  id: string;
  label: string;
  section: "header" | "middle" | "footer" | string;
  min: number;
  max: number;
  charset: string;
  widget: "input" | "textarea";
  identity: boolean;
};

export type EditorBlock = {
  id: string;
  label: string;
  section: "header" | "middle" | "footer" | string;
  master: boolean;
};

export type EditorSchema = {
  bank: string;
  sections: { id: string; label: string }[];
  fields: EditorField[];
  blocks: EditorBlock[];
  defaults: Record<string, string>;
  visible: Record<string, boolean>;
};
