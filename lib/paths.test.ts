import { test } from "node:test";
import assert from "node:assert/strict";
import { pathOf, pickByPath, sortChildren } from "./paths.ts";

test("exact path wins", () => {
  const a = { path: "/historia/" };
  const b = { path: "/historia/2022-2026/" };
  assert.deepEqual(pickByPath([a, b], ["historia", "2022-2026"]), { match: b });
});

test("a flat path that hits a unique child page redirects to the nested one", () => {
  const child = { path: "/historia/2022-2026/" };
  assert.deepEqual(pickByPath([child], ["2022-2026"]), { redirect: "/historia/2022-2026/" });
});

test("same slug under different parents without an exact match is ambiguous", () => {
  const candidates = [{ path: "/a/info/" }, { path: "/b/info/" }];
  assert.equal(pickByPath(candidates, ["info"]), null);
});

test("no candidates gives null", () => {
  assert.equal(pickByPath([], ["x"]), null);
});

test("one-segment post matches", () => {
  const post = { path: "/conclusiones-reunion-de-seguridad/" };
  assert.deepEqual(pickByPath([post], ["conclusiones-reunion-de-seguridad"]), { match: post });
});

test("posts passed before pages win a tie", () => {
  const post = { path: "/igual/", kind: "post" };
  const page = { path: "/igual/", kind: "page" };
  assert.deepEqual(pickByPath([post, page], ["igual"]), { match: post });
  assert.deepEqual(pickByPath([page, post], ["igual"]), { match: page });
});

test("sortChildren orders by menuOrder, then slug descending", () => {
  const items = [
    { menuOrder: 0, slug: "2022-2026" },
    { menuOrder: 0, slug: "2026-2030" },
    { menuOrder: 1, slug: "zzz" },
    { menuOrder: -1, slug: "aaa" },
  ];
  assert.deepEqual(
    sortChildren(items).map((i) => i.slug),
    ["aaa", "2026-2030", "2022-2026", "zzz"],
  );
});

test("sortChildren does not mutate its input", () => {
  const items = [
    { menuOrder: 1, slug: "b" },
    { menuOrder: 0, slug: "a" },
  ];
  sortChildren(items);
  assert.equal(items[0].slug, "b");
});

test("pathOf handles absolute, relative and invalid input", () => {
  assert.equal(pathOf("https://jacelcastillo.com.co/historia/2022-2026/"), "/historia/2022-2026/");
  assert.equal(pathOf("/dignatarios/"), "/dignatarios/");
  assert.equal(pathOf("http://[bad"), "");
});
