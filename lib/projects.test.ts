import { test } from "node:test";
import assert from "node:assert/strict";
import { categoriesOf, filterProjects, formatCOP, participantsText, periodText, toProjectsPage } from "./projects.ts";
import { listingHref, parseProjectQuery } from "./listing.ts";

const UPLOAD = "https://jacelcastillo.com.co/wp-content/uploads/2026/01/portada.jpg";

const estados = [
  { valor: "planificacion", nombre: "En planificación" },
  { valor: "progreso", nombre: "En progreso" },
];

const project = (extra: Record<string, unknown> = {}) => ({
  slug: "proyecto-de-prueba",
  titulo: "Proyecto de prueba",
  resumen: "Resumen de prueba",
  estado: "progreso",
  avance: 40,
  inicio: "2024-03-01",
  fin: "",
  presupuesto: { total: 1000, ejecutado: 400 },
  aliados: "Aliado de prueba Uno,\nAliado de prueba Dos",
  categorias: [{ slug: "obras", nombre: "Obras" }],
  imagen: null,
  contenido: "<p>Texto de prueba</p>",
  ...extra,
});

const page = (...proyectos: unknown[]) => toProjectsPage({ estados, proyectos });

test("valid input maps to statuses and projects", () => {
  const { statuses, projects } = page(project({ imagen: { url: UPLOAD, ancho: 800, alto: 500 } }));
  assert.deepEqual(statuses, [
    { slug: "planificacion", name: "En planificación" },
    { slug: "progreso", name: "En progreso" },
  ]);
  const [p] = projects;
  assert.equal(p.slug, "proyecto-de-prueba");
  assert.equal(p.title, "Proyecto de prueba");
  assert.deepEqual(p.status, { slug: "progreso", name: "En progreso" });
  assert.equal(p.progress, 40);
  assert.equal(p.start, "2024-03-01");
  assert.equal(p.end, "");
  assert.deepEqual(p.budget, { total: 1000, executed: 400 });
  assert.equal(p.partners, "Aliado de prueba Uno, Aliado de prueba Dos");
  assert.deepEqual(p.categories, [{ slug: "obras", name: "Obras" }]);
  assert.deepEqual(p.image, { src: UPLOAD, alt: "", width: 800, height: 500 });
  assert.match(p.html, /<p>Texto de prueba<\/p>/);
});

test("comision maps to a category and is optional", () => {
  const commission = { slug: "cultura", nombre: "Cultura" };
  assert.deepEqual(page(project({ comision: commission })).projects[0].commission, { slug: "cultura", name: "Cultura" });
  for (const comision of [null, "cultura", 3, {}, { slug: "No Valido", nombre: "X" }, { slug: "cultura", nombre: "" }]) {
    assert.equal(page(project({ comision })).projects[0].commission, undefined);
  }
  assert.equal(page(project()).projects[0].commission, undefined);
});

test("garbage input gives empty pages", () => {
  for (const input of [null, undefined, "x", 3, [], {}, { estados: 1, proyectos: 1 }]) {
    assert.deepEqual(toProjectsPage(input), { statuses: [], projects: [] });
  }
});

test("malformed projects are dropped", () => {
  const bad = [
    null,
    "x",
    project({ slug: "Bad Slug" }),
    project({ slug: 5 }),
    project({ titulo: " " }),
    project({ estado: "desconocido" }),
  ];
  assert.deepEqual(page(...bad, project()).projects.length, 1);
});

test("numbers, dates and lists fall back to empty values", () => {
  const [p] = page(
    project({
      avance: 250,
      inicio: "marzo",
      fin: 5,
      presupuesto: { total: -1, ejecutado: "9" },
      categorias: [null, { slug: "A B", nombre: "x" }, { slug: "ok", nombre: "" }],
      imagen: { url: "https://example.invalid/a.jpg", ancho: 1, alto: 1 },
    }),
  ).projects;
  assert.equal(p.progress, 100);
  assert.equal(p.start, "");
  assert.equal(p.end, "");
  assert.deepEqual(p.budget, { total: 0, executed: 0 });
  assert.deepEqual(p.categories, []);
  assert.equal(p.image, undefined);
  assert.equal(page(project({ presupuesto: null })).projects[0].budget.total, 0);
});

test("filterProjects combines estado and categoria", () => {
  const { projects } = page(
    project({ slug: "uno" }),
    project({ slug: "dos", estado: "planificacion", categorias: [{ slug: "ambiente", nombre: "Ambiente" }] }),
    project({ slug: "tres", categorias: [] }),
  );
  const slugs = (q: { categoria?: string; estado?: string }) => filterProjects(projects, q).map((p) => p.slug);
  assert.deepEqual(slugs({}), ["uno", "dos", "tres"]);
  assert.deepEqual(slugs({ estado: "progreso" }), ["uno", "tres"]);
  assert.deepEqual(slugs({ categoria: "ambiente" }), ["dos"]);
  assert.deepEqual(slugs({ categoria: "obras", estado: "planificacion" }), []);
});

