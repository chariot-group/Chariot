import type { InitiativeTrackerCondition } from "@/store/slices/sessionSlice";

export type ActiveInitiativeTrackerCondition = Exclude<InitiativeTrackerCondition, "none">;
