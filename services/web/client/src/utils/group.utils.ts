import type { Group } from "@/types/character";

/** Character `groups` arrive either populated (`Group`) or as raw ids depending on the endpoint. */
export type GroupRef = Group | string;

export function groupRefToId(group: GroupRef): string {
  return typeof group === "string" ? group : group._id;
}
