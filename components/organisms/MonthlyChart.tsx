import { Heading } from "@/components/atoms/Heading";
import { formatCOP } from "@/lib/projects";
import { MONTHS, monthShort } from "@/lib/transparency";
import type { FiscalYear } from "@/lib/types";

const cell = "px-4 py-3 text-right tabular-nums";

type MonthlyChartProps = { year: FiscalYear };

export function MonthlyChart({ year }: MonthlyChartProps) {
  const { months } = year;
  if (months.length === 0) return null;
  const peak = Math.max(...months.flatMap((m) => [m.income, m.expense]), 1);
  const share = (value: number) => `${(value / peak) * 100}%`;
  return (
    <section>
      <Heading level={2} className="mb-6">
        Ingresos y egresos por mes
      </Heading>
      <div className="rounded-2xl border border-line bg-white p-5">
        <div aria-hidden="true">
          <div className="mb-4 flex gap-4 text-sm text-muted">
            <span className="flex items-center gap-2">
              <span className="size-3 rounded-sm bg-leaf-deep" />
              Ingresos
            </span>
            <span className="flex items-center gap-2">
              <span className="size-3 rounded-sm bg-flag-red" />
              Egresos
            </span>
          </div>
          <div className="flex h-48 gap-3">
            {months.map((m) => (
              <div key={m.month} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end justify-center gap-1">
                  <div className="w-1/3 max-w-10 rounded-t-sm bg-leaf-deep" style={{ height: share(m.income) }} />
                  <div className="w-1/3 max-w-10 rounded-t-sm bg-flag-red" style={{ height: share(m.expense) }} />
                </div>
                <span className="text-sm text-muted">{monthShort(m.month)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Ingresos y egresos por mes de {year.year}</caption>
            <thead>
              <tr className="border-b border-line text-muted">
                <th scope="col" className="px-4 py-3 text-left font-semibold">
                  Mes
                </th>
                <th scope="col" className={`${cell} font-semibold`}>
                  Ingresos
                </th>
                <th scope="col" className={`${cell} font-semibold`}>
                  Egresos
                </th>
              </tr>
            </thead>
            <tbody>
              {months.map((m) => (
                <tr key={m.month} className="border-b border-line">
                  <th scope="row" className="px-4 py-3 text-left font-normal capitalize">
                    {MONTHS[m.month - 1]}
                  </th>
                  <td className={cell}>{formatCOP(m.income)}</td>
                  <td className={cell}>{formatCOP(m.expense)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <th scope="row" className="px-4 py-3 text-left">
                  Total
                </th>
                <td className={cell}>{formatCOP(months.reduce((n, m) => n + m.income, 0))}</td>
                <td className={cell}>{formatCOP(months.reduce((n, m) => n + m.expense, 0))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
}
