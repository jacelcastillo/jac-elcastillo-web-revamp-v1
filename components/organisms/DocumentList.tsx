import { Heading } from "@/components/atoms/Heading";
import { CategoryFilter } from "@/components/molecules/CategoryFilter";
import { DocumentItem } from "@/components/molecules/DocumentItem";
import type { Category, PublicDocument } from "@/lib/types";

type DocumentListProps = {
  documents: PublicDocument[];
  total: number;
  types: Category[];
  active?: string;
  href: (tipo?: string) => string;
};

export function DocumentList({ documents, total, types, active, href }: DocumentListProps) {
  return (
    <section>
      <Heading level={2} className="mb-6">
        Documentos
      </Heading>
      {total === 0 ? (
        <p className="text-muted">Aún no hay documentos publicados.</p>
      ) : (
        <>
          <div className="mb-4">
            <CategoryFilter
              label="Filtrar documentos por tipo"
              allLabel="Todos"
              categories={types}
              active={active}
              href={href}
            />
          </div>
          {documents.length === 0 ? (
            <p className="text-muted">No hay documentos de este tipo.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {documents.map((document) => (
                <DocumentItem key={document.id} document={document} />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
