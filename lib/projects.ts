import { date, isRecord, month, str, toCategory, toPhoto } from "./board.ts";
import { clean, isSlug } from "./html.ts";
import { optimizeImages } from "./images.ts";
import type { Category, Project, ProjectsPage } from "./types.ts";

export const STATUS_TONES: Record<string, "leaf" | "sun" | "blue" | "muted"> = {
  planificacion: "sun",
  progreso: "blue",
  completado: "leaf",
  suspendido: "muted",
};

const count = (value: unknown, max = Number.MAX_SAFE_INTEGER) =>
  typeof value === "number" && Number.isInteger(value) && value > 0 ? Math.min(value, max) : 0;

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
      location: str(raw.ubicacion),
      participants: count(raw.participantes, 1_000_000),
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

export function periodText(status: string, start?: string, end?: string): string {
  switch (status) {
    case "planificacion":
      return start ? `Inicia ${month(start)}` : "Inicio por definir";
    case "progreso":
      if (end) return `En curso hasta ${month(end)}`;
      return start ? `En curso desde ${month(start)}` : "En curso";
    case "completado":
      return end ? `Completado ${month(end)}` : "Completado";
    case "suspendido":
      return start ? `Suspendido (inició ${month(start)})` : "Suspendido";
    default:
      return "";
  }
}

export const TBD = "Por definir";

export function participantsText(n: number): string {
  if (n <= 0) return TBD;
  return n === 1 ? "1 participante" : `${n} participantes`;
}
