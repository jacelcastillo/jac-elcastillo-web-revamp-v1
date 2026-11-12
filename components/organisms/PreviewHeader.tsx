"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Icon } from "@/components/atoms/Icon";
import { Button } from "@/components/atoms/Button";
import { Logo } from "@/components/atoms/Logo";
import { Container } from "@/components/atoms/Container";

const destinations = [
  ["Inicio", "/preview/inicio/"], ["Comunidad", "/comites/"], ["Servicios", "#solicitud"],
  ["Territorio", "#territorio"], ["Proyectos", "/proyectos/"], ["Actualidad", "/noticias/"],
  ["Transparencia", "/rendicion-de-cuentas/"], ["Comercio Local", "#comercio"], ["La JAC", "/nosotros/"],
];

function PreviewSearch({ id, onNavigate }: { id: string; onNavigate?: () => void }) {
  const [query, setQuery] = useState("");
  const results = destinations.filter(([label]) => label.toLocaleLowerCase("es").includes(query.trim().toLocaleLowerCase("es")));
  return <div className="relative min-w-0 flex-1">
    <label htmlFor={id} className="sr-only">Buscar en el sitio</label>
    <input id={id} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar en el sitio…" className="w-full rounded-xl border border-line bg-white px-4 py-3" />
    {query.trim() && <div className="absolute inset-x-0 top-full z-50 rounded-xl border border-line bg-white p-2 shadow-lg" aria-live="polite">
      {results.length ? results.map(([label, href]) => <Link key={label} href={href} onClick={() => { setQuery(""); onNavigate?.(); }} className="block rounded-lg p-3 hover:bg-paper">{label}</Link>) : <p className="p-3">Sin resultados</p>}
    </div>}
  </div>;
}

export function PreviewHeader() {
  const menu = useRef<HTMLDivElement>(null);
  const closeMenu = () => menu.current?.hidePopover();
  return <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
    <div className="flag-rule" />
    <Container size="wide" className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <Link href="/preview/inicio/"><Logo /></Link>
      <p className="hidden border-l border-line pl-5 text-sm xl:block">Portal comunitario<br />de nuestro territorio</p>
      <div className="hidden min-w-0 flex-1 lg:block lg:max-w-xs"><PreviewSearch id="preview-search" /></div>
      <Button variant="secondary" popoverTarget="preview-menu" className="shrink-0 lg:hidden" aria-label="Abrir menú">
        <Icon name="menu" />
      </Button>
      <Button popoverTarget="solicitud" style={{ backgroundColor: "#00552b" }} className="w-full justify-center lg:w-auto">
        <Icon name="alert" className="size-5 shrink-0" />Reportar una situación
      </Button>
    </Container>
    <div className="hidden border-t border-line lg:block"><Container size="wide"><nav aria-label="Principal" className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-2">
      {destinations.map(([label, href]) => <Link key={label} href={href} className="py-2 text-sm font-semibold hover:text-brand">{label}</Link>)}
    </nav></Container></div>
    <div ref={menu} id="preview-menu" popover="" className="fixed inset-auto right-0 top-0 m-0 h-dvh w-[min(22rem,100vw)] overflow-y-auto bg-paper p-4 text-ink shadow-2xl backdrop:bg-ink/40">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-xl">Menú</h2>
        <Button variant="secondary" popoverTarget="preview-menu" popoverTargetAction="hide" aria-label="Cerrar menú"><Icon name="close" /></Button>
      </div>
      <PreviewSearch id="preview-mobile-search" onNavigate={closeMenu} />
      <nav aria-label="Principal móvil" className="mt-5">
        {destinations.map(([label, href]) => <Link key={label} href={href} onClick={closeMenu} className="block border-b border-line py-3 font-semibold hover:text-leaf-deep">{label}</Link>)}
      </nav>
    </div>
  </header>;
}
