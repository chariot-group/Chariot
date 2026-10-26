import test from "node:test";
import assert from "node:assert/strict";
import { playersCountForTable, totalUsers } from "./manifest.mjs";

test("playersCountForTable many-small", () => {
  assert.equal(playersCountForTable("many-small", 0), 2);
});

test("playersCountForTable few-large", () => {
  assert.equal(playersCountForTable("few-large", 0), 8);
});

test("playersCountForTable mixed-realistic range", () => {
  const rng = () => 0.5;
  assert.equal(playersCountForTable("mixed-realistic", 0, rng), 6);
  assert.equal(playersCountForTable("mixed-realistic", 0, () => 0), 3);
  assert.equal(playersCountForTable("mixed-realistic", 0, () => 0.999), 8);
});

test("totalUsers", () => {
  const manifest = {
    tables: [
      { players: [{}, {}] },
      { players: [{}, {}, {}] },
    ],
  };
  assert.equal(totalUsers(manifest), 2 + 3 + 2);
});
