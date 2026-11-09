import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectsTemplate } from "@/components/templates/ProjectsTemplate";
import { getProjectsPage } from "@/lib/cms/projects";
import { listingHref, parseProjectQuery } from "@/lib/listing";
import { categoriesOf, filterProjects } from "@/lib/projects";

// Rendered per request so the build never calls WordPress.
export const dynamic = "force-dynamic";

const description = "Proyectos de la Junta de Acción Comunal Ciudad Campestre El Castillo.";

export const metadata: Metadata = { title: "Proyectos", description };

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: Props) {
  const query = parseProjectQuery(await searchParams);
  if (!query) notFound();
  const { statuses, projects } = await getProjectsPage();
  const categories = categoriesOf(projects);
  if (query.categoria && !categories.some((c) => c.slug === query.categoria)) notFound();
  if (query.estado && !statuses.some((s) => s.slug === query.estado)) notFound();
  return (
    <ProjectsTemplate
      title="Proyectos"
      intro="Lo que la Junta construye con la comunidad."
      projects={filterProjects(projects, query)}
      total={projects.length}
      categories={categories}
      statuses={statuses}
      activeCategory={query.categoria}
      activeStatus={query.estado}
      hrefFor={(q) => listingHref("/proyectos/", q)}
    />
  );
}
