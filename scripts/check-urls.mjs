import { LEGACY_PATHS } from "../lib/redirects.ts";

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const wp = (process.env.WP_URL ?? "https://jacelcastillo.com.co").replace(/\/$/, "");

async function wpPaths(type) {
  const paths = [];
  let pages = 1;
  for (let page = 1; page <= pages; page++) {
    const res = await fetch(`${wp}/wp-json/wp/v2/${type}?per_page=100&page=${page}&_fields=link`, {
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`WordPress ${type} page ${page}: ${res.status}`);
    pages = Number(res.headers.get("x-wp-totalpages") ?? 1);
    paths.push(...(await res.json()).map((e) => new URL(e.link).pathname));
  }
  return paths;
}

async function projectPaths() {
  const res = await fetch(`${wp}/wp-json/jac-web/v1/proyectos`, { signal: AbortSignal.timeout(30000) });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`WordPress proyectos: ${res.status}`);
  return (await res.json()).proyectos.map((p) => `/proyectos/${p.slug}/`);
}

async function commissionPaths() {
  const res = await fetch(`${wp}/wp-json/jac-web/v1/comisiones`, { signal: AbortSignal.timeout(30000) });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`WordPress comisiones: ${res.status}`);
  return (await res.json()).comisiones.map((c) => `/comisiones/${c.slug}/`);
}

const wpUrls = [...new Set([...(await wpPaths("posts")), ...(await wpPaths("pages"))])].filter((p) => !(p in LEGACY_PATHS));

const checks = [
  ...["/", "/noticias/", "/comisiones/", "/proyectos/", "/contacto/", "/robots.txt", ...wpUrls, ...(await projectPaths()), ...(await commissionPaths())].map((p) => [[200], p]),
  ...["/x%3F_fields%3Dauthor/", "/no-existe-este-slug/", "/noticias/?categoria=%3Cscript%3E", "/noticias/?page=-1", "/proyectos/no-existe/", "/proyectos/?estado=x", "/comisiones/no-existe/"].map((p) => [[404], p]),
  ...Object.keys(LEGACY_PATHS).map((p) => [[308], p]),
  [[400, 404], "/..%2Fusers/"],
  [[400], "/_next/image/?url=https%3A%2F%2Fevil.com%2Fx.png&w=640&q=75"],
];

const failures = [];
const request = async (path) => {
  try {
    return await fetch(base + path, { redirect: "manual", signal: AbortSignal.timeout(30000) });
  } catch (e) {
    return { status: `error(${e.name})`, headers: new Headers() };
  }
};

let next = 0;
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (next < checks.length) {
      const [expected, path] = checks[next++];
      const { status, headers } = await request(path);
      if (!expected.includes(status)) failures.push(`expected ${expected.join(" or ")} got ${status}  ${path}`);
      else if (path in LEGACY_PATHS) {
        const location = new URL(headers.get("location") ?? "", base).pathname;
        if (location !== LEGACY_PATHS[path]) failures.push(`expected redirect to ${LEGACY_PATHS[path]} got ${location}  ${path}`);
      }
    }
  }),
);

const { headers } = await request("/");
const csp = headers.get("content-security-policy") ?? "";
const headerChecks = [
  [csp.includes("default-src 'self'"), "csp default-src 'self'"],
  [csp.includes("frame-ancestors 'none'"), "csp frame-ancestors 'none'"],
  [headers.get("x-content-type-options") === "nosniff", "x-content-type-options nosniff"],
  [headers.get("referrer-policy") === "strict-origin-when-cross-origin", "referrer-policy"],
  [!headers.has("x-powered-by"), "no x-powered-by"],
  ...(base.startsWith("https:") ? [[headers.has("strict-transport-security"), "strict-transport-security"]] : []),
];
for (const [ok, name] of headerChecks) if (!ok) failures.push(`expected header ${name} on  /`);

const total = checks.length + headerChecks.length;
failures.forEach((f) => console.log(f));
console.log(`${total - failures.length}/${total} passed`);
process.exit(failures.length ? 1 : 0);
