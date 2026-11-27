import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * End of the builder: the Player form replaces the builder in the history, so « Cancel » in the form (router.back)
 * returns to the page shown before the builder, not to the builder.
 * @see FR-ruleset-character-builder — Web builder UI (End of the builder)
 */
const hookSource = fs.readFileSync(path.resolve(__dirname, "../../hooks/useCharacterBuilder.ts"), "utf8");
const finishBody = hookSource.slice(
  hookSource.indexOf("const finish = useCallback"),
  hookSource.indexOf("const cancel = useCallback"),
);

describe("character builder exit navigation", () => {
  it("nominal: « Continue » replaces the builder by the Player form", () => {
    expect(finishBody).toContain("router.replace(formPath)");
  });

  it("failure guard: the builder is not pushed under the form (cancel would come back to it)", () => {
    expect(finishBody).not.toContain("router.push(formPath)");
  });
});
