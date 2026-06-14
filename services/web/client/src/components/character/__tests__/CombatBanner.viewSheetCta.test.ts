import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const sourcePath = resolve(fileURLToPath(new URL("..", import.meta.url)), "CombatBanner.tsx");

function readSource() {
  return readFileSync(sourcePath, "utf8");
}

describe("CombatBanner view sheet CTA", () => {
  it("nominal: renders the view sheet action as a subtle ghost button inside the stats panel", () => {
    const source = readSource();

    expect(source).toContain('aria-label={t("viewSheet")}');
    expect(source).toContain("rounded-[13px] bg-white/10 px-3 py-1.5");
    expect(source).toContain("text-[11px] font-semibold text-white/70");
  });

  it("edge: keeps the action close to the footer stats instead of pushing it to the far edge", () => {
    const source = readSource();

    expect(source).not.toContain('className="ml-auto flex items-center gap-1 rounded px-2 py-0.5');
    expect(source).toContain("ml-auto flex cursor-pointer shrink-0 items-center gap-1.5");
  });

  it("failure guard: preserves visible keyboard focus on the custom button", () => {
    const source = readSource();

    expect(source).toContain("focus-visible:outline-none");
    expect(source).toContain("focus-visible:ring-2 focus-visible:ring-white/30");
  });
});

describe("CombatBanner own character indicator", () => {
  it("nominal: applies blue ring and text to the player's own character chip", () => {
    const source = readSource();

    expect(source).toContain("isOwnCharacter");
    expect(source).toContain("bg-blue/15 text-blue ring-2 ring-blue/40");
    expect(source).toContain('font-semibold text-blue');
  });

  it("edge: active turn ring takes precedence over own character styling", () => {
    const source = readSource();

    // isActive check comes before isOwnCharacter in the conditional
    expect(source).toMatch(/isActive[\s\S]{0,50}isOwnCharacter/);
  });

  it("failure guard: own character chip has an accessible aria-label", () => {
    const source = readSource();

    expect(source).toContain('t("ownCharacterLabel"');
    expect(source).toContain("chipAriaLabel");
  });
});
