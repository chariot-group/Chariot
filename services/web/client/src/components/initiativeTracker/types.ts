import type {
  InitiativeTrackerCondition,
  InitiativeTrackerConditionDuration,
  InitiativeTrackerConditionDurationUnit,
  InitiativeTrackerConditionEntry,
} from "@/store/slices/sessionSlice";

export type ActiveInitiativeTrackerCondition = Exclude<InitiativeTrackerCondition, "none">;

export type {
  InitiativeTrackerConditionDuration,
  InitiativeTrackerConditionDurationUnit,
  InitiativeTrackerConditionEntry,
};
