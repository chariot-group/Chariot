interface ProficiencyValueProps {
  items?: string[] | null;
  /** Muted text shown when the list is empty (e.g. « Aucune langue renseignée »). */
  emptyLabel: string;
}

/**
 * Value of a Proficiencies entry in read mode: the items joined by commas, or a muted empty-state
 * text like the senses (« Aucun sens renseigné »). Blank items are ignored.
 * @see FR-character-general-bento-layout
 */
export default function ProficiencyValue({ items, emptyLabel }: ProficiencyValueProps) {
  const filled = (items ?? []).map((item) => item.trim()).filter(Boolean);

  return filled.length > 0 ? (
    <span className="text-sm sm:text-base wrap-break-word">{filled.join(", ")}</span>
  ) : (
    <span className="text-sm sm:text-base text-muted-foreground">{emptyLabel}</span>
  );
}
