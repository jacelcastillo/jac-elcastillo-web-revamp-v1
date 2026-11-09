import { ProgressBar } from "@/components/atoms/ProgressBar";
import { Tag } from "@/components/atoms/Tag";
import { STATUS_TONES, dateRange, formatCOP } from "@/lib/projects";
import type { Project } from "@/lib/types";

type ProjectStatsProps = { project: Project; withTags?: boolean };

export function ProjectStats({ project, withTags = false }: ProjectStatsProps) {
  const { status, categories, progress, start, end, budget, partners } = project;
  const dates = dateRange(start, end);
  return (
    <div className="flex flex-col gap-3">
      {withTags && (
        <div className="flex flex-wrap gap-2">
          <Tag tone={STATUS_TONES[status.slug]}>{status.name}</Tag>
          {categories.map((c) => (
            <Tag key={c.slug}>{c.name}</Tag>
          ))}
        </div>
      )}
      <ProgressBar value={progress} />
      {dates && <p className="text-sm text-muted">{dates}</p>}
      {budget.total > 0 ? (
        <dl className="flex flex-col gap-2 rounded-xl border border-line bg-paper p-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Total</dt>
            <dd className="font-semibold">{formatCOP(budget.total)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Ejecutado</dt>
            <dd className="font-semibold text-leaf-deep">{formatCOP(budget.executed)}</dd>
          </div>
          {partners && (
            <div className="border-t border-line pt-2">
              <dt className="text-muted">Fuentes</dt>
              <dd>{partners}</dd>
            </div>
          )}
        </dl>
      ) : (
        partners && <p className="text-sm text-muted">Aliados: {partners}</p>
      )}
    </div>
  );
}
