import { isSlug } from "./html.ts";

type Params = Record<string, string | string[] | undefined>;

const isSlugParam = (value: string | string[] | undefined): value is string | undefined =>
  value === undefined || (typeof value === "string" && isSlug(value));

export function parseListingQuery(
  params: Params,
): { page: number; categoria?: string } | null {
  const { page, categoria } = params;
  if (page !== undefined && (typeof page !== "string" || !/^[1-9]\d{0,2}$/.test(page))) {
    return null;
  }
  if (!isSlugParam(categoria)) return null;
  return { page: page === undefined ? 1 : Number(page), categoria };
}

export function parseProjectQuery(
  params: Params,
): { categoria?: string; estado?: string } | null {
  const { categoria, estado } = params;
  if (!isSlugParam(categoria) || !isSlugParam(estado)) return null;
  return { categoria, estado };
}

export function parseTransparencyQuery(
  params: Params,
): { anio?: number; tipo?: string } | null {
  const { anio, tipo } = params;
  if (anio !== undefined && (typeof anio !== "string" || !/^\d{4}$/.test(anio))) return null;
  if (!isSlugParam(tipo)) return null;
  return { anio: anio === undefined ? undefined : Number(anio), tipo };
}

export function listingHref(
  base: string,
  {
    page,
    categoria,
    estado,
    anio,
    tipo,
  }: { page?: number; categoria?: string; estado?: string; anio?: number; tipo?: string },
): string {
  const query = new URLSearchParams();
  if (categoria) query.set("categoria", categoria);
  if (estado) query.set("estado", estado);
  if (anio) query.set("anio", String(anio));
  if (tipo) query.set("tipo", tipo);
  if (page && page > 1) query.set("page", String(page));
  const qs = query.toString();
  return qs ? `${base}?${qs}` : base;
}
