import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const sourcePath = resolve(fileURLToPath(new URL("..", import.meta.url)), "CombatBanner.tsx");

function readSource() {
  return readFileSync(sourcePath, "utf8");
}

describe("CombatBanner view sheet CTA", () => {
  it("nominal: renders the view sheet action as a colored combat footer CTA", () => {
    const source = readSource();

    expect(source).toContain('aria-label={t("viewSheet")}');
    expect(source).toContain("rounded-[15px] bg-blue px-3 py-1.5");
    expect(source).toContain("text-xs font-bold text-black");
  });

  it("edge: keeps the action close to the footer stats instead of pushing it to the far edge", () => {
    const source = readSource();

    expect(source).not.toContain('className="ml-auto flex items-center gap-1 rounded px-2 py-0.5');
    expect(source).toContain("flex shrink-0 items-center gap-1.5");
  });

  it("failure guard: preserves visible keyboard focus on the custom button", () => {
    const source = readSource();

    expect(source).toContain("focus-visible:outline-none");
    expect(source).toContain("focus-visible:ring-2 focus-visible:ring-blue");
  });
});
