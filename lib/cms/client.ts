function request(url: URL): Promise<Response> {
  return fetch(url, {
    signal: AbortSignal.timeout(15000),
    next: { revalidate: 300, tags: ["wordpress"] },
  });
}

export async function wp<T>(
  path: "posts" | "pages" | "categories",
  params: Record<string, string | number>,
): Promise<{ data: T; totalPages: number } | null> {
  if (!process.env.WP_URL) throw new Error("WP_URL is not set");
  const url = new URL("/wp-json/wp/v2/" + path, process.env.WP_URL);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }
  const res = await request(url);
  if (res.status === 404) return null;
  if (res.status === 400) {
    const body = (await res.json().catch(() => null)) as { code?: string } | null;
    if (body?.code === "rest_post_invalid_page_number") return null;
  }
  if (!res.ok) throw new Error(`WordPress ${res.status} ${url.pathname}`);
  return {
    data: (await res.json()) as T,
    totalPages: Number(res.headers.get("x-wp-totalpages") ?? 1),
  };
}

export async function wpRoute<T>(route: string): Promise<T | null> {
  if (!process.env.WP_URL) throw new Error("WP_URL is not set");
  const url = new URL("/wp-json/" + route, process.env.WP_URL);
  const res = await request(url);
  if (res.status === 404) return null;
  if (!res.ok || !res.headers.get("content-type")?.includes("json")) {
    throw new Error(`WordPress ${res.status} ${url.pathname}`);
  }
  return (await res.json()) as T;
}
