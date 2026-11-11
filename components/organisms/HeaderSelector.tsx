"use client";
import { usePathname } from "next/navigation";
import { SiteHeader } from "./SiteHeader";
import { PreviewHeader } from "./PreviewHeader";

export function HeaderSelector() {
  return usePathname().replace(/\/$/, "") === "/preview/inicio" ? <PreviewHeader /> : <SiteHeader />;
}
