import { isSlug } from "./html.ts";
import { UPLOADS } from "./images.ts";
import type { BoardMember, BoardTerm, Category, Img } from "./types.ts";

const TERM = /^\d{4}-\d{4}$/;

export const isTerm = (slug: string) => TERM.test(slug);

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const str = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export const date = (value: unknown) => (DATE.test(str(value)) ? str(value) : "");

const monthYear = new Intl.DateTimeFormat("es-CO", {
  month: "short",
  year: "numeric",
  timeZone: "America/Bogota",
});

export function month(value: string) {
  const parts = monthYear.formatToParts(new Date(`${value}T12:00:00Z`));
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${part("month")} ${part("year")}`;
}

export function toCategory(raw: unknown, slugKey: string, nameKey: string): Category[] {
  if (!isRecord(raw)) return [];
  const slug = raw[slugKey];
  const name = str(raw[nameKey]);
  return typeof slug === "string" && isSlug(slug) && name ? [{ slug, name }] : [];
}

const isSize = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

export function toPhoto(raw: unknown): Img | undefined {
  if (!isRecord(raw)) return undefined;
  const { url, ancho, alto } = raw;
  if (typeof url !== "string" || !url.startsWith(UPLOADS)) return undefined;
  if (!isSize(ancho) || !isSize(alto)) return undefined;
  return { src: url, alt: "", width: ancho, height: alto };
}

function toMember(raw: unknown): BoardMember | null {
  if (!isRecord(raw)) return null;
  const { nombre, cargo_nombre, detalle, foto, grupo, comision, situacion_nombre, desde } = raw;
  if (typeof nombre !== "string" || !nombre.trim()) return null;
  if (typeof cargo_nombre !== "string") return null;
  const photo = toPhoto(foto);
  const group = str(grupo);
  const commission = str(comision);
  const status = str(situacion_nombre);
  const since = date(desde);
  const note = status && since ? `${status}, desde ${month(since)}` : status;
  return {
    name: nombre.trim(),
    role: cargo_nombre.trim(),
    detail: typeof detalle === "string" ? detalle.trim() : "",
    ...(photo && { photo }),
    ...(group && { group }),
    ...(commission && { commission }),
    ...(note && { note }),
  };
}

export function groupMembers(members: BoardMember[]): { label: string; members: BoardMember[] }[] {
  const groups = new Map<string, BoardMember[]>();
  for (const member of members) {
    const label = member.group ?? "";
    groups.set(label, [...(groups.get(label) ?? []), member]);
  }
  return [...groups].map(([label, list]) => ({ label, members: list }));
}

export function commissionTerms(terms: BoardTerm[], slug: string): BoardTerm[] {
  return terms
    .map(({ term, members }) => ({ term, members: members.filter((m) => m.commission === slug) }))
    .filter(({ members }) => members.length > 0);
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
