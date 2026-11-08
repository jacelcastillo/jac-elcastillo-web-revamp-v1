import { UPLOADS } from "./images.ts";
import type { BoardMember, BoardTerm, Img } from "./types.ts";

const TERM = /^\d{4}-\d{4}$/;

export const isTerm = (slug: string) => TERM.test(slug);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isSize = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

function toPhoto(raw: unknown): Img | undefined {
  if (!isRecord(raw)) return undefined;
  const { url, ancho, alto } = raw;
  if (typeof url !== "string" || !url.startsWith(UPLOADS)) return undefined;
  if (!isSize(ancho) || !isSize(alto)) return undefined;
  return { src: url, alt: "", width: ancho, height: alto };
}

function toMember(raw: unknown): BoardMember | null {
  if (!isRecord(raw)) return null;
  const { nombre, cargo_nombre, detalle, foto } = raw;
  if (typeof nombre !== "string" || !nombre.trim()) return null;
  if (typeof cargo_nombre !== "string") return null;
  const photo = toPhoto(foto);
  return {
    name: nombre.trim(),
    role: cargo_nombre.trim(),
    detail: typeof detalle === "string" ? detalle.trim() : "",
    ...(photo && { photo }),
  };
}

export function toBoardTerms(json: unknown): BoardTerm[] {
  if (!isRecord(json) || !Array.isArray(json.periodos)) return [];
  return json.periodos.flatMap((raw): BoardTerm[] => {
    if (!isRecord(raw) || typeof raw.periodo !== "string" || !isTerm(raw.periodo)) return [];
    if (!Array.isArray(raw.dignatarios)) return [];
    const members = raw.dignatarios.map(toMember).filter((m): m is BoardMember => m !== null);
    return [{ term: raw.periodo, members }];
  });
}
