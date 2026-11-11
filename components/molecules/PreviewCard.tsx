"use client";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/atoms/Icon";
import type { ComponentProps, ReactNode } from "react";
import type { Img } from "@/lib/types";

export function PreviewCard({ title, text, href, image, media, example = false }: {
  title: string; text: string; href: string; image?: Img; media?: ReactNode; example?: boolean;
}) {
  return <Link href={href} onClick={event => {
    if (!href.startsWith("#")) return;
    const panel = document.getElementById(href.slice(1));
    if (panel?.hasAttribute("popover")) {
      event.preventDefault();
      panel.showPopover();
    }
  }} className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-white shadow-sm transition hover:shadow-md">
    <div className="relative h-40 shrink-0 overflow-hidden bg-leaf/10">
      {media ?? (image && <Image src={image.src} alt={image.alt} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />)}
    </div>
    <div className="grid flex-1 grid-rows-[auto_auto_1fr] gap-2 p-4">
      <h3 className="line-clamp-2 min-h-14 font-display text-xl leading-7">{title}</h3>
      <p className="line-clamp-3 min-h-15 text-sm leading-5 text-muted">{text}</p>
      <div className="flex min-h-6 items-end justify-between gap-2">
        <span className="text-xs text-muted">{example ? "Contenido de ejemplo" : ""}</span>
        <span aria-hidden="true" className="text-leaf-deep">→</span>
      </div>
    </div>
  </Link>;
}

export function QuickAccess({ label, text, icon, href, target }: { label: string; text: string; icon: ComponentProps<typeof Icon>["name"]; href?: string; target?: string }) {
  const content = <><Icon name={icon} className="size-7 shrink-0 text-leaf-deep" /><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{label}</span><span className="mt-1 block text-xs text-muted">{text}</span></span><span aria-hidden="true">→</span></>;
  const className = "flex items-center gap-3 rounded-xl border border-line bg-leaf/10 px-4 py-3 text-left transition hover:bg-leaf/20";
  return target ? <button className={className} popoverTarget={target}>{content}</button> : <Link className={className} href={href ?? "#"}>{content}</Link>;
}
