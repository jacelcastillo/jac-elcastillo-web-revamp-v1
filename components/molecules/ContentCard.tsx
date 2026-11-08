import Image from "next/image";
import { Link } from "@/components/atoms/Link";
import { DateText } from "@/components/atoms/DateText";
import { Heading } from "@/components/atoms/Heading";
import { Tag } from "@/components/atoms/Tag";
import { Tiles } from "@/components/atoms/Tiles";
import type { Summary } from "@/lib/types";

type ContentCardProps = { item: Summary };

export function ContentCard({ item }: ContentCardProps) {
  const { image, category, date } = item;
  return (
    <article className="relative flex w-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-lg">
      <div className="relative aspect-[16/10] bg-paper">
        {image ? (
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <Tiles size="sm" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {category && <Tag>{category.name}</Tag>}
          {date && <DateText iso={date} className="text-sm text-muted" />}
        </div>
        <Heading level={2} size="sm">
          <Link href={item.href} className="after:absolute after:inset-0">
            {item.title}
          </Link>
        </Heading>
        <p className="line-clamp-3 text-muted">{item.excerpt}</p>
      </div>
    </article>
  );
}
