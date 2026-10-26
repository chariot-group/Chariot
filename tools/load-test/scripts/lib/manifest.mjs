import fs from "fs";
import path from "path";
import { getLoadTestRoot } from "./env.mjs";

export function manifestPath(runId) {
  return path.join(getLoadTestRoot(), "manifests", `manifest-${runId}.json`);
}

export function readManifest(runId) {
  const file = manifestPath(runId);
  if (!fs.existsSync(file)) {
    throw new Error(`Manifest introuvable : ${file}`);
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function writeManifest(manifest) {
  const dir = path.join(getLoadTestRoot(), "manifests");
  fs.mkdirSync(dir, { recursive: true });
  const file = manifestPath(manifest.runId);
  fs.writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return file;
}

/** @param {'many-small'|'few-large'|'mixed-realistic'} profile */
export function playersCountForTable(profile, tableIndex, rng = Math.random) {
  if (profile === "many-small") return 2;
  if (profile === "few-large") return 8;
  return 3 + Math.floor(rng() * 6);
}

export function shouldJoinSession(role) {
  return role === "gm" || role === "player";
}

export function listAccounts(manifest) {
  const accounts = [];
  for (const table of manifest.tables ?? []) {
    accounts.push({ ...table.gm, role: "gm", tableIndex: table.index, sessionCode: table.sessionCode });
    for (const player of table.players) {
      accounts.push({
        ...player,
        role: "player",
        tableIndex: table.index,
        sessionCode: table.sessionCode,
      });
    }
  }
  for (const idle of manifest.idleUsers ?? []) {
    accounts.push({ ...idle, role: "idle" });
  }
  return accounts;
}

export function sessionUserCount(manifest, tableLimit) {
  const slice = (manifest.tables ?? []).slice(0, tableLimit);
  return slice.reduce((n, t) => n + 1 + (t.players?.length ?? 0), 0);
}

export function totalUsers(manifest) {
  const session = (manifest.tables ?? []).reduce((sum, t) => sum + 1 + t.players.length, 0);
  return session + (manifest.idleUsers?.length ?? 0);
}
