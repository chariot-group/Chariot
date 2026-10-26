import test from "node:test";
import assert from "node:assert/strict";
import { pjPerTableStats, usersInSession } from "./pj-stats.mjs";

test("FR-load-test-capacity — mixed-realistic PJ min/median/max", () => {
  const stats = pjPerTableStats([
    { playersCount: 3 },
    { playersCount: 8 },
    { playersCount: 5 },
  ]);
  assert.equal(stats.min, 3);
  assert.equal(stats.max, 8);
  assert.equal(stats.median, 5);
  assert.equal(stats.mean, 5.33);
  assert.equal(stats.tables, 3);
});

test("usersInSession counts GM + PJs", () => {
  assert.equal(
    usersInSession([{ players: [{}, {}] }, { playersCount: 3 }]),
    3 + 4,
  );
});
