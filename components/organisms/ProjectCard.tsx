import Image from "next/image";
import { buttonClass } from "@/components/atoms/Button";
import { Heading } from "@/components/atoms/Heading";
import { Link } from "@/components/atoms/Link";
import { Tag } from "@/components/atoms/Tag";
import { Tiles } from "@/components/atoms/Tiles";
import { ProjectStats } from "@/components/molecules/ProjectStats";
import { STATUS_TONES } from "@/lib/projects";
import type { Project } from "@/lib/types";

type ProjectCardProps = { project: Project };

export function ProjectCard({ project }: ProjectCardProps) {
  const { image, status, categories } = project;
  return (
    <article className="relative flex w-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-lg">
      <div className="relative aspect-[16/10] bg-paper">
        {image ? (
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <Tiles size="sm" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
        )}
        <span className="absolute right-3 top-3 rounded-full bg-white">
          <Tag tone={STATUS_TONES[status.slug]} className="block">
            {status.name}
          </Tag>
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Tag key={c.slug}>{c.name}</Tag>
            ))}
          </div>
        )}
        <Heading level={2} size="sm">
          <Link href={`/proyectos/${project.slug}/`} className="after:absolute after:inset-0">
            {project.title}
          </Link>
        </Heading>
        <p className="line-clamp-3 text-muted">{project.summary}</p>
        <div className="mt-auto pt-2">
          <ProjectStats project={project} />
        </div>
        <span aria-hidden="true" className={`${buttonClass("secondary")} mt-1 w-full justify-center`}>
          Ver detalles
        </span>
      </div>
    </article>
  );
}
