import type { Action, ActionUsageType } from "@/types/character";
import { formatSignedBonus } from "@/utils/attack.utils";

export const ACTION_USAGE_OPTIONS: ActionUsageType[] = ["action", "bonus_action", "reaction"];

export const normalizeUsageType = (usageType?: string): ActionUsageType => {
  if (usageType === "bonus_action" || usageType === "reaction" || usageType === "action") {
    return usageType;
  }
  return "action";
};

/** Attack bonus (`+5`) or save DC (`DC 13`), `null` when the action has neither. */
export const formatActionAttack = (action: Partial<Pick<Action, "attackBonus" | "dc">>): string | null => {
  if (action.attackBonus !== undefined && action.attackBonus !== null && `${action.attackBonus}` !== "") {
    return formatSignedBonus(Number(action.attackBonus));
  }
  return action.dc?.dcValue ? `DC ${action.dc.dcValue}` : null;
};

/** Damage entries joined with ` + ` (`1d8 slashing + 1d6 fire`), `null` when empty. */
export const formatActionDamage = (damage?: Array<{ dice?: string; type?: string } | undefined>): string | null => {
  const parts = (damage ?? [])
    .map((entry) => [entry?.dice, entry?.type].filter(Boolean).join(" ").trim())
    .filter(Boolean);
  return parts.length > 0 ? parts.join(" + ") : null;
};
