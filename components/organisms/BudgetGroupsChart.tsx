import { Heading } from "@/components/atoms/Heading";
import { formatCOP } from "@/lib/projects";
import { groupTotals } from "@/lib/transparency";
import type { BudgetItem } from "@/lib/types";

type BudgetGroupsChartProps = { items: BudgetItem[]; hasExecution: boolean };

export function BudgetGroupsChart({ items, hasExecution }: BudgetGroupsChartProps) {
  const groups = groupTotals(items);
  if (groups.length === 0) return null;
  const peak = Math.max(...groups.flatMap((g) => [g.budgeted, g.executed]), 1);
  const width = (value: number) => ({ width: `${(value / peak) * 100}%`, minWidth: value > 0 ? 2 : 0 });
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <Heading level={3} size="md">
        Presupuesto por grupo
      </Heading>
      <ul className="mt-4 flex flex-col gap-5">
        {groups.map((g) => (
          <li key={`${g.kind}-${g.group}`} className="flex flex-col gap-2">
            <div className="flex flex-wrap justify-between gap-x-4 text-sm">
              <span className="font-semibold">{g.group}</span>
              <span className="tabular-nums text-muted">
                Presupuestado {formatCOP(g.budgeted)}
                {hasExecution && ` · Ejecutado ${formatCOP(g.executed)}`}
              </span>
            </div>
            <div aria-hidden="true" className="flex flex-col gap-1">
              <div className="h-2.5 rounded-sm bg-muted/40" style={width(g.budgeted)} />
              {hasExecution && (
                <div
                  className={`h-2.5 rounded-sm ${g.kind === "ingreso" ? "bg-leaf-deep" : "bg-flag-red"}`}
                  style={width(g.executed)}
                />
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
