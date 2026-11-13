import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guards FR-web-first-load-performance (Slow-network authentication round trip, requirement 11):
 * the modules the root layout renders before authentication must not statically reach the
 * authenticated shell. Static imports are followed transitively; `import()` is not (on demand).
 */
const SRC = path.resolve(__dirname, "../../..");

/** Client entry points rendered by `app/[locale]/layout.tsx` before Keycloak has authenticated. */
const AUTH_GATE_ENTRIES = [
  "app/[locale]/layout.tsx",
  "app/[locale]/page.tsx",
  "providers/KeycloakProvider.tsx",
  "components/layout/AuthenticatedShellGate.tsx",
  "components/layout/AppShellSkeleton.tsx",
];

/** Shell-only modules (and heavy libraries) that the gate must fetch on demand only. */
const FORBIDDEN_MODULES = [
  "@/providers/ReduxProvider",
  "@/store",
  "@/services/ApiService",
  "@/components/layout/AuthenticatedShell",
  "@/components/layout/Sidebar",
  "@/components/layout/Header",
  "@/components/PostLoginNavigator",
  "@/components/SessionCharacterSyncClientDynamic",
  "@/components/dialogs/SessionLobbyDialogDynamic",
  "@/lib/sessionSocketPool",
  "@/components/home/RootPageContent",
  "@/components/character/CharacterTabs",
  "axios",
  "redux-persist",
  "socket.io-client",
  "react-toastify",
  "lucide-react",
];

function staticImports(source: string): string[] {
  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  return [
    ...withoutComments.matchAll(/^\s*(?:import|export)\s+(?!type\b)(?:[^;]*?\sfrom\s+)?["']([^"']+)["'];?/gm),
  ].map((match) => match[1]);
}

function resolveAlias(specifier: string): string | null {
  if (!specifier.startsWith("@/")) return null;
  const base = path.join(SRC, specifier.slice(2));
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts"), path.join(base, "index.tsx")]) {
    if (existsSync(candidate) && !candidate.endsWith(path.sep) && path.extname(candidate)) return candidate;
  }
  return null;
}

/** Every module statically reachable from the entries, with the chain that reached it. */
function reachableModules(entries: string[]): Map<string, string[]> {
  const reached = new Map<string, string[]>();
  const queue = entries.map((entry) => ({ file: path.join(SRC, entry), chain: [entry] }));
  const visited = new Set<string>();

  while (queue.length > 0) {
    const { file, chain } = queue.shift()!;
    if (visited.has(file)) continue;
    visited.add(file);

    for (const specifier of staticImports(readFileSync(file, "utf8"))) {
      if (!reached.has(specifier)) reached.set(specifier, [...chain, specifier]);
      const resolved = resolveAlias(specifier);
      if (resolved) queue.push({ file: resolved, chain: [...chain, specifier] });
    }
  }
  return reached;
}

describe("auth gate initial bundle (FR-web-first-load-performance)", () => {
  const reached = reachableModules(AUTH_GATE_ENTRIES);

  it.each(FORBIDDEN_MODULES)("does not statically reach %s", (forbidden) => {
    const hit = [...reached.entries()].find(
      ([specifier]) => specifier === forbidden || specifier.startsWith(`${forbidden}/`),
    );
    expect(hit?.[1].join(" → ") ?? null).toBeNull();
  });

  it("nominal: keycloak-js and the auth skeleton are part of the gate", () => {
    expect(reached.has("keycloak-js")).toBe(true);
    expect(reached.has("@/components/layout/AppShellSkeleton")).toBe(true);
  });

  it("guard: session clients are mounted once, by the authenticated shell only (no duplicate socket)", () => {
    const shellSource = readFileSync(path.join(SRC, "components/layout/AuthenticatedShell.tsx"), "utf8");
    const layoutSource = readFileSync(path.join(SRC, "app/[locale]/layout.tsx"), "utf8");

    expect(shellSource.match(/<SessionCharacterSyncClientDynamic \/>/g)).toHaveLength(1);
    expect(shellSource.match(/<SessionLobbyDialogDynamic \/>/g)).toHaveLength(1);
    expect(layoutSource).not.toMatch(/SessionCharacterSyncClient|SessionLobbyDialog|ReduxProvider/);
  });
});