test("filterProjects filters by comision", () => {
  const { projects } = page(
    project({ slug: "uno", comision: { slug: "cultura", nombre: "Cultura" } }),
    project({ slug: "dos", comision: { slug: "empresarial", nombre: "Empresarial" } }),
    project({ slug: "tres" }),
  );
  const slugs = (comision: string) => filterProjects(projects, { comision }).map((p) => p.slug);
  assert.deepEqual(slugs("cultura"), ["uno"]);
  assert.deepEqual(slugs("empresarial"), ["dos"]);
  assert.deepEqual(slugs("otra"), []);
});

test("categoriesOf lists each category once, sorted in Spanish", () => {
  const { projects } = page(
    project({ categorias: [{ slug: "obras", nombre: "Obras" }, { slug: "ambiente", nombre: "Ambiente" }] }),
    project({ categorias: [{ slug: "obras", nombre: "Obras" }, { slug: "cultura", nombre: "Ñandú" }] }),
  );
  assert.deepEqual(categoriesOf(projects).map((c) => c.name), ["Ambiente", "Ñandú", "Obras"]);
  assert.deepEqual(categoriesOf([]), []);
});

test("periodText follows the status table without shifting the day", () => {
  assert.equal(periodText("planificacion", "2025-03-01"), "Inicia mar 2025");
  assert.equal(periodText("planificacion"), "Inicio por definir");
  assert.equal(periodText("planificacion", "", "2025-12-31"), "Inicio por definir");
  assert.equal(periodText("progreso", "2024-03-01", "2024-12-31"), "En curso hasta dic 2024");
  assert.equal(periodText("progreso", "", "2024-12-31"), "En curso hasta dic 2024");
  assert.equal(periodText("progreso", "2024-03-01"), "En curso desde mar 2024");
  assert.equal(periodText("progreso"), "En curso");
  assert.equal(periodText("completado", "2024-01-01", "2024-10-31"), "Completado oct 2024");
  assert.equal(periodText("completado", "2024-01-01"), "Completado");
  assert.equal(periodText("completado"), "Completado");
  assert.equal(periodText("suspendido", "2024-03-01"), "Suspendido (inició mar 2024)");
  assert.equal(periodText("suspendido", "", "2024-12-31"), "Suspendido");
  assert.equal(periodText("suspendido"), "Suspendido");
  assert.equal(periodText("progreso", "2025-01-01", "2025-01-31"), "En curso hasta ene 2025");
  assert.equal(periodText("desconocido", "2025-01-01"), "");
});

test("participantsText pluralizes and falls back to Por definir", () => {
  assert.equal(participantsText(0), "Por definir");
  assert.equal(participantsText(1), "1 participante");
  assert.equal(participantsText(45), "45 participantes");
});

test("location and participants are parsed defensively", () => {
  const [ok] = page(project({ ubicacion: " Vereda de prueba ", participantes: 45 })).projects;
  assert.equal(ok.location, "Vereda de prueba");
  assert.equal(ok.participants, 45);
  for (const participantes of [-5, "9", 1.5, null, undefined]) {
    const [p] = page(project({ ubicacion: 5, participantes })).projects;
    assert.equal(p.location, "");
    assert.equal(p.participants, 0);
  }
  assert.equal(page(project({ participantes: 99_999_999 })).projects[0].participants, 1_000_000);
});

test("formatCOP uses es-CO pesos without decimals", () => {
  assert.equal(formatCOP(1500000).replace(/\s/g, " "), "$ 1.500.000");
  assert.equal(formatCOP(0).replace(/\s/g, " "), "$ 0");
});

test("parseProjectQuery accepts slugs only", () => {
  assert.deepEqual(parseProjectQuery({}), { categoria: undefined, estado: undefined });
  assert.deepEqual(parseProjectQuery({ categoria: "obras", estado: "progreso" }), {
    categoria: "obras",
    estado: "progreso",
  });
  for (const params of [{ estado: "<x>" }, { estado: "" }, { estado: ["a", "b"] }, { categoria: "A B" }]) {
    assert.equal(parseProjectQuery(params), null, JSON.stringify(params));
  }
});

test("listingHref keeps estado with categoria", () => {
  assert.equal(listingHref("/proyectos/", { estado: "progreso" }), "/proyectos/?estado=progreso");
  assert.equal(
    listingHref("/proyectos/", { categoria: "obras", estado: "progreso" }),
    "/proyectos/?categoria=obras&estado=progreso",
  );
});
