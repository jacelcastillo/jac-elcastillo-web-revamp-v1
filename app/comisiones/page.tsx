import type { Metadata } from "next";
import { ListingTemplate } from "@/components/templates/ListingTemplate";
import { getCommissionsPage } from "@/lib/cms/commissions";
import { commissionSections } from "@/lib/commissions";

// Rendered per request so the build never calls WordPress.
export const dynamic = "force-dynamic";

const description =
  "Comisiones de trabajo, comisiones accidentales y órganos de la Junta de Acción Comunal Ciudad Campestre El Castillo.";

export const metadata: Metadata = { title: "Comisiones de trabajo", description };

export default async function Page() {
  return (
    <ListingTemplate
      title="Comisiones de trabajo"
      intro="Las comisiones y los órganos con los que la Junta trabaja por la comunidad."
      empty="No hay comisiones publicadas."
      sections={commissionSections(await getCommissionsPage())}
    />
  );
}
