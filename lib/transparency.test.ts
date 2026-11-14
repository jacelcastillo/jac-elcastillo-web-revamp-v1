import { test } from "node:test";
import assert from "node:assert/strict";
import { budgetGroups, budgetTotals, executed, filterDocuments, formatSize, percent, toTransparencyPage } from "./transparency.ts";

const UPLOAD = "https://jacelcastillo.com.co/wp-content/uploads/2024/05/informe.pdf";

const tipos = [
  { valor: "informe", nombre: "Informe de gestión" },
  { valor: "financiero", nombre: "Financiero" },
];

const documento = (extra: Record<string, unknown> = {}) => ({
  id: 7,
  titulo: "Informe de prueba",
  tipo: "financiero",
  fecha: "2024-05-03",
  url: UPLOAD,
  formato: "PDF",
  tamano: 2_516_582,
  ...extra,
});

const rubro = (extra: Record<string, unknown> = {}) => ({
  clase: "egreso",
  grupo: "Funcionamiento",
  nombre: "Gastos de oficina",
  presupuestado: 600_000,
  ejecutado: 80_300,
  ...extra,
});

const vigencia = (extra: Record<string, unknown> = {}) => ({
  anio: 2024,
  nota: "Nota de prueba",
  rubros: [rubro()],
  meses: [],
  ...extra,
});

const page = (extra: Record<string, unknown> = {}) =>
  toTransparencyPage({ tipos, documentos: [documento()], vigencias: [vigencia()], ...extra });

test("valid input maps to types, documents and years", () => {
  const { types, documents, years } = page();
  assert.deepEqual(types, [
    { slug: "informe", name: "Informe de gestión" },
    { slug: "financiero", name: "Financiero" },
  ]);
  assert.deepEqual(documents, [
    {
      id: 7,
      title: "Informe de prueba",
      type: { slug: "financiero", name: "Financiero" },
      date: "2024-05-03",
      url: UPLOAD,
      format: "PDF",
      size: 2_516_582,
    },
  ]);
  assert.deepEqual(years, [
    {
      year: 2024,
      note: "Nota de prueba",
      items: [{ kind: "egreso", group: "Funcionamiento", name: "Gastos de oficina", budgeted: 600_000, executed: 80_300 }],
      months: [],
    },
  ]);
});

test("garbage input gives an empty page", () => {
  for (const json of [null, "x", [], 5, {}, { tipos: 1, documentos: {}, vigencias: "x" }]) {
    assert.deepEqual(toTransparencyPage(json), { types: [], documents: [], years: [] }, JSON.stringify(json));
  }
});

test("documents outside the uploads folder or with an unknown type are dropped", () => {
  const bad = [
    documento({ url: "https://evil.example/x.pdf" }),
    documento({ url: "javascript:alert(1)" }),
    documento({ url: 5 }),
    documento({ tipo: "inventado" }),
    documento({ titulo: " " }),
    documento({ id: "7" }),
  ];
  assert.deepEqual(page({ documentos: bad }).documents, []);
});

test("document fields fall back to empty values", () => {
  const [d] = page({ documentos: [documento({ fecha: "mañana", tamano: -1, formato: 3 })] }).documents;
  assert.equal(d.date, "");
  assert.equal(d.size, 0);
  assert.equal(d.format, "");
});

test("years are sorted from newest to oldest and invalid ones are dropped", () => {
  const { years } = page({
    vigencias: [vigencia({ anio: 2022 }), vigencia({ anio: 2026 }), vigencia({ anio: 1999 }), vigencia({ anio: "2025" }), vigencia({ anio: 2023.5 })],
  });
  assert.deepEqual(years.map((y) => y.year), [2026, 2022]);
});

