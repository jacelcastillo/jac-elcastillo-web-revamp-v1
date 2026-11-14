import { test } from "node:test";
import assert from "node:assert/strict";
import { listingHref, parseListingQuery, parseTransparencyQuery } from "./listing.ts";

test("empty params default to page 1", () => {
  assert.deepEqual(parseListingQuery({}), { page: 1, categoria: undefined });
});

test("valid page and categoria are accepted", () => {
  assert.deepEqual(parseListingQuery({ page: "12", categoria: "seguridad" }), {
    page: 12,
    categoria: "seguridad",
  });
});

test("invalid page values are rejected", () => {
  for (const page of ["-1", "0", "abc", "01", "", "1000", ["1", "2"]]) {
    assert.equal(parseListingQuery({ page }), null, JSON.stringify(page));
  }
});

test("invalid categoria values are rejected", () => {
  for (const categoria of ["<script>", "", "Seguridad", "a b", ["a", "b"]]) {
    assert.equal(parseListingQuery({ categoria }), null, JSON.stringify(categoria));
  }
});

test("href shapes", () => {
  assert.equal(listingHref("/noticias/", {}), "/noticias/");
  assert.equal(listingHref("/noticias/", { page: 1 }), "/noticias/");
  assert.equal(listingHref("/noticias/", { page: 2 }), "/noticias/?page=2");
  assert.equal(
    listingHref("/noticias/", { categoria: "seguridad" }),
    "/noticias/?categoria=seguridad",
  );
  assert.equal(
    listingHref("/noticias/", { categoria: "seguridad", page: 2 }),
    "/noticias/?categoria=seguridad&page=2",
  );
});

test("transparency query accepts a four digit year and a slug", () => {
  assert.deepEqual(parseTransparencyQuery({}), { anio: undefined, tipo: undefined });
  assert.deepEqual(parseTransparencyQuery({ anio: "2023", tipo: "financiero" }), { anio: 2023, tipo: "financiero" });
  for (const anio of ["99", "20233", "abc", "", "-2023", ["2023", "2024"]]) {
    assert.equal(parseTransparencyQuery({ anio }), null, JSON.stringify(anio));
  }
  for (const tipo of ["<script>", "", "Acta", ["a", "b"]]) {
    assert.equal(parseTransparencyQuery({ tipo }), null, JSON.stringify(tipo));
  }
});

test("transparency href keeps the year and the type", () => {
  assert.equal(listingHref("/transparencia/", {}), "/transparencia/");
  assert.equal(listingHref("/transparencia/", { anio: 2023, tipo: "acta" }), "/transparencia/?anio=2023&tipo=acta");
});
