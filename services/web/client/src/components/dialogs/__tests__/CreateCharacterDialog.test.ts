import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CREATE_CHARACTER_DIALOG_CONTENT,
  CREATE_CHARACTER_LIBRARY_SECTION,
  CREATE_CHARACTER_MANUAL_GROUP,
  CREATE_CHARACTER_NPC_BUTTON,
  CREATE_CHARACTER_PLAYER_BUTTON,
} from "@/components/dialogs/createCharacterDialogStyles";

const dialogSource = readFileSync(
  resolve(fileURLToPath(new URL("..", import.meta.url)), "CreateCharacterDialog.tsx"),
  "utf8",
);

describe("CreateCharacterDialog — styles", () => {
  it("nominal: player button is the white primary button, NPC button the dark secondary one", () => {
    const player = cn(
      buttonVariants({
        variant: "primary",
        className: CREATE_CHARACTER_PLAYER_BUTTON,
      }),
    );
    const npc = cn(
      buttonVariants({
        variant: "secondary",
        className: CREATE_CHARACTER_NPC_BUTTON,
      }),
    );

    expect(player).toContain("bg-white text-black");
    expect(player).not.toContain("bg-primary");
    expect(player).toContain("focus-visible:ring-2");
    expect(npc).toContain("bg-gray-middle-light text-white");
    expect(npc).not.toMatch(/(^|\s)bg-white(\s|$)/);
    expect(dialogSource).toMatch(/variant="primary"\s+aria-label=\{t\("createCharacterPlayerAriaLabel"\)\}/);
    expect(dialogSource).toMatch(/className=\{CREATE_CHARACTER_NPC_BUTTON\}/);
    expect(dialogSource).toMatch(/<Bot aria-hidden="true" \/>/);
  });

  it("edge: manual buttons stay on one line, side by side from sm and stacked on mobile", () => {
    const player = cn(
      buttonVariants({
        variant: "primary",
        className: CREATE_CHARACTER_PLAYER_BUTTON,
      }),
    );

    expect(player).toContain("whitespace-nowrap");
    expect(player).toContain("h-9");
    expect(CREATE_CHARACTER_MANUAL_GROUP).toContain("grid-cols-1");
    expect(CREATE_CHARACTER_MANUAL_GROUP).toContain("sm:grid-cols-2");
    expect(CREATE_CHARACTER_DIALOG_CONTENT).toContain("gap-6");
    expect(CREATE_CHARACTER_DIALOG_CONTENT).not.toContain("dialog-close");
    expect(CREATE_CHARACTER_DIALOG_CONTENT).not.toMatch(/(^|\s)p-/);
    expect(dialogSource).toContain('<DialogTitle>{t("createCharacterDialogTitle")}</DialogTitle>');
  });

  it("failure guard: library section has no card frame and stays dimmed when the Codex is unavailable", () => {
    expect(CREATE_CHARACTER_LIBRARY_SECTION).not.toMatch(/(^|\s)(border|bg-|rounded|p-\d)/);
    expect(dialogSource).toContain('!isCodexAvailable && "opacity-60"');
    expect(dialogSource).toContain("aria-describedby={!isCodexAvailable ? libraryUnavailableMessageId : undefined}");
    expect(dialogSource).not.toContain("ring-1 ring-white/12");
  });

  it("edge: library icon sits on the title line and the description starts under the icon", () => {
    const titleLine = dialogSource.match(
      /<p className="flex items-center gap-2[^"]*">\s*<BookOpen[\s\S]*?createCharacterLibrarySectionTitle[\s\S]*?<\/p>/,
    )?.[0];

    expect(titleLine).toBeTruthy();
    expect(titleLine).not.toContain("createCharacterLibrarySectionDescription");
    expect(dialogSource).not.toMatch(/<BookOpen[\s\S]{0,120}\/>\s*<div/);
  });
});
