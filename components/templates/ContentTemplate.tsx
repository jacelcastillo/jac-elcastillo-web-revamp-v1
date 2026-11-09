import type { ReactNode } from "react";
import { Container } from "@/components/atoms/Container";
import { DateText } from "@/components/atoms/DateText";
import { Prose } from "@/components/atoms/Prose";
import { SectionHeader } from "@/components/molecules/SectionHeader";
import { CardGrid } from "@/components/organisms/CardGrid";
import { Hero } from "@/components/organisms/Hero";
import type { SafeHtml, Summary } from "@/lib/types";

type ContentTemplateProps = {
  title: string;
  eyebrow?: string;
  intro?: string;
  date?: string;
  html?: SafeHtml;
  aside?: ReactNode;
  items?: Summary[];
  itemsTitle?: string;
  itemsHref?: string;
  children?: ReactNode;
};

export function ContentTemplate({
  title,
  eyebrow,
  intro,
  date,
  html,
  aside,
  items,
  itemsTitle,
  itemsHref,
  children,
}: ContentTemplateProps) {
  const body = (
    <>
      {html && <Prose html={html} />}
      {children}
    </>
  );
  return (
    <>
      <Hero size="sm" title={title} eyebrow={eyebrow}>
        {intro}
        {date && <DateText iso={date} />}
      </Hero>
      {aside ? (
        <Container size="wide" className="grid gap-10 py-10 md:py-14 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <aside className="lg:order-last">{aside}</aside>
          <div>{body}</div>
        </Container>
      ) : (
        <Container className="py-10 md:py-14">{body}</Container>
      )}
      {items && items.length > 0 && (
        <Container size="wide" className="pb-10 md:pb-14">
          {itemsTitle && (
            <div className="mb-6">
              <SectionHeader title={itemsTitle} href={itemsHref} linkLabel="Ver todos" />
            </div>
          )}
          <CardGrid items={items} empty="" />
        </Container>
      )}
    </>
  );
}
