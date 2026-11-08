import { clean, text, truncate } from "../html.ts";
import { optimizeImages } from "../images.ts";
import { pathOf, pickByPath, sortChildren } from "../paths.ts";
import type { Category, Entry, Img, SafeHtml, Summary } from "../types.ts";
import { cache } from "react";
import { wp } from "./client.ts";

type Rendered = { rendered: string };
type Media = {
  source_url?: string;
  alt_text?: string;
  media_details?: { width?: number; height?: number };
};
type Term = { id: number; taxonomy: string; slug: string; name: string };
type WpEntry = {
  id?: number;
  slug: string;
  link: string;
  menu_order?: number;
  date: string;
  title: Rendered;
  excerpt: Rendered;
  content: Rendered;
  _embedded?: {
    "wp:featuredmedia"?: Media[];
    "wp:term"?: Term[][];
  };
};

const UNCATEGORIZED = 1;
const PER_PAGE = 9;
const FIELDS = "id,slug,link,menu_order,date,title,excerpt,content,_links,_embedded";
const EMBED = "wp:featuredmedia,wp:term";

function toImage(media?: Media): Img | undefined {
  if (!media?.source_url) return undefined;
  return {
    src: media.source_url,
    alt: media.alt_text ?? "",
    width: media.media_details?.width ?? 1200,
    height: media.media_details?.height ?? 630,
  };
}

function toCategory(terms?: Term[][]): Category | undefined {
  const term = terms
    ?.flat()
    .find((t) => t.taxonomy === "category" && t.id !== UNCATEGORIZED);
  return term && { slug: term.slug, name: term.name };
}

function toSummary(raw: Omit<WpEntry, "content">, excerpt: string): Summary {
  return {
    href: pathOf(raw.link),
    title: text(raw.title.rendered),
    excerpt,
    image: toImage(raw._embedded?.["wp:featuredmedia"]?.[0]),
  };
}

function toPostSummary(raw: Omit<WpEntry, "content">): Summary {
  return {
    ...toSummary(raw, text(raw.excerpt.rendered).replace(/\s*\[…\]$/, "…")),
    date: raw.date,
    category: toCategory(raw._embedded?.["wp:term"]),
  };
}

// WordPress page excerpts keep dead theme buttons and headings; paragraphs of the cleaned HTML do not.
const pageExcerpt = (html: SafeHtml) =>
  truncate(text(html.match(/<p>[\s\S]*?<\/p>/g)?.join(" ") ?? html));

function toEntry(raw: WpEntry, kind: Entry["kind"]): Entry {
  const html = optimizeImages(clean(raw.content.rendered, text(raw.title.rendered)));
  const summary = kind === "post" ? toPostSummary(raw) : toSummary(raw, pageExcerpt(html));
  return { ...summary, kind, html };
}

export async function getEntryByPath(
  segments: string[],
): Promise<{ entry: Entry } | { redirect: string } | null> {
  const query = { slug: segments[segments.length - 1], _fields: FIELDS, _embed: EMBED };
  const [posts, pages] = await Promise.all([
    segments.length === 1 ? wp<WpEntry[]>("posts", query) : null,
    wp<WpEntry[]>("pages", query),
  ]);
  const candidates = [
    ...(posts?.data ?? []).map((raw) => ({ path: pathOf(raw.link), raw, kind: "post" as const })),
    ...(pages?.data ?? []).map((raw) => ({ path: pathOf(raw.link), raw, kind: "page" as const })),
  ];
  const picked = pickByPath(candidates, segments);
  if (!picked) return null;
  if ("redirect" in picked) return picked;
  const { raw, kind } = picked.match;
  const entry = toEntry(raw, kind);
  if (kind === "page" && raw.id !== undefined) {
    const children = await wp<WpEntry[]>("pages", {
      parent: raw.id,
      per_page: 100,
      _fields: FIELDS,
      _embed: EMBED,
    });
    const sorted = sortChildren(
      (children?.data ?? []).map((child) => ({
        menuOrder: child.menu_order ?? 0,
        slug: child.slug,
        summary: toEntry(child, "page"),
      })),
    );
    if (sorted.length) entry.children = sorted.map((c) => c.summary);
  }
  return { entry };
}

export async function getPagesBySlugs(slugs: string[]): Promise<Summary[]> {
  if (slugs.length === 0) return [];
  const res = await wp<WpEntry[]>("pages", {
    slug: slugs.join(","),
    per_page: 100,
    _fields: FIELDS,
    _embed: EMBED,
  });
  const bySlug = new Map((res?.data ?? []).map((raw) => [raw.slug, raw]));
  return slugs.flatMap((slug) => {
    const raw = bySlug.get(slug);
    return raw ? [toEntry(raw, "page")] : [];
  });
}

type WpCategory = { id: number; slug: string; name: string; count: number };

const categories = cache(async (): Promise<WpCategory[]> => {
  const res = await wp<WpCategory[]>("categories", {
    per_page: 100,
    _fields: "id,slug,name,count",
  });
  return (res?.data ?? []).filter((c) => c.count > 0 && c.id !== UNCATEGORIZED);
});

export async function getCategories(): Promise<Category[]> {
  return (await categories())
    .map(({ slug, name }) => ({ slug, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}

export async function getPosts({
  page,
  categoria,
  perPage = PER_PAGE,
}: {
  page: number;
  categoria?: string;
  perPage?: number;
}): Promise<{ items: Summary[]; totalPages: number } | null> {
  const params: Record<string, string | number> = {
    per_page: perPage,
    page,
    _fields: "slug,link,date,title,excerpt,_links,_embedded",
    _embed: "wp:featuredmedia,wp:term",
  };
  if (categoria) {
    const match = (await categories()).find((c) => c.slug === categoria);
    if (!match) return null;
    params.categories = match.id;
  }
  const res = await wp<Omit<WpEntry, "content">[]>("posts", params);
  return res && { items: res.data.map(toPostSummary), totalPages: res.totalPages };
}

export async function getLatest(count: number): Promise<Summary[]> {
  const posts = await getPosts({ page: 1, perPage: count });
  return posts?.items ?? [];
}
