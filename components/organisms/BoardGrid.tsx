import { BoardMemberCard } from "@/components/molecules/BoardMemberCard";
import { Heading } from "@/components/atoms/Heading";
import { groupMembers } from "@/lib/board";
import type { BoardMember } from "@/lib/types";

type BoardGridProps = { members: BoardMember[]; title?: string };

export function BoardGrid({ members, title = "Dignatarios" }: BoardGridProps) {
  if (members.length === 0) return null;
  const groups = groupMembers(members);
  const sectioned = groups.length > 1;
  return (
    <section className="mt-10">
      <Heading level={2} className="mb-6">
        {title}
      </Heading>
      {groups.map(({ label, members: list }) => (
        <div key={label} className={sectioned ? "mt-8 first:mt-0" : undefined}>
          {sectioned && (
            <Heading level={3} className="mb-4">
              {label}
            </Heading>
          )}
          <ul className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
            {list.map((member, index) => (
              <li key={index} className="flex">
                <BoardMemberCard member={member} level={sectioned ? 4 : 3} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
