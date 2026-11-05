import { test } from "node:test";
import assert from "node:assert/strict";
import { toRiskAlert } from "./alert.ts";

const wrap = (alerta: unknown) => ({ alerta, avisos: [] });

test("each active level is accepted and strings are trimmed", () => {
  for (const nivel of ["amarilla", "naranja", "roja"]) {
    assert.deepEqual(toRiskAlert(wrap({ nivel, titulo: "  Lluvias ", descripcion: " Cuidado " })), {
      nivel,
      titulo: "Lluvias",
      descripcion: "Cuidado",
    });
  }
});

test("missing descripcion becomes an empty string", () => {
  assert.equal(toRiskAlert(wrap({ nivel: "roja", titulo: "T" }))?.descripcion, "");
});

test("verde, null and unknown levels give null", () => {
  assert.equal(toRiskAlert(wrap({ nivel: "verde", titulo: "T" })), null);
  assert.equal(toRiskAlert(wrap(null)), null);
  assert.equal(toRiskAlert(wrap({ nivel: "azul", titulo: "T" })), null);
});

test("blank or missing titulo gives null", () => {
  assert.equal(toRiskAlert(wrap({ nivel: "roja", titulo: "  " })), null);
  assert.equal(toRiskAlert(wrap({ nivel: "roja" })), null);
});

test("garbage input gives null", () => {
  for (const input of [undefined, null, "x", 3, [], {}, wrap("roja"), wrap([])]) {
    assert.equal(toRiskAlert(input), null);
  }
});
