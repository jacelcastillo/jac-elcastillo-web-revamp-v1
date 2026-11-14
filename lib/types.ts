export type SafeHtml = string & { readonly __brand: "SafeHtml" };
export type Img = { src: string; alt: string; width: number; height: number };
export type BoardMember = {
  name: string;
  role: string;
  detail: string;
  photo?: Img;
  group?: string;
  commission?: string;
  note?: string;
};
export type BoardTerm = { term: string; members: BoardMember[] };
export type Category = { slug: string; name: string };
export type Summary = {
  href: string;
  title: string;
  excerpt: string;
  date?: string;
  image?: Img;
  category?: Category;
};
export type Entry = Summary & {
  kind: "post" | "page";
  html: SafeHtml;
  children?: Summary[];
};
export type Project = {
  slug: string;
  title: string;
  summary: string;
  status: Category;
  progress: number;
  start: string;
  end: string;
  budget: { total: number; executed: number };
  location: string;
  participants: number;
  partners: string;
  categories: Category[];
  commission?: Category;
  image?: Img;
  html: SafeHtml;
};
export type ProjectsPage = { statuses: Category[]; projects: Project[] };
export type Commission = {
  slug: string;
  name: string;
  shortName: string;
  type: Category;
  status: Category;
  basis: string;
  summary: string;
  html: SafeHtml;
};
export type CommissionsPage = { types: Category[]; statuses: Category[]; commissions: Commission[] };
export type PublicDocument = {
  id: number;
  title: string;
  type: Category;
  date: string;
  url: string;
  format: string;
  size: number;
};
export type BudgetKind = "ingreso" | "egreso";
export type BudgetItem = { kind: BudgetKind; group: string; name: string; budgeted: number; executed: number };
export type MonthTotal = { month: number; income: number; expense: number };
export type FiscalYear = { year: number; note: string; items: BudgetItem[]; months: MonthTotal[] };
export type TransparencyPage = { types: Category[]; documents: PublicDocument[]; years: FiscalYear[] };
export type NavItem = { label: string; href: string };
export type NavGroup = { label: string; items: NavItem[] };
export type NavEntry = NavItem | NavGroup;
export type ContactLink = {
  icon: "mail" | "phone" | "whatsapp" | "clock";
  label: string;
  value: string;
  href?: string;
  external?: boolean;
};
