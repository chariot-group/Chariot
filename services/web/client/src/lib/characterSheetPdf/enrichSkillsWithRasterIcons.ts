/** @see FR-character-sheet-pdf-export */

import { PDF_SKILL_LUCIDE_NODES } from "@/lib/characterSheetPdf/lucidePdfIconNodes";
import { rasterizeLucideIcon } from "@/lib/characterSheetPdf/rasterizeLucideIcon";
import type { CharacterSheetPdfData } from "@/lib/characterSheetPdf/types";

export async function enrichSkillsWithRasterIcons(
  data: CharacterSheetPdfData,
  iconColor: string,
): Promise<CharacterSheetPdfData> {
  const skills = await Promise.all(
    data.skills.map(async (skill) => {
      const iconNode = PDF_SKILL_LUCIDE_NODES[skill.key];
      if (!iconNode) return skill;

      const iconDataUrl = await rasterizeLucideIcon(iconNode, iconColor);
      return iconDataUrl ? { ...skill, iconDataUrl } : skill;
    }),
  );

  return { ...data, skills };
}
