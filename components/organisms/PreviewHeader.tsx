"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/atoms/Icon";
import { Button } from "@/components/atoms/Button";
import { Logo } from "@/components/atoms/Logo";
import { Container } from "@/components/atoms/Container";

const destinations = [
  ["Inicio", "/preview/inicio/"], ["Comunidad", "/comites/"], ["Servicios", "#solicitud"],
  ["Territorio", "#territorio"], ["Proyectos", "/proyectos/"], ["Actualidad", "/noticias/"],
  ["Transparencia", "/rendicion-de-cuentas/"], ["Comercio Local", "#comercio"], ["La JAC", "/nosotros/"],
];

export function PreviewHeader() {
  const [query, setQuery] = useState("");
  const results = destinations.filter(([label]) => label.toLocaleLowerCase("es").includes(query.trim().toLocaleLowerCase("es")));
  return <header className="border-b border-line bg-paper">
    <div className="flag-rule" />
    <Container size="wide" className="flex flex-wrap items-center justify-between gap-4 py-3">
      <Link href="/preview/inicio/"><Logo /></Link>
      <p className="hidden border-l border-line pl-5 text-sm xl:block">Portal comunitario<br />de nuestro territorio</p>
      <div className="relative min-w-40 flex-1 md:max-w-xs">
        <label htmlFor="preview-search" className="sr-only">Buscar en el sitio</label>
        <input id="preview-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar en el sitio…" className="w-full rounded-xl border border-line bg-white px-4 py-3" />
        {query.trim() && <div className="absolute inset-x-0 top-full z-50 rounded-xl border border-line bg-white p-2 shadow-lg" aria-live="polite">{results.length ? results.map(([label, href]) => <Link key={label} href={href} onClick={() => setQuery("")} className="block rounded-lg p-3 hover:bg-paper">{label}</Link>) : <p className="p-3">Sin resultados</p>}</div>}
      </div>
      <Button popoverTarget="solicitud" style={{ backgroundColor: "#00552b" }}><Icon name="alert" className="size-5 shrink-0" />Reportar una situación</Button>
    </Container>
    <div className="border-t border-line"><Container size="wide"><nav aria-label="Principal" className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-2">{destinations.map(([label, href]) => <Link key={label} href={href} className="py-2 text-sm font-semibold hover:text-brand">{label}</Link>)}</nav></Container></div>
  </header>;
}
