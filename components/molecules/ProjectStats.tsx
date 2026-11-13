import { Icon } from "@/components/atoms/Icon";
import { ProgressBar } from "@/components/atoms/ProgressBar";
import { Link } from "@/components/atoms/Link";
import { Tag } from "@/components/atoms/Tag";
import { STATUS_TONES, TBD, formatCOP, participantsText, periodText } from "@/lib/projects";
import type { Project } from "@/lib/types";

type ProjectStatsProps = { project: Project; withTags?: boolean };

export function ProjectStats({ project, withTags = false }: ProjectStatsProps) {
  const { status, categories, commission, progress, start, end, budget, partners, location, participants } =
    project;
  const funded = budget.total > 0;
  const rows = [
    { icon: "pin", label: "Ubicación", text: location || TBD },
    { icon: "calendar", label: "Período", text: periodText(status.slug, start, end) },
    { icon: "users", label: "Participantes", text: participantsText(participants) },
  ] as const;
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
      {withTags && commission && (
        <p className="text-sm text-muted">
          Responsable:{" "}
          <Link href={`/comisiones/${commission.slug}/`} className="font-semibold text-brand underline underline-offset-4">
            {commission.name}
          </Link>
        </p>
      )}
      <ProgressBar value={progress} />
      <div className="flex flex-col gap-2 rounded-xl border border-line bg-paper p-4 text-sm">
        <p className="flex items-center gap-2 font-semibold">
          <Icon name="coins" className="size-4" />
          Presupuesto
        </p>
        <dl className="flex flex-col gap-2">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Total</dt>
            <dd className="font-semibold">{funded ? formatCOP(budget.total) : TBD}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Ejecutado</dt>
            <dd className={`font-semibold ${funded ? "text-leaf-deep" : ""}`.trim()}>
              {funded ? formatCOP(budget.executed) : TBD}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-line pt-2">
            <dt className="text-muted">Fuentes</dt>
            <dd className="text-right">{partners || TBD}</dd>
          </div>
        </dl>
      </div>
      <ul className="flex flex-col gap-2 text-sm text-muted">
        {rows.map(({ icon, label, text }) => (
          <li key={icon} className="flex items-center gap-2">
            <Icon name={icon} className="size-4 shrink-0" />
            <span className="sr-only">{label}: </span>
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}
