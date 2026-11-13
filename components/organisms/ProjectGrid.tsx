import { Heading } from "@/components/atoms/Heading";
import { ProjectCard } from "@/components/organisms/ProjectCard";
import type { Project } from "@/lib/types";

type ProjectGridProps = { projects: Project[]; title?: string };

export function ProjectGrid({ projects, title }: ProjectGridProps) {
  const grid = (
    <div className="@container">
      <ul className="grid gap-6 @lg:grid-cols-2 @4xl:grid-cols-3">
        {projects.map((project) => (
          <li key={project.slug} className="flex">
            <ProjectCard project={project} level={title ? 3 : 2} />
          </li>
        ))}
      </ul>
    </div>
  );
  if (!title) return grid;
  return (
    <section className="mt-10">
      <Heading level={2} className="mb-6">
        {title}
      </Heading>
      {grid}
    </section>
  );
}
