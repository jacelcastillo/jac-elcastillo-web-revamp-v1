import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ContentTemplate } from "@/components/templates/ContentTemplate";
import { BoardGrid } from "@/components/organisms/BoardGrid";
import { getBoardMembers } from "@/lib/cms/board";
import { getEntryByPath } from "@/lib/cms/content";
import { isTerm } from "@/lib/board";
import { isSlug } from "@/lib/html";

type Props = { params: Promise<{ path: string[] }> };

const MAX_DEPTH = 3;
const isValid = (path: string[]) => path.length <= MAX_DEPTH && path.every(isSlug);

// Pages render on first visit (ISR) so a slow WordPress cannot fail the deploy.
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { path } = await params;
  if (!isValid(path)) return {};
  const found = await getEntryByPath(path);
  return found && "entry" in found
    ? { title: found.entry.title, description: found.entry.excerpt }
    : {};
}

export default async function Page({ params }: Props) {
  const { path } = await params;
  if (!isValid(path)) notFound();
  const found = await getEntryByPath(path);
  if (!found) notFound();
  if ("redirect" in found) permanentRedirect(found.redirect);
  const { entry } = found;
  const term = path[path.length - 1];
  const members = entry.kind === "page" && isTerm(term) ? await getBoardMembers(term) : [];
  return (
    <ContentTemplate
      title={entry.title}
      eyebrow={entry.kind === "post" ? "Noticias" : undefined}
      date={entry.kind === "post" ? entry.date : undefined}
      html={entry.html}
      items={entry.children}
    >
      <BoardGrid members={members} />
    </ContentTemplate>
  );
}
