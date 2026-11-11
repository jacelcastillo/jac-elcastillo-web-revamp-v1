import Image from "next/image";
import { Container } from "@/components/atoms/Container";
import { ButtonLink } from "@/components/atoms/ButtonLink";
import { SectionHeader } from "@/components/molecules/SectionHeader";
import { CardGrid } from "@/components/organisms/CardGrid";
import { ProjectCard } from "@/components/organisms/ProjectCard";
import { RiskAlertBanner } from "@/components/organisms/RiskAlertBanner";
import { FeatureSplit } from "@/components/organisms/FeatureSplit";
import { SITE } from "@/lib/site";
import { previewNews, previewEvents } from "@/lib/home-preview";
import type { Summary, Project } from "@/lib/types";
import type { RiskAlert } from "@/lib/alert";

function Example() {
  return <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted">Contenido de ejemplo</p>;
}

export function HomePreviewTemplate({ news, about, projects, alert }: {
  news: Summary[]; about?: Summary; projects: Project[]; alert?: RiskAlert | null;
}) {
  const photo = about?.image ?? news.find(item => item.image)?.image;
  return <>
    {alert && <RiskAlertBanner alert={alert} />}
    <section className="border-b border-line bg-brand-deep text-white">
      <Container size="wide" className="grid gap-6 py-6 md:grid-cols-[1.2fr_1fr] md:py-10">
        <div>
          <p className="text-xs uppercase tracking-widest text-white/70">{SITE.fullName}</p>
          <h1 className="mt-3 max-w-xl font-display text-4xl leading-tight md:text-6xl">Construimos comunidad, gestionamos territorio.</h1>
          <p className="mt-4 max-w-lg text-white/80">Conoce lo que sucede en El Castillo, participa y encuentra los canales para hacerte escuchar.</p>
        </div>
        {photo && <div className="relative hidden min-h-64 overflow-hidden rounded-2xl md:block"><Image src={photo.src} alt={photo.alt} fill sizes="45vw" className="object-cover" /></div>}
        <div className="md:col-span-2">
          <h2 className="mb-3 font-display text-lg">¿Qué necesitas hacer?</h2>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {[["Radicar solicitud", "#solicitud"], ["Consultar gestión", "#seguimiento"], ["Ver actividades", "#agenda"], ["Participar", "#participar"]].map(([label, href]) =>
              <a key={href} href={href} className="flex min-h-14 items-center justify-between gap-2 rounded-xl bg-white px-4 py-3 font-semibold text-brand-deep transition hover:bg-sun">{label}<span aria-hidden="true">↗</span></a>)}
          </div>
        </div>
      </Container>
    </section>
    <Container size="wide" className="space-y-16 py-12 md:space-y-24 md:py-20">
      <section>
        <SectionHeader title="Lo que pasa en El Castillo" href="/noticias/" />
        <div className="mt-6">{!news.length && <Example />}<CardGrid items={news.length ? news : previewNews} empty="" /></div>
      </section>
      <section id="agenda" className="scroll-mt-8 rounded-2xl border border-line bg-white p-6 md:p-8">
        <Example /><h2 className="font-display text-3xl">Nos encontramos en comunidad</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">{previewEvents.map(event => <article key={event.day} className="flex gap-4">
          <div className="text-center text-brand"><p className="font-display text-4xl">{event.day}</p><p className="text-xs font-semibold">{event.month}</p></div>
          <div><h3 className="font-semibold">{event.title}</h3><p className="mt-1 text-sm text-muted">{event.detail}</p></div>
        </article>)}</div>
      </section>
      <section>
        <SectionHeader title="Iniciativas que toman forma" href="/proyectos/" />
        <div className="mt-6 grid gap-6 md:grid-cols-3">{projects.map(project => <ProjectCard key={project.slug} project={project} />)}</div>
        {!projects.length && <div className="mt-4"><Example /><div className="grid gap-4 md:grid-cols-3">{["Recuperación de espacios comunes", "Cultura y encuentro", "Entorno verde"].map(title => <article key={title} className="rounded-2xl border border-line bg-white p-6"><p className="text-sm text-leaf-deep">En planificación · Ejemplo</p><h3 className="mt-3 font-display text-2xl">{title}</h3><p className="mt-3 text-muted">Una iniciativa para construir con la comunidad.</p></article>)}</div></div>}
      </section>
      <section id="territorio" className="grid scroll-mt-8 gap-8 md:grid-cols-2">
        <div><Example /><h2 className="font-display text-4xl">Un territorio que compartimos</h2><p className="mt-4 text-lg text-muted">Espacios para encontrarnos, movernos y cuidar nuestro entorno.</p></div>
        <div aria-label="Esquema ilustrativo del territorio" className="grid min-h-64 grid-cols-2 gap-3 rounded-2xl bg-leaf/15 p-6">{["Zona verde", "Encuentro comunitario", "Conexiones", "Iniciativas"].map(label => <div key={label} className="flex items-center justify-center rounded-xl border border-leaf/30 bg-paper p-4 text-center font-semibold text-leaf-deep">{label}</div>)}</div>
      </section>
      <section id="participar" className="scroll-mt-8 border-y border-line py-10">
        <h2 className="font-display text-4xl">Tu comunidad también la haces tú</h2>
        <p className="mb-6 mt-4 text-lg text-muted">Conoce los comités y encuentra dónde aportar.</p><ButtonLink href="/comites/">Conocer los comités</ButtonLink>
        <div className="mt-8"><Example /><p className="text-muted">Voluntariado ambiental · Apoyo a actividades culturales · Comunicación comunitaria</p></div>
      </section>
      <section className="grid gap-8 md:grid-cols-2">
        <div><h2 className="font-display text-3xl">Gestión a la vista</h2><p className="mb-6 mt-4 text-muted">Consulta los informes y la rendición de cuentas de la Junta.</p><ButtonLink href="/rendicion-de-cuentas/" variant="secondary">Consultar informes</ButtonLink></div>
        <div><Example /><h2 className="font-display text-3xl">Sumamos esfuerzos</h2><p className="mt-4 text-muted">Comercios locales · Organizaciones comunitarias · Entidades públicas</p></div>
      </section>
      <section aria-label="Ejemplos de servicios" className="grid gap-4 md:grid-cols-2">
        {[{ id: "solicitud", title: "Radicar solicitud", text: "Tipo de solicitud · Descripción · Canal de respuesta", result: "Referencia de ejemplo DEMO-001" }, { id: "seguimiento", title: "Consultar gestión", text: "Solicitud de ejemplo DEMO-001", result: "Recibida → En gestión → Respuesta pendiente" }].map(item => <details key={item.id} id={item.id} className="scroll-mt-8 rounded-xl border border-line bg-white p-6"><summary className="cursor-pointer font-semibold">{item.title}</summary><div className="mt-4"><Example /><p>{item.text}</p><p className="mt-4 text-muted">{item.result}</p></div></details>)}
      </section>
    </Container>
    <div className="pb-16"><FeatureSplit title="Somos la Junta de Acción Comunal" text={about?.excerpt ?? SITE.description} image={about?.image} cta={{ label: "Conoce la Junta", href: "/nosotros/" }} /></div>
  </>;
}
