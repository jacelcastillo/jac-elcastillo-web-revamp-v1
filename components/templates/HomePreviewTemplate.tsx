import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/atoms/Container";
import { ButtonLink } from "@/components/atoms/ButtonLink";
import { PreviewCard, QuickAccess } from "@/components/molecules/PreviewCard";
import { RiskAlertBanner } from "@/components/organisms/RiskAlertBanner";
import { previewNews, previewEvents } from "@/lib/home-preview";
import type { Summary, Project } from "@/lib/types";
import type { RiskAlert } from "@/lib/alert";

export function HomePreviewTemplate({ news, about, projects, alert }: { news: Summary[]; about?: Summary; projects: Project[]; alert?: RiskAlert | null }) {
  const photo = about?.image ?? news.find(item => item.image)?.image;
  const lead = news[0] ?? previewNews[0];
  const project = projects[0];
  return <>
    {alert && <RiskAlertBanner alert={alert} />}
    <section className="relative isolate overflow-hidden bg-brand-deep text-white">
      {photo && <Image src={photo.src} alt={photo.alt} fill priority sizes="100vw" className="object-cover" />}
      <div className="absolute inset-0 -z-0 bg-linear-to-r from-brand-deep via-brand-deep/80 to-brand-deep/20" />
      <Container size="wide" className="relative py-10 md:py-12">
        <p className="text-xs font-semibold uppercase tracking-widest">Portal comunitario · Imagen ilustrativa</p>
        <h1 className="mt-3 max-w-2xl font-display text-4xl leading-tight md:text-5xl">Un territorio. Una comunidad. Muchas posibilidades.</h1>
        <p className="mt-3 max-w-xl text-lg">Conoce lo que sucede en El Castillo, participa y encuentra soluciones para el bienestar de todos.</p>
        <div className="mt-5 flex flex-wrap gap-3"><ButtonLink href="#territorio">Explorar el territorio</ButtonLink><ButtonLink href="#proyectos" variant="secondary">Conocer la gestión</ButtonLink></div>
      </Container>
    </section>
    <Container size="wide" className="pt-5 pb-12">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuickAccess icon="report" label="Reportar una situación" text="Informa y ayuda a mejorar el territorio." target="solicitud" />
        <QuickAccess icon="search" label="Consultar una gestión" text="Revisa el estado de tu solicitud." target="seguimiento" />
        <QuickAccess icon="calendar" label="Ver agenda y eventos" text="Actividades, reuniones y convocatorias." href="#agenda" />
        <QuickAccess icon="users" label="Participar en la comunidad" text="Comités, voluntariado y más." href="/comites/" />
      </div>
      <div className="grid gap-8 py-8 lg:grid-cols-[1.23fr_1fr_1fr] lg:gap-5">
        <section id="agenda" className="flex min-w-0 flex-col"><h2 className="mb-5 font-display text-2xl">Actualidad</h2>
          <div className="grid flex-1 gap-3 sm:grid-cols-2"><PreviewCard title="Noticias comunitarias" text={lead.title} href={lead.href} image={lead.image ?? photo} /><PreviewCard title="Próximos eventos" text={previewEvents[0].title + " · " + previewEvents[0].day + " NOV · Contenido de ejemplo"} href="#eventos" image={news[1]?.image ?? photo} /></div>
          {!news.length && <p className="mt-2 text-xs text-muted">Contenido de ejemplo</p>}
          <Link href="/noticias/" className="mt-3 inline-block text-sm font-semibold text-leaf-deep">Ver todas las noticias →</Link>
        </section>
        <section id="territorio" className="flex min-w-0 flex-col lg:border-l lg:border-line lg:pl-5"><h2 className="mb-5 font-display text-2xl">El territorio y su gestión</h2>
          <button type="button" popoverTarget="mapa" className="flex flex-1 flex-col w-full text-left overflow-hidden rounded-xl border border-line bg-leaf/20">
            <div aria-label="Mapa ilustrativo del territorio" className="relative h-40 w-full shrink-0 overflow-hidden bg-[repeating-linear-gradient(35deg,transparent_0_35px,var(--color-paper)_35px_43px),repeating-linear-gradient(125deg,transparent_0_50px,var(--color-paper)_50px_58px)]">
              {["Zona verde", "Encuentro", "Iniciativas"].map((label, index) => <span key={label} style={{ left: `${10 + index * 27}%`, top: `${20 + index * 20}%` }} className="absolute rounded-full border border-leaf bg-white px-2 py-1 text-xs font-semibold text-leaf-deep">{label}</span>)}
            </div><div className="w-full flex-1 bg-white/90 p-4"><h3 className="font-display text-xl">Explora el mapa comunitario →</h3><p className="mt-1 text-sm text-muted">Proyectos, espacios de interés y temas territoriales.</p><p className="mt-2 text-xs text-muted">Contenido de ejemplo</p></div>
          </button>
        </section>
        <section id="proyectos" className="flex min-w-0 flex-col lg:border-l lg:border-line lg:pl-5"><div className="mb-5 flex flex-wrap items-center justify-between gap-2"><h2 className="font-display text-2xl">Proyectos destacados</h2><Link href="/proyectos/" className="text-sm font-semibold text-leaf-deep">Ver proyectos →</Link></div><PreviewCard title="Iniciativas y resultados" text={project?.title ?? "Conoce qué se está proponiendo, gestionando y ejecutando."} href={project ? `/proyectos/${project.slug}/` : "/proyectos/"} image={project?.image ?? photo} /></section>
      </div>
      <section className="grid gap-6 border-t border-line py-6 md:grid-cols-2">
        <div className="flex flex-col"><h2 className="mb-4 font-display text-2xl">Transparencia y rendición de cuentas</h2><QuickAccess icon="chart" label="Gestión abierta y transparente" text="Informes, documentos y resultados de la gestión comunitaria." href="/rendicion-de-cuentas/" /></div>
        <div id="comercio" className="flex flex-col md:border-l md:border-line md:pl-6"><h2 className="mb-4 font-display text-2xl">Comercio Local</h2><QuickAccess icon="store" label="Comercios y servicios del territorio" text="Contenido de ejemplo · Descubre el directorio local." target="directorio" /></div>
      </section>
    </Container>
    {[["solicitud", "Reportar una situación", "Contenido de ejemplo · Tipo de solicitud · Descripción · Canal de respuesta · Referencia DEMO-001"],
      ["seguimiento", "Consultar una gestión", "Contenido de ejemplo · DEMO-001 · Recibida → En gestión → Respuesta pendiente"],
      ["eventos", "Próximos eventos", previewEvents.map(event => `${event.day} ${event.month} · ${event.title}`).join(" / ") + " · Contenido de ejemplo"],
      ["mapa", "Mapa comunitario", "Contenido de ejemplo · Zonas verdes, espacios comunitarios e iniciativas del territorio."],
      ["directorio", "Comercio Local", "Contenido de ejemplo · Tienda del barrio · Servicios profesionales · Emprendimientos locales."]].map(([id, title, text]) => <div key={id} id={id} popover="" className="m-auto max-w-lg rounded-2xl border border-line bg-paper p-6 text-ink shadow-xl backdrop:bg-ink/40"><button popoverTarget={id} popoverTargetAction="hide" className="float-right p-2" aria-label="Cerrar">×</button><h2 className="font-display text-2xl">{title}</h2><p className="mt-4">{text}</p></div>)}
  </>;
}
