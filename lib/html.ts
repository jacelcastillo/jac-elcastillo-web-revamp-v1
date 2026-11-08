import sanitizeHtml from "sanitize-html";
import { pathOf } from "./paths.ts";
import type { SafeHtml } from "./types.ts";

const OPENERS = ["»", "&#8221;", '"'];
const CLOSERS = ["»", "&#8243;", "&#8221;", '"'];
const MODULE_START = /\[et_pb_(\w+)(?=[\s\]])/g;
const SHORTCODE = /\[\/?et_pb_[^\]]*\]/g;
// A link on a layout module must never drop the whole section of content it wraps.
const LAYOUT_MODULES = new Set(["section", "row", "row_inner", "column", "column_inner"]);

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  quot: '"',
  apos: "'",
  lt: "<",
  gt: ">",
  nbsp: " ",
  hellip: "…",
  ndash: "–",
  mdash: "—",
  laquo: "«",
  raquo: "»",
};

const escapeAttr = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

// Returns the attributes and the index just after the closing "]".
function parseAttrs(src: string, from: number) {
  const attrs: Record<string, string> = {};
  let i = from;
  while (i < src.length) {
    while (/\s/.test(src[i] ?? "")) i++;
    if (src[i] === "]") return { attrs, end: i + 1 };
    const key = /^[\w-]+/.exec(src.slice(i))?.[0];
    if (!key || src[i + key.length] !== "=") return { attrs, end: i + 1 };
    i += key.length + 1;
    const opener = OPENERS.find((o) => src.startsWith(o, i));
    if (!opener) return { attrs, end: i };
    i += opener.length;
    let close = -1;
    let closerLen = 0;
    for (let j = i; j < src.length && close < 0; j++) {
      for (const c of CLOSERS) {
        const next = src[j + c.length] ?? "";
        if (src.startsWith(c, j) && (next === "]" || /\s/.test(next))) {
          close = j;
          closerLen = c.length;
          break;
        }
      }
    }
    if (close < 0) return { attrs, end: src.length };
    attrs[key] = src.slice(i, close);
    i = close + closerLen;
  }
  return { attrs, end: src.length };
}

function renderModule(name: string, a: Record<string, string>): string {
  if (name === "image") {
    return a.src
      ? `<img src="${escapeAttr(a.src)}" alt="${escapeAttr(a.title_text ?? "")}">`
      : "";
  }
  if (name === "team_member") {
    const label = escapeAttr(a.name ?? "");
    const img = a.image_url
      ? `<img src="${escapeAttr(a.image_url)}" alt="${label}">`
      : "";
    return `<figure>${img}<figcaption><strong>${label}</strong> ${escapeAttr(a.position ?? "")}</figcaption></figure>`;
  }
  if (name === "video") {
    const src = a.src || a.src_webm;
    return src && isVideoFile(src)
      ? `<video src="${escapeAttr(src)}" controls preload="metadata"></video>`
      : "";
  }
  return "";
}

const isVideoFile = (url: string) => /\.(mp4|webm|ogg)$/i.test(pathOf(url));

// Index of the first "]" of the closing tag matching the module opened at `from`.
function findModuleEnd(src: string, name: string, from: number) {
  const open = `[et_pb_${name}`;
  const close = `[/et_pb_${name}]`;
  let depth = 1;
  let i = from;
  while (depth > 0) {
    const nextClose = src.indexOf(close, i);
    if (nextClose < 0) return { inner: src.length, end: src.length };
    const nextOpen = src.indexOf(open, i);
    if (nextOpen >= 0 && nextOpen < nextClose && /[\s\]]/.test(src[nextOpen + open.length] ?? "")) {
      depth++;
      i = nextOpen + open.length;
    } else {
      depth--;
      i = nextClose + close.length;
      if (depth === 0) return { inner: nextClose, end: i };
    }
  }
  return { inner: from, end: from };
}

