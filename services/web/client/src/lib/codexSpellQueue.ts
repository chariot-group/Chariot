import type { Spell } from "@/types/character";

export type QueuedSpellEntry = { key: string; spell: Partial<Spell> };

export function toggleSpellInQueue(
  queue: QueuedSpellEntry[],
  key: string,
  spell: Partial<Spell>,
): QueuedSpellEntry[] {
  const existingIndex = queue.findIndex((entry) => entry.key === key);
  if (existingIndex >= 0) {
    return queue.filter((_, index) => index !== existingIndex);
  }
  return [...queue, { key, spell }];
}

export function isSpellQueued(queue: QueuedSpellEntry[], key: string): boolean {
  return queue.some((entry) => entry.key === key);
}

export function queuedSpellKeys(queue: QueuedSpellEntry[]): Set<string> {
  return new Set(queue.map((entry) => entry.key));
}
