import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CommissionFacts } from "@/components/molecules/CommissionFacts";
import { ContentTemplate } from "@/components/templates/ContentTemplate";
import { getCommissionsPage } from "@/lib/cms/commissions";
import { getPosts } from "@/lib/cms/content";
import { isSlug } from "@/lib/html";
import { listingHref } from "@/lib/listing";

type Props = { params: Promise<{ slug: string }> };

// Commissions render on first visit (ISR) so a slow WordPress cannot fail the deploy.
export async function generateStaticParams() {
  return [];
}

async function findCommission(slug: string) {
  if (!isSlug(slug)) return undefined;
  return (await getCommissionsPage()).commissions.find((c) => c.slug === slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const commission = await findCommission((await params).slug);
  return commission ? { title: commission.shortName, description: commission.summary } : {};
}

export default async function Page({ params }: Props) {
  const commission = await findCommission((await params).slug);
  if (!commission) notFound();
  const reports = await getPosts({ page: 1, categoria: commission.slug, perPage: 6 });
  return (
    <ContentTemplate
      title={commission.name}
      eyebrow={commission.type.name}
      intro={commission.summary}
      html={commission.html}
      aside={<CommissionFacts commission={commission} />}
      items={reports?.items}
      itemsTitle="Rendición de cuentas"
      itemsHref={listingHref("/noticias/", { categoria: commission.slug })}
    />
  );
}
