import type { SafeHtml } from "./types.ts";

export const UPLOADS = "https://jacelcastillo.com.co/wp-content/uploads/";
const WIDTHS = [640, 828, 1080, 1920];
const SRC_WIDTH = 1080;
const QUALITY = 75;
const SIZES = "(min-width: 768px) 768px, 100vw";

const optimizerUrl = (src: string, width: number) =>
  `/_next/image/?url=${encodeURIComponent(src)}&amp;w=${width}&amp;q=${QUALITY}`;

// Runs on sanitize-html output, which always double-quotes attributes and escapes "&" as "&amp;".
export function optimizeImages(html: SafeHtml): SafeHtml {
  let index = 0;
  return html.replace(/<img\b[^>]*>/g, (tag) => {
    // The first image can be the page's LCP, so only the ones after it load lazily.
    const lazy = index++ > 0 ? ' loading="lazy" decoding="async"' : "";
    const escaped = /\ssrc="([^"]*)"/.exec(tag)?.[1];
    if (!escaped?.startsWith(UPLOADS)) return tag;
    const src = escaped.replace(/&amp;/g, "&");
    const srcset = WIDTHS.map((w) => `${optimizerUrl(src, w)} ${w}w`).join(", ");
    return tag.replace(
      /\ssrc="[^"]*"/,
      ` src="${optimizerUrl(src, SRC_WIDTH)}" srcset="${srcset}" sizes="${SIZES}"${lazy}`,
    );
  }) as SafeHtml;
}
