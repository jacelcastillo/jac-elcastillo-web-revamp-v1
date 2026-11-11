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
  const latest = [news[0] ?? previewNews[0], news[1] ?? previewNews[1]];
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
      <div className="grid gap-6 py-8 lg:grid-cols-4 lg:gap-4">
        <section id="agenda" className="grid min-w-0 grid-rows-[auto_1fr] gap-5 lg:col-span-3">
          <div className="flex min-h-16 flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-2xl">Actualidad</h2>
            <Link href="/noticias/" className="text-sm font-semibold text-leaf-deep">Ver todas las noticias →</Link>
          </div>
          <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((item, index) => <PreviewCard key={item.href} title={item.title} text={item.excerpt} href={item.href} image={item.image} example={!news[index]} />)}
            <PreviewCard title="Próximos eventos" text={previewEvents[0].title + " · " + previewEvents[0].day + " NOV"} href="#eventos" image={news[2]?.image} example />
          </div>
        </section>
        <section id="territorio" className="grid min-w-0 grid-rows-[auto_1fr] gap-5">
          <div className="flex min-h-16 items-center"><h2 className="font-display text-2xl">El territorio y su gestión</h2></div>
          <PreviewCard title="Explora el mapa comunitario" text="Proyectos, espacios de interés y temas territoriales." href="#mapa" example media={
            <div aria-label="Mapa ilustrativo del territorio" className="relative h-full bg-[repeating-linear-gradient(35deg,transparent_0_35px,var(--color-paper)_35px_43px),repeating-linear-gradient(125deg,transparent_0_50px,var(--color-paper)_50px_58px)]">
              {["Zona verde", "Encuentro", "Iniciativas"].map((label, index) => <span key={label} style={{ left: `${5 + index * 25}%`, top: `${15 + index * 25}%` }} className="absolute rounded-full border border-leaf bg-white px-2 py-1 text-xs font-semibold text-leaf-deep">{label}</span>)}
            </div>
          } />
        </section>
      </div>
      <section id="proyectos" className="pb-8">
        <div className="mb-5 flex min-h-16 flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-2xl">Proyectos destacados</h2>
          <Link href="/proyectos/" className="text-sm font-semibold text-leaf-deep">Ver proyectos →</Link>
        </div>
        <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {projects.slice(0, 4).map(project => <PreviewCard key={project.slug} title={project.title} text={project.summary} image={project.image} href={`/proyectos/${project.slug}/`} />)}
          {!projects.length && <PreviewCard title="Iniciativas y resultados" text="Conoce qué se está proponiendo, gestionando y ejecutando." href="/proyectos/" example />}
        </div>
      </section>
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
