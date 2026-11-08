import type { ReactNode } from "react";
import { Container } from "@/components/atoms/Container";
import { DateText } from "@/components/atoms/DateText";
import { Prose } from "@/components/atoms/Prose";
import { CardGrid } from "@/components/organisms/CardGrid";
import { Hero } from "@/components/organisms/Hero";
import type { SafeHtml, Summary } from "@/lib/types";

type ContentTemplateProps = {
  title: string;
  eyebrow?: string;
  intro?: string;
  date?: string;
  html?: SafeHtml;
  items?: Summary[];
  children?: ReactNode;
};

export function ContentTemplate({
  title,
  eyebrow,
  intro,
  date,
  html,
  items,
  children,
}: ContentTemplateProps) {
  return (
    <>
      <Hero size="sm" title={title} eyebrow={eyebrow}>
        {intro}
        {date && <DateText iso={date} />}
      </Hero>
      <Container className="py-10 md:py-14">
        {html && <Prose html={html} />}
        {children}
      </Container>
      {items && items.length > 0 && (
        <Container size="wide" className="pb-10 md:pb-14">
          <CardGrid items={items} empty="" />
        </Container>
      )}
    </>
  );
}
