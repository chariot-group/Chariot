"use client";

import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { InitiativeNumberInput } from "@/components/initiativeTracker/InitiativeNumberInput";
import { InitiativeTrackerGroupedInitiativeBar } from "@/components/initiativeTracker/InitiativeTrackerGroupedInitiativeBar";
import { resolveInitiativeModifierFromStats } from "@/components/initiativeTracker/utils";
import { formatSignedBonus } from "@/utils/attack.utils";

/** Aligné sur la colonne initiative du tracker (88px). */
export const ADD_COMBATANTS_MEMBER_GRID = "88px minmax(0, 1fr) 40px";

const INITIATIVE_INPUT_CLASS =
  "h-9 w-full rounded-[15px] bg-gray-middle-light px-3 text-center text-sm font-normal tabular-nums text-white";

type BattleMember = {
  _id: string;
  firstname?: string;
  lastname?: string;
  surname?: string;
  stats?: { initiative?: number | null } | null;
};

type AddCombatantsGroupMembersProps = {
  members: BattleMember[];
  excludedMemberIds: Set<string>;
  initiativeByMemberId: Record<string, number>;
  labels: {
    initiative: string;
    character: string;
    initiativeFor: string;
    initiativeModifierFor: string;
    groupedSelectedCount: string;
    groupedInitiativePlaceholder: string;
    groupedInitiativeApply: string;
    groupedClearSelection: string;
  };
  onToggleMember: (memberId: string, include: boolean) => void;
  onMemberInitiativeChange: (memberId: string, value: number) => void;
  onApplyGroupInitiative: (initiative: number) => void;
  onClearMemberSelection: () => void;
};

function formatCharacterName(character: BattleMember): string {
  const fullName = `${character.firstname ?? ""} ${character.lastname ?? ""}`.trim();
  return fullName || character.surname || "-";
}

export function AddCombatantsGroupMembers({
  members,
  excludedMemberIds,
  initiativeByMemberId,
  labels,
  onToggleMember,
  onMemberInitiativeChange,
  onApplyGroupInitiative,
  onClearMemberSelection,
}: AddCombatantsGroupMembersProps) {
  const includedMembers = members.filter((member) => !excludedMemberIds.has(member._id));
  const includedCount = includedMembers.length;

  const resolveInitiative = (memberId: string, member: BattleMember) => {
    const value = initiativeByMemberId[memberId];
    if (Number.isFinite(value)) return value as number;
    return resolveInitiativeModifierFromStats(member.stats);
  };

  return (
    <div className="mt-3 flex flex-col gap-2.5">
      <div
        className="hidden items-center gap-x-3 px-1 text-xs font-semibold uppercase tracking-wide text-white/55 sm:grid sm:grid-cols-[var(--member-grid)]"
        style={{ "--member-grid": ADD_COMBATANTS_MEMBER_GRID } as React.CSSProperties}>
        <span className="text-center">{labels.initiative}</span>
        <span className="text-left">{labels.character}</span>
        <span aria-hidden="true" />
      </div>

      <div className="rounded-[22px] bg-gray-middle-light/40 px-3 py-3 sm:px-4">
        <InitiativeTrackerGroupedInitiativeBar
          active
          canApply={includedCount > 0}
          labels={{
            selectedCount: labels.groupedSelectedCount,
            initiativePlaceholder: labels.groupedInitiativePlaceholder,
            apply: labels.groupedInitiativeApply,
            clearSelection: labels.groupedClearSelection,
          }}
          onApply={onApplyGroupInitiative}
          onClearSelection={onClearMemberSelection}
        />
      </div>

      <div className="flex flex-col gap-2">
        {members.map((member) => {
          const included = !excludedMemberIds.has(member._id);
          const memberName = formatCharacterName(member);
          const modifier = resolveInitiativeModifierFromStats(member.stats);
          const modifierText = formatSignedBonus(modifier);
          const modifierAriaLabel = labels.initiativeModifierFor.replace("{bonus}", modifierText);

          return (
            <div
              key={member._id}
              className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 rounded-[22px] bg-gray px-3 py-3 text-white shadow-lg sm:grid-cols-[var(--member-grid)] sm:items-center sm:px-4 sm:py-2.5"
              style={{ "--member-grid": ADD_COMBATANTS_MEMBER_GRID } as React.CSSProperties}>
              <span className="min-w-0 break-words text-base font-semibold sm:hidden">{memberName}</span>

              <Checkbox
                checked={included}
                aria-label={memberName}
                onCheckedChange={(checked) => onToggleMember(member._id, Boolean(checked))}
                className="size-5 cursor-pointer justify-self-end sm:hidden"
              />

              <div className="col-span-2 flex w-full justify-start sm:col-span-1 sm:justify-center">
                {included ? (
                  <InitiativeNumberInput
                    value={resolveInitiative(member._id, member)}
                    resetKey={member._id}
                    ariaLabel={labels.initiativeFor.replace("{name}", memberName)}
                    modifier={modifier}
                    modifierAriaLabel={modifierAriaLabel}
                    showModifier
                    onCommit={(value) => onMemberInitiativeChange(member._id, value)}
                    className={INITIATIVE_INPUT_CLASS}
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className={`${INITIATIVE_INPUT_CLASS} flex items-center justify-center text-white/35`}>
                    —
                  </div>
                )}
              </div>

              <span className="hidden min-w-0 truncate text-base font-semibold sm:block">{memberName}</span>

              <Checkbox
                checked={included}
                aria-label={memberName}
                onCheckedChange={(checked) => onToggleMember(member._id, Boolean(checked))}
                className="hidden size-5 cursor-pointer justify-self-center sm:block"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
