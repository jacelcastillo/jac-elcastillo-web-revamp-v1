export type SafeHtml = string & { readonly __brand: "SafeHtml" };
export type Img = { src: string; alt: string; width: number; height: number };
export type BoardMember = { name: string; role: string; detail: string; photo?: Img };
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
  partners: string;
  categories: Category[];
  image?: Img;
  html: SafeHtml;
};
export type ProjectsPage = { statuses: Category[]; projects: Project[] };
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
