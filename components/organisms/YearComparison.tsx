import { Heading } from "@/components/atoms/Heading";
import { formatCOP } from "@/lib/projects";
import { yearComparison } from "@/lib/transparency";
import type { FiscalYear } from "@/lib/types";

const cell = "px-4 py-3 text-right tabular-nums";
const NO_DATA = "Sin datos";

const TONES = {
  budgetedIncome: "bg-leaf-deep/30",
  income: "bg-leaf-deep",
  budgetedExpense: "bg-flag-red/30",
  expense: "bg-flag-red",
};

const LEGEND: [string, string][] = [
  ["Ingresos presupuestados", TONES.budgetedIncome],
  ["Ingresos ejecutados", TONES.income],
  ["Egresos presupuestados", TONES.budgetedExpense],
  ["Egresos ejecutados", TONES.expense],
];

type YearComparisonProps = { years: FiscalYear[] };

export function YearComparison({ years }: YearComparisonProps) {
  const rows = yearComparison(years);
  if (rows.length === 0) return null;
  const peak = Math.max(
    ...rows.flatMap((r) => [r.budgeted.income, r.budgeted.expense, r.executed?.income ?? 0, r.executed?.expense ?? 0]),
    1,
  );
  const width = (value: number) => ({ width: `${(value / peak) * 100}%`, minWidth: value > 0 ? 2 : 0 });
  const bar = (value: number, tone: string) => (
    <div className={`h-2 rounded-sm ${tone}`} style={width(value)} />
  );
  return (
    <section>
      <Heading level={2} className="mb-6">
        Comparación entre vigencias
      </Heading>
      <div className="rounded-2xl border border-line bg-white p-5">
        <div aria-hidden="true">
          <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
            {LEGEND.map(([label, tone]) => (
              <span key={label} className="flex items-center gap-2">
                <span className={`size-3 rounded-sm ${tone}`} />
                {label}
              </span>
            ))}
          </div>
          <ul className="flex flex-col gap-5">
            {rows.map((r) => (
              <li key={r.year} className="flex flex-col gap-2">
                <span className="text-sm font-semibold">{r.label}</span>
                <div className="flex flex-col gap-1">
                  {bar(r.budgeted.income, TONES.budgetedIncome)}
                  {bar(r.executed?.income ?? 0, TONES.income)}
                </div>
                <div className="flex flex-col gap-1">
                  {bar(r.budgeted.expense, TONES.budgetedExpense)}
                  {bar(r.executed?.expense ?? 0, TONES.expense)}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Ingresos y egresos presupuestados y ejecutados por vigencia</caption>
            <thead>
              <tr className="border-b border-line text-muted">
                <th scope="col" className="px-4 py-3 text-left font-semibold">
                  Vigencia
                </th>
                {["Ingresos presupuestados", "Ingresos ejecutados", "Egresos presupuestados", "Egresos ejecutados"].map(
                  (title) => (
                    <th key={title} scope="col" className={`${cell} font-semibold`}>
                      {title}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.year} className="border-b border-line">
                  <th scope="row" className="px-4 py-3 text-left font-normal">
                    {r.label}
                  </th>
                  <td className={cell}>{formatCOP(r.budgeted.income)}</td>
                  <td className={cell}>{r.executed ? formatCOP(r.executed.income) : NO_DATA}</td>
                  <td className={cell}>{formatCOP(r.budgeted.expense)}</td>
                  <td className={cell}>{r.executed ? formatCOP(r.executed.expense) : NO_DATA}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
