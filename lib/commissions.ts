import { isRecord, str, toCategory } from "./board.ts";
import { clean, isSlug } from "./html.ts";
import { optimizeImages } from "./images.ts";
import type { Category, Commission, CommissionsPage, Summary } from "./types.ts";

export const COMMISSION_TONES: Record<string, "leaf" | "sun" | "blue" | "muted"> = {
  activa: "leaf",
  "sin-coordinacion": "sun",
  conformacion: "blue",
  verificar: "muted",
};

export const UNVERIFIED = "Por verificar";

function toCommission(raw: unknown, types: Category[], statuses: Category[]): Commission[] {
  if (!isRecord(raw) || typeof raw.slug !== "string" || !isSlug(raw.slug)) return [];
  const name = str(raw.nombre);
  const type = types.find((t) => t.slug === raw.tipo);
  const status = statuses.find((s) => s.slug === raw.estado);
  if (!name || !type || !status) return [];
  return [
    {
      slug: raw.slug,
      name,
      shortName: str(raw.nombre_corto) || name,
      type,
      status,
      basis: str(raw.fundamento),
      summary: str(raw.resumen),
      html: optimizeImages(clean(str(raw.contenido), name)),
    },
  ];
}

export function toCommissionsPage(json: unknown): CommissionsPage {
  if (!isRecord(json)) return { types: [], statuses: [], commissions: [] };
  const list = (raw: unknown) =>
    Array.isArray(raw) ? raw.flatMap((o) => toCategory(o, "valor", "nombre")) : [];
  const types = list(json.tipos);
  const statuses = list(json.estados);
  const commissions = Array.isArray(json.comisiones)
    ? json.comisiones.flatMap((c) => toCommission(c, types, statuses))
    : [];
  return { types, statuses, commissions };
}

export function commissionSections({
  types,
  commissions,
}: CommissionsPage): { title: string; items: Summary[] }[] {
  return types.flatMap((type) => {
    const items = commissions
      .filter((c) => c.type.slug === type.slug)
      .map((c) => ({
        href: `/comisiones/${c.slug}/`,
        title: c.shortName,
        excerpt: c.summary,
        category: c.status,
      }));
    return items.length > 0 ? [{ title: type.name, items }] : [];
  });
}
