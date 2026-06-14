"use client";

import type {
  InitiativeTrackerPlayerFieldVisibility,
  InitiativeTrackerRow,
} from "@/store/slices/sessionSlice";

export type BulkSelectionFieldState = boolean | "mixed";

export type BulkSelectionDraftFieldState = boolean | "mixed";

export type BulkSelectionVisibilitySummary = {
  visible: BulkSelectionFieldState;
  playerDisplayName: string | "mixed";
  playerFieldVisibility: Record<keyof InitiativeTrackerPlayerFieldVisibility, BulkSelectionFieldState>;
};

type BulkVisibilityDraft = {
  visible: BulkSelectionDraftFieldState;
  playerDisplayName: string;
  playerDisplayNameMixed: boolean;
  playerFieldVisibility: Record<
    keyof InitiativeTrackerPlayerFieldVisibility,
    BulkSelectionDraftFieldState
  >;
};

type BulkVisibilityTouchedState = {
  visible: boolean;
  playerDisplayName: boolean;
  playerFieldVisibility: Record<keyof InitiativeTrackerPlayerFieldVisibility, boolean>;
};

export const BULK_VISIBILITY_FIELD_KEYS: (keyof InitiativeTrackerPlayerFieldVisibility)[] = [
  "name",
  "initiative",
  "hitPoints",
  "lifeStatus",
  "armorClass",
  "conditions",
  "groupLabel",
];

function deriveSharedBoolean(
  values: boolean[],
): BulkSelectionFieldState {
  if (values.length === 0) return "mixed";
  return values.every((value) => value === values[0]) ? values[0] : "mixed";
}

export function deriveBulkVisibilitySummary(
  rows: InitiativeTrackerRow[],
): BulkSelectionVisibilitySummary {
  const visible = deriveSharedBoolean(rows.map((row) => row.visible));

  const firstAlias = rows[0]?.playerDisplayName?.trim() ?? "";
  const playerDisplayName =
    rows.length > 0 && rows.every((row) => (row.playerDisplayName?.trim() ?? "") === firstAlias)
      ? firstAlias
      : "mixed";

  const playerFieldVisibility = BULK_VISIBILITY_FIELD_KEYS.reduce(
    (acc, key) => {
      acc[key] = deriveSharedBoolean(rows.map((row) => row.playerFieldVisibility[key]));
      return acc;
    },
    {} as Record<keyof InitiativeTrackerPlayerFieldVisibility, BulkSelectionFieldState>,
  );

  return {
    visible,
    playerDisplayName,
    playerFieldVisibility,
  };
}

export function createBulkVisibilityDraft(
  summary: BulkSelectionVisibilitySummary | null,
): BulkVisibilityDraft {
  return {
    visible: summary?.visible ?? true,
    playerDisplayName: summary?.playerDisplayName === "mixed" ? "" : (summary?.playerDisplayName ?? ""),
    playerDisplayNameMixed: summary?.playerDisplayName === "mixed",
    playerFieldVisibility: BULK_VISIBILITY_FIELD_KEYS.reduce(
      (acc, key) => {
        acc[key] = summary?.playerFieldVisibility[key] ?? false;
        return acc;
      },
      {} as Record<keyof InitiativeTrackerPlayerFieldVisibility, BulkSelectionDraftFieldState>,
    ),
  };
}

export function createBulkVisibilityTouchedState(): BulkVisibilityTouchedState {
  return {
    visible: false,
    playerDisplayName: false,
    playerFieldVisibility: BULK_VISIBILITY_FIELD_KEYS.reduce(
      (acc, key) => {
        acc[key] = false;
        return acc;
      },
      {} as Record<keyof InitiativeTrackerPlayerFieldVisibility, boolean>,
    ),
  };
}

export function buildBulkVisibilityUpdatePayload(
  draft: BulkVisibilityDraft,
  touched: BulkVisibilityTouchedState,
): {
  changes: {
    visible?: boolean;
    playerFieldVisibility?: Partial<InitiativeTrackerPlayerFieldVisibility>;
  };
  playerDisplayName?: string;
} {
  const changes: {
    visible?: boolean;
    playerFieldVisibility?: Partial<InitiativeTrackerPlayerFieldVisibility>;
  } = {};

  if (touched.visible && draft.visible !== "mixed") {
    changes.visible = draft.visible;
  }

  const fieldVisibilityChanges = BULK_VISIBILITY_FIELD_KEYS.reduce(
    (acc, key) => {
      if (!touched.playerFieldVisibility[key]) return acc;
      const nextValue = draft.playerFieldVisibility[key];
      if (nextValue !== "mixed") {
        acc[key] = nextValue;
      }
      return acc;
    },
    {} as Partial<InitiativeTrackerPlayerFieldVisibility>,
  );

  if (Object.keys(fieldVisibilityChanges).length > 0) {
    changes.playerFieldVisibility = fieldVisibilityChanges;
  }

  const trimmedDisplayName = draft.playerDisplayName.trim();
  const playerDisplayName =
    touched.playerDisplayName && (!draft.playerDisplayNameMixed || trimmedDisplayName.length > 0)
      ? trimmedDisplayName
      : undefined;

  return { changes, playerDisplayName };
}
