import type { ReactElement } from "react";
import { useForm, type FieldValues } from "react-hook-form";
import { describe, expect, it } from "vitest";
import Skills from "@/components/character/tabContents/general/shared/Skills";
import SkillsNpc from "@/components/character/tabContents/general/shared/SkillsNpc";
import SkillsEdit from "@/components/character/tabContents/general/form/SkillsEdit";
import NpcSkillsEdit from "@/components/character/tabContents/general/form/NpcSkillsEdit";
import { render } from "@/components/character/tabContents/__tests__/bentoRender";
import type { PlayerStats, Stats } from "@/types/character";

const stats = {
  abilityScores: { strength: 10, dexterity: 14, constitution: 12, intelligence: 8, wisdom: 13, charisma: 10 },
  masteries: {},
  skills: {},
  proficiencyBonus: 2,
};

function WithForm({ children }: { children: (form: ReturnType<typeof useForm<FieldValues>>) => ReactElement }) {
  return children(useForm<FieldValues>({ defaultValues: { stats } }));
}

/** Container-query column classes of the first grid in the markup. */
const columns = (html: string) =>
  (html.match(/<div class="(grid [^"]+)"/)?.[1] ?? "").split(" ").filter((c) => /grid-cols-/.test(c));

/** @see FR-character-general-bento-layout — skills keep the same columns in read and edit modes */
describe("Skills — same columns in read and edit modes", () => {
  it("nominal: PC skills use the same column steps in view and edit", () => {
    const view = render(
      <Skills
        accentColor="text-blue"
        stats={stats as unknown as PlayerStats}
      />,
    );
    const edit = render(
      <WithForm>
        {(form) => (
          <SkillsEdit
            form={form}
            accentColor="text-blue"
            enableHalfProficiency={false}
            enableExpertise={false}
          />
        )}
      </WithForm>,
    );

    expect(columns(edit)).toEqual(columns(view));
    expect(columns(view)).toContain("@xl:grid-cols-3");
  });

  it("edge: NPC skills use the same column steps in view and edit", () => {
    const view = render(<SkillsNpc stats={stats as unknown as Stats} />);
    const edit = render(<WithForm>{(form) => <NpcSkillsEdit form={form} />}</WithForm>);

    expect(columns(edit)).toEqual(columns(view));
  });

  it("failure: the edit grid never stops at two columns on a wide card", () => {
    const edit = render(<WithForm>{(form) => <NpcSkillsEdit form={form} />}</WithForm>);

    expect(columns(edit)).not.toContain("@4xl:grid-cols-3");
    expect(columns(edit)).toContain("@xl:grid-cols-3");
  });
});
