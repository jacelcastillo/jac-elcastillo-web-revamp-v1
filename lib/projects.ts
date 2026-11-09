import { isRecord, toPhoto } from "./board.ts";
import { clean, isSlug } from "./html.ts";
import { optimizeImages } from "./images.ts";
import type { Category, Project, ProjectsPage } from "./types.ts";

export const STATUS_TONES: Record<string, "leaf" | "sun" | "blue" | "muted"> = {
  planificacion: "sun",
  progreso: "blue",
  completado: "leaf",
  suspendido: "muted",
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;

const str = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const count = (value: unknown, max = Number.MAX_SAFE_INTEGER) =>
  typeof value === "number" && Number.isInteger(value) && value > 0 ? Math.min(value, max) : 0;

const date = (value: unknown) => (DATE.test(str(value)) ? str(value) : "");

function toCategory(raw: unknown, slugKey: string, nameKey: string): Category[] {
  if (!isRecord(raw)) return [];
  const slug = raw[slugKey];
  const name = str(raw[nameKey]);
  return typeof slug === "string" && isSlug(slug) && name ? [{ slug, name }] : [];
}

function toProject(raw: unknown, statuses: Category[]): Project[] {
  if (!isRecord(raw) || typeof raw.slug !== "string" || !isSlug(raw.slug)) return [];
  const title = str(raw.titulo);
  const status = statuses.find((s) => s.slug === raw.estado);
  if (!title || !status) return [];
  const budget = isRecord(raw.presupuesto) ? raw.presupuesto : {};
  const image = toPhoto(raw.imagen);
  return [
    {
      slug: raw.slug,
      title,
      summary: str(raw.resumen),
      status,
      progress: count(raw.avance, 100),
      start: date(raw.inicio),
      end: date(raw.fin),
      budget: { total: count(budget.total), executed: count(budget.ejecutado) },
      partners: str(raw.aliados).replace(/\s+/g, " "),
      categories: Array.isArray(raw.categorias)
        ? raw.categorias.flatMap((c) => toCategory(c, "slug", "nombre"))
        : [],
      ...(image && { image }),
      html: optimizeImages(clean(str(raw.contenido), title)),
    },
  ];
}

export function toProjectsPage(json: unknown): ProjectsPage {
  if (!isRecord(json)) return { statuses: [], projects: [] };
  const statuses = Array.isArray(json.estados)
    ? json.estados.flatMap((s) => toCategory(s, "valor", "nombre"))
    : [];
  const projects = Array.isArray(json.proyectos)
    ? json.proyectos.flatMap((p) => toProject(p, statuses))
    : [];
  return { statuses, projects };
}

export const filterProjects = (
  projects: Project[],
  { categoria, estado }: { categoria?: string; estado?: string },
) =>
  projects.filter(
    (p) =>
      (!estado || p.status.slug === estado) &&
      (!categoria || p.categories.some((c) => c.slug === categoria)),
  );

export function categoriesOf(projects: Project[]): Category[] {
  const bySlug = new Map(projects.flatMap((p) => p.categories).map((c) => [c.slug, c]));
  return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name, "es"));
}

const money = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export const formatCOP = (value: number) => money.format(value);

const monthYear = new Intl.DateTimeFormat("es-CO", {
  month: "short",
  year: "numeric",
  timeZone: "America/Bogota",
});

function month(value: string) {
  const parts = monthYear.formatToParts(new Date(`${value}T12:00:00Z`));
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${part("month")} ${part("year")}`;
}

export function dateRange(start?: string, end?: string): string {
  if (start && end) return `${month(start)} a ${month(end)}`;
  if (start) return `Desde ${month(start)}`;
  if (end) return `Hasta ${month(end)}`;
  return "";
}
