import { Heading } from "@/components/atoms/Heading";
import { ProgressBar } from "@/components/atoms/ProgressBar";
import { budgetGroups, budgetTotals, percent } from "@/lib/transparency";
import { formatCOP } from "@/lib/projects";
import type { BudgetKind, FiscalYear } from "@/lib/types";

const KINDS: { kind: BudgetKind; title: string }[] = [
  { kind: "ingreso", title: "Ingresos" },
  { kind: "egreso", title: "Egresos" },
];

const amount = (executed: number, budgeted: number, hasExecution: boolean) => {
  if (!hasExecution) return formatCOP(budgeted);
  return budgeted > 0 ? `${formatCOP(executed)} de ${formatCOP(budgeted)}` : formatCOP(executed);
};

type BudgetTableProps = { year: FiscalYear };

export function BudgetTable({ year }: BudgetTableProps) {
  const { items, note } = year;
  const hasExecution = items.some((i) => i.executed > 0);
  const cards = KINDS.map(({ kind, title }) => ({
    title,
    groups: budgetGroups(items, kind),
    totals: budgetTotals(items, kind),
  })).filter((card) => card.groups.length > 0);
  return (
    <section>
      <Heading level={2} className="mb-6">
        Presupuesto {year.year}
      </Heading>
      {cards.length === 0 ? (
        <p className="text-muted">
          El presupuesto de {year.year} aún no está aprobado por la asamblea general (estatutos, art. 140).
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {cards.map(({ title, groups, totals }) => {
            const done = percent(totals.executed, totals.budgeted);
            return (
              <article key={title} className="rounded-2xl border border-line bg-white p-5">
                <Heading level={3} size="md">
                  {title}
                </Heading>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-muted">Presupuestado</dt>
                    <dd className="font-semibold tabular-nums">
                      {totals.budgeted > 0 ? formatCOP(totals.budgeted) : "Sin presupuesto"}
                    </dd>
                  </div>
                  {hasExecution && (
                    <div>
                      <dt className="text-muted">Ejecutado</dt>
                      <dd className="font-semibold tabular-nums text-leaf-deep">{formatCOP(totals.executed)}</dd>
                    </div>
                  )}
                  {hasExecution && done !== null && (
                    <div>
                      <dt className="text-muted">Ejecución</dt>
                      <dd className="font-semibold tabular-nums">{done}%</dd>
                    </div>
                  )}
                </dl>
                <div className="mt-6 flex flex-col gap-6">
                  {groups.map((group) => (
                    <div key={group.group}>
                      <div className="flex items-baseline justify-between gap-4 border-b border-line pb-2">
                        <Heading level={4} size="sm">
                          {group.group}
                        </Heading>
                        <p className="text-sm font-semibold tabular-nums text-muted">
                          {amount(group.executed, group.budgeted, hasExecution)}
                        </p>
                      </div>
                      <ul className="mt-3 flex flex-col gap-4">
                        {group.items.map((item) => {
                          const share = percent(item.executed, item.budgeted);
                          return (
                            <li key={item.name} className="flex flex-col gap-1.5">
                              <div className="flex justify-between gap-4 text-sm">
                                <span>{item.name}</span>
                                <span className="shrink-0 tabular-nums text-muted">
                                  {amount(item.executed, item.budgeted, hasExecution)}
                                </span>
                              </div>
                              {hasExecution && share !== null && (
                                <ProgressBar
                                  label="Ejecutado"
                                  aria-label={`Ejecutado de ${item.name}`}
                                  value={Math.min(share, 100)}
                                />
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
      {note && <p className="mt-6 text-sm text-muted">{note}</p>}
    </section>
  );
}
