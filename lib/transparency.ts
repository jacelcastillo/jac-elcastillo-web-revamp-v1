import { date, isRecord, str, toCategory } from "./board.ts";
import { UPLOADS } from "./images.ts";
import { count } from "./projects.ts";
import type {
  BudgetItem,
  BudgetKind,
  FiscalYear,
  MonthTotal,
  PublicDocument,
  TransparencyPage,
} from "./types.ts";

export const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

export const monthShort = (month: number) => MONTHS[month - 1].slice(0, 3);

const KINDS: BudgetKind[] = ["ingreso", "egreso"];

function toDocument(raw: unknown, page: Pick<TransparencyPage, "types">): PublicDocument[] {
  if (!isRecord(raw) || typeof raw.url !== "string" || !raw.url.startsWith(UPLOADS)) return [];
  const title = str(raw.titulo);
  const type = page.types.find((t) => t.slug === raw.tipo);
  if (!Number.isInteger(raw.id) || !title || !type) return [];
  return [
    {
      id: raw.id as number,
      title,
      type,
      date: date(raw.fecha),
      url: raw.url,
      format: str(raw.formato).slice(0, 5),
      size: count(raw.tamano),
    },
  ];
}

function toItem(raw: unknown): BudgetItem[] {
  if (!isRecord(raw) || !KINDS.includes(raw.clase as BudgetKind)) return [];
  const group = str(raw.grupo);
  const name = str(raw.nombre);
  if (!group || !name) return [];
  return [
    {
      kind: raw.clase as BudgetKind,
      group,
      name,
      budgeted: count(raw.presupuestado),
      executed: count(raw.ejecutado),
    },
  ];
}

function toMonth(raw: unknown): MonthTotal[] {
  if (!isRecord(raw) || typeof raw.mes !== "number" || !Number.isInteger(raw.mes)) return [];
  if (raw.mes < 1 || raw.mes > 12) return [];
  return [{ month: raw.mes, income: count(raw.ingresos), expense: count(raw.egresos) }];
}

function toYear(raw: unknown): FiscalYear[] {
  if (!isRecord(raw) || typeof raw.anio !== "number" || !Number.isInteger(raw.anio)) return [];
  if (raw.anio < 2000 || raw.anio > 2100) return [];
  return [
    {
      year: raw.anio,
      note: str(raw.nota),
      items: Array.isArray(raw.rubros) ? raw.rubros.flatMap(toItem) : [],
      months: Array.isArray(raw.meses)
        ? raw.meses.flatMap(toMonth).sort((a, b) => a.month - b.month)
        : [],
    },
  ];
}

export function toTransparencyPage(json: unknown): TransparencyPage {
  if (!isRecord(json)) return { types: [], documents: [], years: [] };
  const types = Array.isArray(json.tipos)
    ? json.tipos.flatMap((t) => toCategory(t, "valor", "nombre"))
    : [];
  return {
    types,
    documents: Array.isArray(json.documentos)
      ? json.documentos.flatMap((d) => toDocument(d, { types }))
      : [],
    years: Array.isArray(json.vigencias)
      ? json.vigencias.flatMap(toYear).sort((a, b) => b.year - a.year)
      : [],
  };
}

const sum = <T>(list: T[], pick: (item: T) => number) => list.reduce((n, item) => n + pick(item), 0);

export function executed(year: FiscalYear): { income: number; expense: number; label: string } | null {
  const { months, items } = year;
  if (months.length > 0) {
    const first = monthShort(months[0].month);
    const last = monthShort(months[months.length - 1].month);
    return {
      income: sum(months, (m) => m.income),
      expense: sum(months, (m) => m.expense),
      label: `${year.year}, ${first === last ? first : `${first} a ${last}`}`,
    };
  }
  const income = sum(items.filter((i) => i.kind === "ingreso"), (i) => i.executed);
  const expense = sum(items.filter((i) => i.kind === "egreso"), (i) => i.executed);
  return income + expense > 0 ? { income, expense, label: String(year.year) } : null;
}

export type BudgetGroup = { group: string; budgeted: number; executed: number; items: BudgetItem[] };

export function budgetGroups(items: BudgetItem[], kind: BudgetKind): BudgetGroup[] {
  const groups = new Map<string, BudgetItem[]>();
  for (const item of items) {
    if (item.kind !== kind || item.budgeted + item.executed === 0) continue;
    groups.set(item.group, [...(groups.get(item.group) ?? []), item]);
  }
  return [...groups].map(([group, list]) => ({
    group,
    budgeted: sum(list, (i) => i.budgeted),
    executed: sum(list, (i) => i.executed),
    items: list,
  }));
}

export function budgetTotals(items: BudgetItem[], kind: BudgetKind) {
  const own = items.filter((i) => i.kind === kind);
  return { budgeted: sum(own, (i) => i.budgeted), executed: sum(own, (i) => i.executed) };
}

export const percent = (executedValue: number, budgeted: number) =>
  budgeted > 0 ? Math.round((executedValue / budgeted) * 100) : null;

const decimal = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 });

export function formatSize(bytes: number): string {
  if (bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${decimal.format(bytes / (1024 * 1024))} MB`;
}

export const filterDocuments = (documents: PublicDocument[], tipo?: string) =>
  tipo ? documents.filter((d) => d.type.slug === tipo) : documents;
