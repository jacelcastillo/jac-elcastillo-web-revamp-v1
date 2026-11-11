import { notFound } from "next/navigation";
import { getLatest, getPagesBySlugs } from "@/lib/cms/content";
import { getProjectsPage } from "@/lib/cms/projects";
import { getRiskAlert } from "@/lib/cms/alert";
import { HomePreviewTemplate } from "@/components/templates/HomePreviewTemplate";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vista previa del inicio", robots: { index: false, follow: false } };

export default async function Page() {
  if (process.env.NODE_ENV !== "development") notFound();
  const [news, pages, projects, alert] = await Promise.allSettled([
    getLatest(3), getPagesBySlugs(["nosotros"]), getProjectsPage(), getRiskAlert(),
  ]);
  return <HomePreviewTemplate
    news={news.status === "fulfilled" ? news.value : []}
    about={pages.status === "fulfilled" ? pages.value[0] : undefined}
    projects={projects.status === "fulfilled" ? projects.value.projects.slice(0, 3) : []}
    alert={alert.status === "fulfilled" ? alert.value : null}
  />;
}
