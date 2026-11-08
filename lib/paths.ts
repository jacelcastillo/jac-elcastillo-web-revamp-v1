export function pathOf(url: string): string {
  try {
    return new URL(url, "https://placeholder.invalid").pathname;
  } catch {
    return "";
  }
}

export function pickByPath<T extends { path: string }>(
  candidates: T[],
  segments: string[],
): { match: T } | { redirect: string } | null {
  const requested = `/${segments.join("/")}/`;
  const exact = candidates.find((c) => c.path === requested);
  if (exact) return { match: exact };
  return candidates.length === 1 ? { redirect: candidates[0].path } : null;
}

export function sortChildren<T extends { menuOrder: number; slug: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.menuOrder - b.menuOrder || b.slug.localeCompare(a.slug));
}
