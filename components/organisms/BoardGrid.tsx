import { BoardMemberCard } from "@/components/molecules/BoardMemberCard";
import { Heading } from "@/components/atoms/Heading";
import type { BoardMember } from "@/lib/types";

type BoardGridProps = { members: BoardMember[] };

export function BoardGrid({ members }: BoardGridProps) {
  if (members.length === 0) return null;
  return (
    <section className="mt-10">
      <Heading level={2} className="mb-6">
        Dignatarios
      </Heading>
      <ul className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
        {members.map((member, index) => (
          <li key={index} className="flex">
            <BoardMemberCard member={member} />
          </li>
        ))}
      </ul>
    </section>
  );
}
