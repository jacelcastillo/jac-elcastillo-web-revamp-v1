import { test } from "node:test";
import assert from "node:assert/strict";
import { commissionSections, toCommissionsPage } from "./commissions.ts";
import { LEGACY_PATHS } from "./redirects.ts";

const tipos = [
  { valor: "ordinaria", nombre: "Comisiones de trabajo" },
  { valor: "accidental", nombre: "Comisiones accidentales" },
  { valor: "iniciativa", nombre: "Nuevas iniciativas" },
  { valor: "organo", nombre: "Órganos de la Junta" },
];
const estados = [
  { valor: "activa", nombre: "Activa" },
  { valor: "sin-coordinacion", nombre: "Sin coordinación" },
  { valor: "verificar", nombre: "Pendiente de verificar" },
];

const commission = (extra: Record<string, unknown> = {}) => ({
  slug: "comision-de-prueba",
  nombre: "Comisión de prueba",
  nombre_corto: "Prueba",
  tipo: "ordinaria",
  estado: "activa",
  fundamento: "Estatutos de prueba, art. 1",
  resumen: "Resumen de prueba",
  contenido: "<p>Funciones de prueba</p>",
  ...extra,
});

const page = (...comisiones: unknown[]) => toCommissionsPage({ tipos, estados, comisiones });

test("valid input maps to types, statuses and commissions", () => {
  const { types, statuses, commissions } = page(commission());
  assert.deepEqual(types.map((t) => t.slug), ["ordinaria", "accidental", "iniciativa", "organo"]);
  assert.deepEqual(statuses, [
    { slug: "activa", name: "Activa" },
    { slug: "sin-coordinacion", name: "Sin coordinación" },
    { slug: "verificar", name: "Pendiente de verificar" },
  ]);
  const [c] = commissions;
  assert.equal(c.slug, "comision-de-prueba");
  assert.equal(c.name, "Comisión de prueba");
  assert.equal(c.shortName, "Prueba");
  assert.deepEqual(c.type, { slug: "ordinaria", name: "Comisiones de trabajo" });
  assert.deepEqual(c.status, { slug: "activa", name: "Activa" });
  assert.equal(c.basis, "Estatutos de prueba, art. 1");
  assert.equal(c.summary, "Resumen de prueba");
  assert.match(c.html, /<p>Funciones de prueba<\/p>/);
});

test("an unknown status drops the commission", () => {
  assert.equal(page(commission({ estado: "Bad Value" })).commissions.length, 0);
});

test("garbage input gives an empty page", () => {
  for (const input of [null, undefined, "x", 3, [], {}, { tipos: 1, estados: 1, comisiones: 1 }]) {
    assert.deepEqual(toCommissionsPage(input), { types: [], statuses: [], commissions: [] });
  }
});

test("malformed commissions are dropped", () => {
  const bad = [
    null,
    "x",
    commission({ slug: "Bad Slug" }),
    commission({ slug: 5 }),
    commission({ nombre: " " }),
    commission({ tipo: "desconocido" }),
    commission({ estado: "desconocido" }),
  ];
  assert.equal(page(...bad, commission()).commissions.length, 1);
});

test("missing short name falls back to the name and text fields are trimmed", () => {
  const [c] = page(commission({ nombre_corto: " ", fundamento: 5, resumen: "  Resumen  " })).commissions;
  assert.equal(c.shortName, "Comisión de prueba");
  assert.equal(c.basis, "");
  assert.equal(c.summary, "Resumen");
});

test("content links keep relative and https hrefs", () => {
  const [c] = page(
    commission({ contenido: '<p><a href="/historia/2026-2030/">Junta</a> <a href="https://gestiondelriesgo.jacelcastillo.com.co">Riesgo</a></p>' }),
  ).commissions;
  assert.match(c.html, /href="\/historia\/2026-2030\/"/);
  assert.match(c.html, /href="https:\/\/gestiondelriesgo\.jacelcastillo\.com\.co"/);
});

test("commissionSections keeps the order of tipos and skips empty sections", () => {
  const sections = commissionSections(
    page(
      commission({ slug: "uno", nombre_corto: "Uno", tipo: "organo" }),
      commission({ slug: "dos", nombre_corto: "Dos" }),
      commission({ slug: "tres", nombre_corto: "Tres", estado: "verificar" }),
    ),
  );
  assert.deepEqual(sections.map((s) => s.title), ["Comisiones de trabajo", "Órganos de la Junta"]);
  assert.deepEqual(sections[0].items.map((i) => i.title), ["Dos", "Tres"]);
  assert.deepEqual(sections[0].items[0], {
    href: "/comisiones/dos/",
    title: "Dos",
    excerpt: "Resumen de prueba",
    category: { slug: "activa", name: "Activa" },
  });
  assert.deepEqual(commissionSections(page()), []);
});

test("legacy paths end in a slash and point to commission pages or transparency", () => {
  for (const [from, to] of Object.entries(LEGACY_PATHS)) {
    assert.match(from, /^\/[a-z0-9-]+\/$/);
    assert.match(to, /^(\/comisiones\/([a-z0-9-]+\/)?|\/transparencia\/)$/);
    assert.notEqual(from, to);
  }
  assert.equal(Object.keys(LEGACY_PATHS).length, 12);
});