test("budget items and months are validated and months are sorted", () => {
  const [year] = page({
    vigencias: [
      vigencia({
        rubros: [rubro({ clase: "otro" }), rubro({ grupo: "" }), rubro({ nombre: 3 }), rubro({ presupuestado: -5, ejecutado: "x" })],
        meses: [
          { mes: 9, ingresos: 3, egresos: 4 },
          { mes: 7, ingresos: 1, egresos: 2 },
          { mes: 13, ingresos: 1, egresos: 1 },
          { mes: 0, ingresos: 1, egresos: 1 },
          { mes: "8", ingresos: 1, egresos: 1 },
        ],
      }),
    ],
  }).years;
  assert.deepEqual(year.items.map((i) => [i.budgeted, i.executed]), [[0, 0]]);
  assert.deepEqual(year.months.map((m) => m.month), [7, 9]);
});

test("executed uses the months when there are any, with the months they cover", () => {
  const [year] = page({
    vigencias: [
      vigencia({
        anio: 2026,
        meses: [
          { mes: 7, ingresos: 1_340_200, egresos: 64_974 },
          { mes: 8, ingresos: 1_126_392, egresos: 99_274 },
          { mes: 9, ingresos: 567_200, egresos: 4_184_343 },
        ],
      }),
    ],
  }).years;
  assert.deepEqual(executed(year), { income: 3_033_792, expense: 4_348_591, label: "2026, jul a sep" });
  assert.equal(executed({ ...year, months: [year.months[0]] })?.label, "2026, jul");
});

test("executed falls back to the budget items, or to null with nothing executed", () => {
  const items = [
    { kind: "ingreso", group: "Ingresos", name: "Cuotas", budgeted: 100, executed: 40 },
    { kind: "egreso", group: "Operacionales", name: "Asambleas", budgeted: 50, executed: 10 },
    { kind: "egreso", group: "Operacionales", name: "Eventos", budgeted: 50, executed: 5 },
  ] as const;
  const year = { year: 2023, note: "", items: [...items], months: [] };
  assert.deepEqual(executed(year), { income: 40, expense: 15, label: "2023" });
  assert.equal(executed({ ...year, items: items.map((i) => ({ ...i, executed: 0 })) }), null);
  assert.equal(executed({ ...year, items: [] }), null);
});

test("budgetGroups keeps the order, adds up each group and hides rows at zero", () => {
  const items = [
    { kind: "egreso", group: "Operacionales", name: "Publicidad", budgeted: 150, executed: 0 },
    { kind: "ingreso", group: "Ingresos", name: "Cuotas", budgeted: 10, executed: 5 },
    { kind: "egreso", group: "Funcionamiento", name: "Oficina", budgeted: 600, executed: 80 },
    { kind: "egreso", group: "Operacionales", name: "IVA", budgeted: 0, executed: 0 },
    { kind: "egreso", group: "Operacionales", name: "Asambleas", budgeted: 0, executed: 30 },
    { kind: "egreso", group: "Reservas", name: "Sede", budgeted: 0, executed: 0 },
  ] as const;
  const groups = budgetGroups([...items], "egreso");
  assert.deepEqual(groups.map((g) => [g.group, g.budgeted, g.executed, g.items.map((i) => i.name)]), [
    ["Operacionales", 150, 30, ["Publicidad", "Asambleas"]],
    ["Funcionamiento", 600, 80, ["Oficina"]],
  ]);
  assert.deepEqual(budgetTotals([...items], "egreso"), { budgeted: 750, executed: 110 });
  assert.deepEqual(budgetGroups([...items], "ingreso").map((g) => g.group), ["Ingresos"]);
});

test("percent is null without a budget", () => {
  assert.equal(percent(5, 0), null);
  assert.equal(percent(1, 3), 33);
  assert.equal(percent(150, 100), 150);
});

test("formatSize", () => {
  assert.equal(formatSize(0), "");
  assert.equal(formatSize(512), "512 B");
  assert.equal(formatSize(2048), "2 KB");
  assert.equal(formatSize(2_516_582), "2,4 MB");
});

test("filterDocuments keeps only the chosen type", () => {
  const { documents } = page({ documentos: [documento({ id: 1 }), documento({ id: 2, tipo: "informe" })] });
  assert.deepEqual(filterDocuments(documents, "informe").map((d) => d.id), [2]);
  assert.equal(filterDocuments(documents).length, 2);
});
