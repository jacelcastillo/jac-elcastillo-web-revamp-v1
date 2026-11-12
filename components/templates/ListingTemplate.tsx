import { Container } from "@/components/atoms/Container";
import { Heading } from "@/components/atoms/Heading";
import { CategoryFilter } from "@/components/molecules/CategoryFilter";
import { Pagination } from "@/components/molecules/Pagination";
import { CardGrid } from "@/components/organisms/CardGrid";
import { Hero } from "@/components/organisms/Hero";
import type { Category, Summary } from "@/lib/types";

type ListingTemplateProps = {
  title: string;
  intro?: string;
  items?: Summary[];
  sections?: { title: string; items: Summary[] }[];
  empty: string;
  categories?: Category[];
  activeCategory?: string;
  page?: number;
  totalPages?: number;
  hrefFor?: (q: { page?: number; categoria?: string }) => string;
};

export function ListingTemplate({
  title,
  intro,
  items = [],
  sections,
  empty,
  categories,
  activeCategory,
  page = 1,
  totalPages = 1,
  hrefFor,
}: ListingTemplateProps) {
  return (
    <>
      <Hero size="sm" title={title}>
        {intro}
      </Hero>
      <Container size="wide" className="py-10 md:py-14">
        {categories && hrefFor && (
          <div className="mb-8">
            <CategoryFilter
              categories={categories}
              active={activeCategory}
              href={(categoria) => hrefFor({ categoria })}
            />
          </div>
        )}
        {sections && sections.length > 0 ? (
          <div className="flex flex-col gap-12">
            {sections.map((section) => (
              <section key={section.title} className="flex flex-col gap-6">
                <Heading level={2} size="md">
                  {section.title}
                </Heading>
                <CardGrid items={section.items} empty={empty} />
              </section>
            ))}
          </div>
        ) : (
          <CardGrid items={sections ? [] : items} empty={empty} />
        )}
        {hrefFor && (
          <div className="mt-10">
            <Pagination
              page={page}
              totalPages={totalPages}
              href={(next) => hrefFor({ page: next, categoria: activeCategory })}
            />
          </div>
        )}
      </Container>
    </>
  );
}
