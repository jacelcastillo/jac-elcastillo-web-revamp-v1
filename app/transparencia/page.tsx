import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TransparencyTemplate } from "@/components/templates/TransparencyTemplate";
import { getProjectsPage } from "@/lib/cms/projects";
import { getTransparencyPage } from "@/lib/cms/transparency";
import { listingHref, parseTransparencyQuery } from "@/lib/listing";
import { filterProjects } from "@/lib/projects";
import { filterDocuments } from "@/lib/transparency";

// Rendered per request so the build never calls WordPress.
export const dynamic = "force-dynamic";

const description =
  "Presupuesto, ejecución y documentos de la Junta de Acción Comunal Ciudad Campestre El Castillo.";

export const metadata: Metadata = { title: "Transparencia y rendición de cuentas", description };

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: Props) {
  const query = parseTransparencyQuery(await searchParams);
  if (!query) notFound();
  const [{ types, documents, years }, { projects }] = await Promise.all([
    getTransparencyPage(),
    getProjectsPage(),
  ]);
  if (query.tipo && !types.some((t) => t.slug === query.tipo)) notFound();
  if (query.anio !== undefined && !years.some((y) => y.year === query.anio)) notFound();
  const year = years.find((y) => y.year === (query.anio ?? years[0]?.year));
  return (
    <TransparencyTemplate
      years={years}
      year={year}
      documents={filterDocuments(documents, query.tipo)}
      totalDocuments={documents.length}
      types={types}
      activeType={query.tipo}
      ongoing={filterProjects(projects, { estado: "progreso" })}
      hrefFor={(q) => listingHref("/transparencia/", q)}
    />
  );
}
