import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const sidebarSourcePath = resolve(fileURLToPath(new URL("..", import.meta.url)), "index.tsx");
const layoutSourcePath = resolve(
  fileURLToPath(new URL("../../../../app/[locale]/layout.tsx", import.meta.url)),
);

function readSidebarSource() {
  return readFileSync(sidebarSourcePath, "utf8");
}

function readLayoutSource() {
  return readFileSync(layoutSourcePath, "utf8");
}

describe("Sidebar footer app version", () => {
  it("nominal: displays the app version below the sidebar action button", () => {
    const source = readSidebarSource();

    expect(source).toContain("const appVersion = process.env.NEXT_PUBLIC_APP_VERSION");
    expect(source.indexOf("<ActionButton />")).toBeLessThan(source.indexOf("Chariot v{appVersion}"));
  });

  it("edge: keeps the footer version tiny and unobtrusive", () => {
    const source = readSidebarSource();

    expect(source).toContain("text-center text-[10px] leading-none text-white/45");
  });

  it("failure guard: removes the global overlay version from the app layout", () => {
    const source = readLayoutSource();

    expect(source).not.toContain("Chariot v{appVersion}");
    expect(source).not.toContain("NEXT_PUBLIC_APP_VERSION");
  });
});
