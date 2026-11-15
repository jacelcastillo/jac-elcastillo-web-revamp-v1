import { Heading } from "@/components/atoms/Heading";
import { Stat } from "@/components/molecules/Stat";
import { formatCOP } from "@/lib/projects";
import { balances, MONTHS, monthShort } from "@/lib/transparency";
import type { FiscalYear } from "@/lib/types";

const cell = "px-4 py-3 text-right tabular-nums";
const NO_DATA = "Sin dato";

type MonthlyChartProps = { year: FiscalYear };

export function MonthlyChart({ year }: MonthlyChartProps) {
  const { months } = year;
  if (months.length === 0) return null;
  const closing = balances(year);
  const hasContributions = months.some((m) => m.contributions !== undefined);
  const peak = Math.max(...months.flatMap((m) => [m.income, m.expense]), ...(closing ?? []), 1);
  const share = (value: number) => `${(value / peak) * 100}%`;
  const line = closing
    ?.map((balance, i) => `${((i + 0.5) / months.length) * 100},${100 - (Math.max(balance, 0) / peak) * 100}`)
    .join(" ");
  const lastMonth = MONTHS[months[months.length - 1].month - 1];
  return (
    <section>
      <Heading level={2} className="mb-6">
        Ingresos y egresos por mes
      </Heading>
      {closing && (
        <div className="mb-6 max-w-xs">
          <Stat value={formatCOP(closing[closing.length - 1])} label={`Saldo a ${lastMonth} de ${year.year}`} />
        </div>
      )}
      <div className="rounded-2xl border border-line bg-white p-5">
        <div aria-hidden="true">
          <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
            <span className="flex items-center gap-2">
              <span className="size-3 rounded-sm bg-leaf-deep" />
              Ingresos
            </span>
            <span className="flex items-center gap-2">
              <span className="size-3 rounded-sm bg-flag-red" />
              Egresos
            </span>
            {closing && (
              <span className="flex items-center gap-2">
                <span className="h-0.5 w-3 bg-brand" />
                Saldo al cierre
              </span>
            )}
          </div>
          <div className="relative h-48">
            <div className="flex h-full">
              {months.map((m) => (
                <div key={m.month} className="flex min-w-0 flex-1 items-end justify-center gap-1 px-1.5">
                  <div className="w-1/3 max-w-10 rounded-t-sm bg-leaf-deep" style={{ height: share(m.income) }} />
                  <div className="w-1/3 max-w-10 rounded-t-sm bg-flag-red" style={{ height: share(m.expense) }} />
                </div>
              ))}
            </div>
            {line && (
              <svg className="absolute inset-0 size-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polyline points={line} fill="none" className="stroke-brand" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              </svg>
            )}
          </div>
          <div className="mt-2 flex">
            {months.map((m) => (
              <span key={m.month} className="min-w-0 flex-1 text-center text-sm text-muted">
                {monthShort(m.month)}
              </span>
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
                {hasContributions && (
                  <th scope="col" className={`${cell} font-semibold`}>
                    Aportes
                  </th>
                )}
                {closing && (
                  <th scope="col" className={`${cell} font-semibold`}>
                    Saldo
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {months.map((m, i) => (
                <tr key={m.month} className="border-b border-line">
                  <th scope="row" className="px-4 py-3 text-left font-normal capitalize">
                    {MONTHS[m.month - 1]}
                  </th>
                  <td className={cell}>{formatCOP(m.income)}</td>
                  <td className={cell}>{formatCOP(m.expense)}</td>
                  {hasContributions && (
                    <td className={cell}>{m.contributions === undefined ? NO_DATA : formatCOP(m.contributions)}</td>
                  )}
                  {closing && <td className={cell}>{formatCOP(closing[i])}</td>}
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
                {hasContributions && (
                  <td className={cell}>{formatCOP(months.reduce((n, m) => n + (m.contributions ?? 0), 0))}</td>
                )}
                {closing && <td className={cell} />}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
}
