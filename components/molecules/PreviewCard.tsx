"use client";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/atoms/Icon";
import type { ComponentProps } from "react";
import type { Img } from "@/lib/types";

export function PreviewCard({ title, text, href, image }: { title: string; text: string; href: string; image?: Img }) {
  return <Link href={href} onClick={event => { if (href.startsWith("#")) { const panel = document.getElementById(href.slice(1)); if (panel?.hasAttribute("popover")) { event.preventDefault(); panel.showPopover(); } } }} className="flex flex-1 flex-col overflow-hidden rounded-xl border border-line bg-white shadow-sm transition hover:shadow-md">
    {image && <div className="relative h-40 shrink-0"><Image src={image.src} alt={image.alt} fill sizes="(min-width: 1024px) 30vw, 100vw" className="object-cover" /></div>}
    <div className="flex-1 p-4"><h3 className="font-display text-xl">{title} <span aria-hidden="true">→</span></h3><p className="mt-1 text-sm text-muted">{text}</p></div>
  </Link>;
}

export function QuickAccess({ label, text, icon, href, target }: { label: string; text: string; icon: ComponentProps<typeof Icon>["name"]; href?: string; target?: string }) {
  const content = <><Icon name={icon} className="size-7 shrink-0 text-leaf-deep" /><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{label}</span><span className="mt-1 block text-xs text-muted">{text}</span></span><span aria-hidden="true">→</span></>;
  const className = "flex items-center gap-3 rounded-xl border border-line bg-leaf/10 px-4 py-3 text-left transition hover:bg-leaf/20";
  return target ? <button className={className} popoverTarget={target}>{content}</button> : <Link className={className} href={href ?? "#"}>{content}</Link>;
}
