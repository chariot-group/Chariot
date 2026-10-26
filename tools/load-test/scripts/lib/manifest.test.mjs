import test from "node:test";
import assert from "node:assert/strict";
import {
  playersCountForTable,
  totalUsers,
  shouldJoinSession,
  listAccounts,
} from "./manifest.mjs";

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

test("totalUsers includes idle users", () => {
  const manifest = {
    tables: [{ players: [{}, {}] }],
    idleUsers: [{ username: "a" }, { username: "b" }],
  };
  assert.equal(totalUsers(manifest), 3 + 2);
});

test("FR-load-test-capacity — idle users never join a session", () => {
  assert.equal(shouldJoinSession("idle"), false);
  assert.equal(shouldJoinSession("gm"), true);
  assert.equal(shouldJoinSession("player"), true);
  const accounts = listAccounts({
    tables: [{ gm: { username: "gm" }, players: [{ username: "p" }], index: 0 }],
    idleUsers: [{ username: "idle-0" }],
  });
  assert.equal(accounts.filter((a) => a.role === "idle").length, 1);
  assert.ok(accounts.every((a) => a.role !== "idle" || !shouldJoinSession(a.role)));
});
