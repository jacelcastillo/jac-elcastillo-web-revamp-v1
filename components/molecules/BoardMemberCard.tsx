import Image from "next/image";
import { Heading } from "@/components/atoms/Heading";
import { Tiles } from "@/components/atoms/Tiles";
import type { BoardMember } from "@/lib/types";

type BoardMemberCardProps = { member: BoardMember; level?: 3 | 4 };

export function BoardMemberCard({ member, level = 3 }: BoardMemberCardProps) {
  const { photo, name, role, detail, note } = member;
  return (
    <article className="flex w-full flex-col overflow-hidden rounded-2xl border border-line bg-white">
      <div className="relative aspect-square rounded-t-2xl bg-paper">
        {photo ? (
          <Image
            src={photo.src}
            alt=""
            fill
            sizes="(min-width: 1024px) 240px, (min-width: 768px) 360px, 50vw"
            className="object-cover"
          />
        ) : (
          <Tiles size="sm" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
        )}
      </div>
      <div className="flex flex-col gap-1 p-3 text-sm sm:p-5 sm:text-base">
        <Heading level={level} size="sm">
          {name}
        </Heading>
        <p>{role}</p>
        {detail && <p className="text-muted">{detail}</p>}
        {note && <p className="font-semibold">{note}</p>}
      </div>
    </article>
  );
}
