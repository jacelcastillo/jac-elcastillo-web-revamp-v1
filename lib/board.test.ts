import { test } from "node:test";
import assert from "node:assert/strict";
import { isTerm, toBoardTerms } from "./board.ts";

const UPLOAD = "https://jacelcastillo.com.co/wp-content/uploads/2026/01/persona.jpg";

const member = (extra: Record<string, unknown> = {}) => ({
  id: 1,
  nombre: "Persona de prueba Uno",
  cargo: "presidencia",
  cargo_nombre: "Presidencia",
  detalle: "",
  foto: null,
  ...extra,
});

const wrap = (...dignatarios: unknown[]) => ({ periodos: [{ periodo: "2026-2030", dignatarios }] });

test("valid input maps to terms and members", () => {
  const photo = { url: UPLOAD, ancho: 683, alto: 1024 };
  assert.deepEqual(toBoardTerms(wrap(member(), member({ nombre: " Persona Dos ", detalle: "Suplente", foto: photo }))), [
    {
      term: "2026-2030",
      members: [
        { name: "Persona de prueba Uno", role: "Presidencia", detail: "" },
        {
          name: "Persona Dos",
          role: "Presidencia",
          detail: "Suplente",
          photo: { src: UPLOAD, alt: "", width: 683, height: 1024 },
        },
      ],
    },
  ]);
});

test("garbage input gives an empty list", () => {
  for (const input of [null, undefined, "x", 3, [], {}, { periodos: null }, { periodos: {} }, { periodos: "x" }]) {
    assert.deepEqual(toBoardTerms(input), []);
  }
});

test("malformed terms and members are dropped", () => {
  const json = {
    periodos: [
      null,
      "x",
      { periodo: 2026, dignatarios: [member()] },
      { periodo: "26-30", dignatarios: [member()] },
      { periodo: "2022-2026" },
      { periodo: "2018-2022", dignatarios: [null, 3, member({ nombre: "" }), member({ nombre: 7 }), member({ cargo_nombre: null }), member({ nombre: "Persona Tres" })] },
    ],
  };
  assert.deepEqual(toBoardTerms(json), [
    { term: "2018-2022", members: [{ name: "Persona Tres", role: "Presidencia", detail: "" }] },
  ]);
});

test("a non-string detalle becomes an empty string", () => {
  assert.equal(toBoardTerms(wrap(member({ detalle: 5 })))[0].members[0].detail, "");
});

test("photos need an uploads url and positive sizes", () => {
  const bad = [
    { url: UPLOAD, ancho: 0, alto: 10 },
    { url: UPLOAD, ancho: 10, alto: -1 },
    { url: UPLOAD, ancho: "10", alto: 10 },
    { url: UPLOAD, ancho: 10 },
    { url: 5, ancho: 10, alto: 10 },
    "x",
  ];
  for (const foto of bad) {
    assert.equal(toBoardTerms(wrap(member({ foto })))[0].members[0].photo, undefined);
  }
});

test("a photo from a foreign host is dropped but the member stays", () => {
  const foto = { url: "https://example.invalid/wp-content/uploads/a.jpg", ancho: 10, alto: 10 };
  const [{ members }] = toBoardTerms(wrap(member({ foto })));
  assert.equal(members.length, 1);
  assert.equal(members[0].photo, undefined);
});

test("a lookalike host is dropped", () => {
  const foto = { url: "https://jacelcastillo.com.co.evil.test/wp-content/uploads/a.jpg", ancho: 10, alto: 10 };
  assert.equal(toBoardTerms(wrap(member({ foto })))[0].members[0].photo, undefined);
});

test("isTerm accepts YYYY-YYYY only", () => {
  assert.equal(isTerm("2026-2030"), true);
  for (const slug of ["2026", "2026-30", "26-2030", "2026-2030-1", "a2026-2030", "2026-2030a", "historia", ""]) {
    assert.equal(isTerm(slug), false);
  }
});
