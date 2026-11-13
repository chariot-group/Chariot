import type { CodexCreateSelection } from "@/lib/codexCharacterCreate";

export type QueuedCharacterEntry = { key: string; selection: CodexCreateSelection };

export function toggleCharacterInQueue(
  queue: QueuedCharacterEntry[],
  key: string,
  selection: CodexCreateSelection,
): QueuedCharacterEntry[] {
  const existingIndex = queue.findIndex((entry) => entry.key === key);
  if (existingIndex >= 0) {
    return queue.filter((_, index) => index !== existingIndex);
  }
  return [...queue, { key, selection }];
}

export function isCharacterQueued(queue: QueuedCharacterEntry[], key: string): boolean {
  return queue.some((entry) => entry.key === key);
}

export function queuedCharacterKeys(queue: QueuedCharacterEntry[]): Set<string> {
  return new Set(queue.map((entry) => entry.key));
}

export function characterDisplayName(selection: CodexCreateSelection): string {
  const name = selection.draft.firstname?.trim();
  return name || "";
}
