import { Link } from "@/components/atoms/Link";
import type { Category } from "@/lib/types";

const base = "whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors";
const active = "bg-brand text-white";
const idle = "border border-line bg-white hover:border-ink/30";

type CategoryFilterProps = {
  categories: Category[];
  active?: string;
  href: (categoria?: string) => string;
  label?: string;
  allLabel?: string;
};

export function CategoryFilter({
  categories,
  active: activeSlug,
  href,
  label = "Filtrar por categoría",
  allLabel,
}: CategoryFilterProps) {
  const entries = allLabel ? [{ slug: undefined, name: allLabel }, ...categories] : categories;
  return (
    <nav aria-label={label}>
      <ul className="flex gap-2 overflow-x-auto pb-2">
        {entries.map(({ slug, name }) => {
          const current = slug === activeSlug;
          return (
            <li key={slug ?? "todas"} className="shrink-0">
              <Link
                href={href(slug)}
                aria-current={current ? "page" : undefined}
                className={`block ${base} ${current ? active : idle}`}
              >
                {name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
