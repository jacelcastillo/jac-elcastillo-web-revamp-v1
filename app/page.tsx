import type { Metadata } from "next";
import { HomeTemplate } from "@/components/templates/HomeTemplate";
import { getRiskAlert } from "@/lib/cms/alert";
import { getLatest, getPagesBySlugs } from "@/lib/cms/content";
import { SITE } from "@/lib/site";

// Rendered per request so the build never calls WordPress.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { description: SITE.description };

export default async function Home() {
  const [latest, [about], alert] = await Promise.all([
    getLatest(3),
    getPagesBySlugs(["nosotros"]),
    getRiskAlert(),
  ]);
  return <HomeTemplate latest={latest} about={about} alert={alert} />;
}
