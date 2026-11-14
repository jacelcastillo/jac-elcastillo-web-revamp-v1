import { Container } from "@/components/atoms/Container";
import { CategoryFilter } from "@/components/molecules/CategoryFilter";
import { Hero } from "@/components/organisms/Hero";
import { ProjectGrid } from "@/components/organisms/ProjectGrid";
import type { Category, Project } from "@/lib/types";

const filterLabel = "mb-1 shrink-0 text-sm font-semibold text-muted sm:mb-0 sm:w-20 sm:pt-2";

type ProjectsTemplateProps = {
  title: string;
  intro?: string;
  projects: Project[];
  total: number;
  categories: Category[];
  statuses: Category[];
  activeCategory?: string;
  activeStatus?: string;
  hrefFor: (q: { categoria?: string; estado?: string }) => string;
};

export function ProjectsTemplate({
  title,
  intro,
  projects,
  total,
  categories,
  statuses,
  activeCategory,
  activeStatus,
  hrefFor,
}: ProjectsTemplateProps) {
  return (
    <>
      <Hero size="sm" title={title}>
        {intro}
      </Hero>
      <Container size="wide" className="py-10 md:py-14">
        {total === 0 ? (
          <p className="text-muted">Aún no hay proyectos publicados.</p>
        ) : (
          <>
            <div className="mb-6 flex flex-col gap-3">
              <div className="sm:flex sm:items-start sm:gap-3">
                <p className={filterLabel}>Estado</p>
                <CategoryFilter
                  label="Filtrar por estado"
                  allLabel="Todos"
                  categories={statuses}
                  active={activeStatus}
                  href={(estado) => hrefFor({ categoria: activeCategory, estado })}
                />
              </div>
              <div className="sm:flex sm:items-start sm:gap-3">
                <p className={filterLabel}>Categoría</p>
                <CategoryFilter
                  allLabel="Todas"
                  categories={categories}
                  active={activeCategory}
                  href={(categoria) => hrefFor({ categoria, estado: activeStatus })}
                />
              </div>
            </div>
            <p className="mb-6 text-muted">
              Mostrando {projects.length} de {total} {total === 1 ? "proyecto" : "proyectos"}
            </p>
            {projects.length === 0 ? (
              <p className="text-muted">No hay proyectos con estos filtros.</p>
            ) : (
              <ProjectGrid projects={projects} />
            )}
          </>
        )}
      </Container>
    </>
  );
}
