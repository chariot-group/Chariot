import test from "node:test";
import assert from "node:assert/strict";
import {
  geometricSteps,
  binarySearchNext,
  recommendedOperating,
} from "./discover-plan.mjs";

test("geometricSteps includes max", () => {
  assert.deepEqual(geometricSteps(40, 10), [10, 20, 40]);
  assert.deepEqual(geometricSteps(10, 10), [10]);
});

test("binarySearchNext closes when adjacent", () => {
  assert.equal(binarySearchNext(20, 40), 30);
  assert.equal(binarySearchNext(20, 21), null);
});

test("FR-load-test-capacity — recommended operating is 70% of mix", () => {
  const rec = recommendedOperating(
    { tables: 40, idle: 80, usersInSession: 200 },
    0.7,
  );
  assert.equal(rec.tables, 28);
  assert.equal(rec.idle, 56);
  assert.equal(rec.usersInSession, 140);
});