function expandDiviModules(html: string): string {
  let out = "";
  let last = 0;
  MODULE_START.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = MODULE_START.exec(html))) {
    const { attrs, end } = parseAttrs(html, m.index + m[0].length);
    let rendered: string;
    let next = end;
    const link = attrs.link_option_url;
    if (link !== undefined && !LAYOUT_MODULES.has(m[1])) {
      const mod = findModuleEnd(html, m[1], end);
      const url = decodeEntities(link).trim();
      rendered =
        url === "" || url === "#"
          ? ""
          : `<p><a href="${escapeAttr(url)}">${escapeAttr(text(html.slice(end, mod.inner)))}</a></p>`;
      next = mod.end;
    } else {
      rendered = renderModule(m[1], attrs);
    }
    out += html.slice(last, m.index) + rendered;
    last = next;
    MODULE_START.lastIndex = next;
  }
  return out + html.slice(last);
}

const MAPS_HOSTS = ["maps.google.com", "www.google.com"];

function isMapsEmbed(src: string | undefined): boolean {
  if (!src) return false;
  try {
    const u = new URL(src);
    return (
      u.protocol === "https:" &&
      MAPS_HOSTS.includes(u.hostname) &&
      u.pathname.startsWith("/maps")
    );
  } catch {
    return false;
  }
}

const fold = (s: string) =>
  s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();

// Runs on sanitize-html output, which always double-quotes attributes.
function unwrapPageLinks(html: string): string {
  return html.replace(
    /<a href="([^"]*)"[^>]*>\s*(<img\b[^>]*>)\s*<\/a>/g,
    (whole, href: string, img: string) =>
      /\.[a-z0-9]{2,5}$/i.test(pathOf(decodeEntities(href))) ? whole : img,
  );
}

function dropDuplicateTitle(html: string, title: string): string {
  const m = /<h([2-6])>([\s\S]*?)<\/h\1>/.exec(html);
  if (!m || fold(text(m[2])) !== fold(title)) return html;
  return html.slice(0, m.index) + html.slice(m.index + m[0].length);
}

export function clean(html: string, title?: string): SafeHtml {
  const expanded = expandDiviModules(html).replace(SHORTCODE, "");
  const sanitized = sanitizeHtml(expanded, {
    allowedTags: [
      "p", "br", "h2", "h3", "h4", "h5", "h6", "strong", "b", "em", "i", "u",
      "s", "blockquote", "ul", "ol", "li", "a", "img", "figure", "figcaption",
      "table", "thead", "tbody", "tr", "th", "td", "hr", "video", "iframe",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height"],
      video: ["src", "controls", "preload"],
      iframe: ["src", "title", "loading", "width", "height", "allowfullscreen", "referrerpolicy"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedIframeHostnames: MAPS_HOSTS,
    transformTags: {
      h1: "h2",
      iframe: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, loading: "lazy" },
      }),
      a: (tagName, attribs) =>
        attribs.target === "_blank"
          ? { tagName, attribs: { ...attribs, rel: "noopener noreferrer" } }
          : { tagName, attribs },
    },
    exclusiveFilter: (frame) =>
      frame.tag === "iframe"
        ? !isMapsEmbed(frame.attribs.src)
        : (frame.tag === "p" || frame.tag === "a") &&
          !frame.mediaChildren.length &&
          !frame.text.replace(/&nbsp;|\u00a0/g, "").trim(),
  });
  const unwrapped = unwrapPageLinks(sanitized);
  return (title ? dropDuplicateTitle(unwrapped, title) : unwrapped) as SafeHtml;
}

function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, body: string) => {
    if (body[0] === "#") {
      const code =
        body[1].toLowerCase() === "x"
          ? parseInt(body.slice(2), 16)
          : parseInt(body.slice(1), 10);
      return code <= 0x10ffff ? String.fromCodePoint(code) : whole;
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? whole;
  });
}

export function text(html: string): string {
  return decodeEntities(html.replace(SHORTCODE, "").replace(/<[^>]*>/g, ""))
    .replace(/\s+/g, " ")
    .trim();
}

export const isSlug = (s: string): boolean => /^[a-z0-9-]{1,200}$/.test(s);

export function truncate(text: string, max = 180): string {
  if (text.length <= max) return text;
  const head = text.slice(0, max + 1);
  const space = head.lastIndexOf(" ");
  const cut = space > 0 ? head.slice(0, space) : text.slice(0, max);
  return cut.replace(/[\s.,;:!?¡¿-]+$/, "") + "…";
}
