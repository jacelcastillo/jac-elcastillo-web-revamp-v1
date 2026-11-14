import { Container } from "@/components/atoms/Container";
import { Link } from "@/components/atoms/Link";
import { CategoryFilter } from "@/components/molecules/CategoryFilter";
import { Stat } from "@/components/molecules/Stat";
import { BudgetTable } from "@/components/organisms/BudgetTable";
import { DocumentList } from "@/components/organisms/DocumentList";
import { Hero } from "@/components/organisms/Hero";
import { MonthlyChart } from "@/components/organisms/MonthlyChart";
import { ProjectGrid } from "@/components/organisms/ProjectGrid";
import { formatCOP } from "@/lib/projects";
import { executed } from "@/lib/transparency";
import type { Category, FiscalYear, Project, PublicDocument } from "@/lib/types";

type TransparencyTemplateProps = {
  years: FiscalYear[];
  year?: FiscalYear;
  documents: PublicDocument[];
  totalDocuments: number;
  types: Category[];
  activeType?: string;
  ongoing: Project[];
  hrefFor: (q: { anio?: number; tipo?: string }) => string;
};

export function TransparencyTemplate({
  years,
  year,
  documents,
  totalDocuments,
  types,
  activeType,
  ongoing,
  hrefFor,
}: TransparencyTemplateProps) {
  const done = year && executed(year);
  const stats = [
    ...(year && done
      ? [
          { value: formatCOP(done.income), label: `Ingresos ejecutados (${done.label})` },
          { value: formatCOP(done.expense), label: `Egresos ejecutados (${done.label})` },
        ]
      : year
        ? [{ value: "Sin datos de ejecución", label: `Vigencia ${year.year}` }]
        : []),
    { value: String(ongoing.length), label: "Proyectos en curso" },
  ];
  return (
    <>
      <Hero size="sm" title="Transparencia y rendición de cuentas">
        <p className="max-w-3xl">
          Las cuentas y los documentos de la Junta, para que toda la comunidad pueda consultarlos.
        </p>
        <div className="mt-6 grid max-w-3xl gap-3 sm:grid-cols-3">
          {stats.map((stat) => (
            <Stat key={stat.label} {...stat} />
          ))}
        </div>
      </Hero>
      <Container size="wide" className="flex flex-col gap-12 py-10 md:py-14">
        {year && (
          <>
            <div className="sm:flex sm:items-start sm:gap-3">
              <p className="mb-1 shrink-0 text-sm font-semibold text-muted sm:mb-0 sm:w-20 sm:pt-2">Vigencia</p>
              <CategoryFilter
                label="Elegir la vigencia"
                categories={years.map((y) => ({ slug: String(y.year), name: String(y.year) }))}
                active={String(year.year)}
                href={(anio) => hrefFor({ anio: Number(anio), tipo: activeType })}
              />
            </div>
            <BudgetTable year={year} />
            <MonthlyChart year={year} />
          </>
        )}
        <DocumentList
          documents={documents}
          total={totalDocuments}
          types={types}
          active={activeType}
          href={(tipo) => hrefFor({ anio: year?.year, tipo })}
        />
        {ongoing.length > 0 && (
          <div>
            <ProjectGrid projects={ongoing} title="Proyectos en curso" />
            <p className="mt-6">
              <Link href="/proyectos/" className="font-semibold text-brand hover:underline">
                Ver todos los proyectos →
              </Link>
            </p>
          </div>
        )}
      </Container>
    </>
  );
}
