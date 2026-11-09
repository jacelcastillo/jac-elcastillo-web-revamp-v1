import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectStats } from "@/components/molecules/ProjectStats";
import { ContentTemplate } from "@/components/templates/ContentTemplate";
import { getPosts } from "@/lib/cms/content";
import { getProjectsPage } from "@/lib/cms/projects";
import { isSlug } from "@/lib/html";
import { listingHref } from "@/lib/listing";

type Props = { params: Promise<{ slug: string }> };

// Projects render on first visit (ISR) so a slow WordPress cannot fail the deploy.
export async function generateStaticParams() {
  return [];
}

async function findProject(slug: string) {
  if (!isSlug(slug)) return undefined;
  return (await getProjectsPage()).projects.find((p) => p.slug === slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = await findProject((await params).slug);
  return project ? { title: project.title, description: project.summary } : {};
}

export default async function Page({ params }: Props) {
  const project = await findProject((await params).slug);
  if (!project) notFound();
  const updates = await getPosts({ page: 1, categoria: project.slug, perPage: 6 });
  return (
    <ContentTemplate
      title={project.title}
      eyebrow="Proyectos"
      intro={project.summary}
      html={project.html}
      aside={<ProjectStats project={project} withTags />}
      items={updates?.items}
      itemsTitle="Avances"
      itemsHref={listingHref("/noticias/", { categoria: project.slug })}
    />
  );
}
