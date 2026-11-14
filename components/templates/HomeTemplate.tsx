import { ButtonLink } from "@/components/atoms/ButtonLink";
import { Container } from "@/components/atoms/Container";
import { SectionHeader } from "@/components/molecules/SectionHeader";
import { CardGrid } from "@/components/organisms/CardGrid";
import { FeatureSplit } from "@/components/organisms/FeatureSplit";
import { Hero } from "@/components/organisms/Hero";
import { RiskAlertBanner } from "@/components/organisms/RiskAlertBanner";
import type { RiskAlert } from "@/lib/alert";
import { SITE } from "@/lib/site";
import type { Summary } from "@/lib/types";

type HomeTemplateProps = {
  latest: Summary[];
  about?: Summary;
  alert?: RiskAlert | null;
};

export function HomeTemplate({ latest, about, alert }: HomeTemplateProps) {
  return (
    <>
      {alert && <RiskAlertBanner alert={alert} />}
      <Hero size="lg" eyebrow="Junta de Acción Comunal" title={SITE.tagline}>
        <p className="max-w-2xl">{SITE.description}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/noticias/">Ver noticias</ButtonLink>
          <ButtonLink href="/contacto/" variant="secondary">
            Contáctenos
          </ButtonLink>
        </div>
      </Hero>
      <Container size="wide" className="py-16 md:py-24">
        <SectionHeader title="Últimas noticias" href="/noticias/" />
        <div className="mt-8">
          <CardGrid items={latest} empty="Pronto publicaremos novedades." />
        </div>
      </Container>
      <div className="space-y-16 pb-16 md:space-y-24 md:pb-24">
        {about && (
          <FeatureSplit
            eyebrow="La Junta"
            title="Quiénes somos"
            text={about.excerpt}
            image={about.image}
            cta={{ label: "Conoce la Junta", href: "/nosotros/" }}
          />
        )}
        <FeatureSplit
          reverse
          eyebrow="Transparencia"
          title="Rendición de cuentas"
          text="Consulta los informes de gestión y la rendición de cuentas de la Junta."
          cta={{ label: "Ver informes", href: "/transparencia/" }}
        />
      </div>
    </>
  );
}
