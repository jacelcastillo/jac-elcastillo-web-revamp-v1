import { buttonClass } from "@/components/atoms/Button";
import { DateText } from "@/components/atoms/DateText";
import { Heading } from "@/components/atoms/Heading";
import { Tag } from "@/components/atoms/Tag";
import { formatSize } from "@/lib/transparency";
import type { PublicDocument } from "@/lib/types";

type DocumentItemProps = { document: PublicDocument };

export function DocumentItem({ document }: DocumentItemProps) {
  const { title, type, date, url, format, size } = document;
  const file = [format, formatSize(size)].filter(Boolean).join(" · ");
  return (
    <li className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-white p-4">
      <div className="min-w-0">
        <Heading level={3} size="sm">
          {title}
        </Heading>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          <Tag tone="blue">{type.name}</Tag>
          {date && <DateText iso={`${date}T12:00:00-05:00`} />}
          {file && <span>{file}</span>}
        </p>
      </div>
      <a href={url} aria-label={`Descargar ${title}`} className={buttonClass("secondary")}>
        Descargar
      </a>
    </li>
  );
}
