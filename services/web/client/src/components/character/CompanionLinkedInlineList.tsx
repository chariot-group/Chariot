/** @see FR-player-delete-companion-choice, FR-player-duplicate-companion-choice */

export interface CompanionLinkedInlineListProps {
  label: string;
  count: number;
  namesLine: string;
}

export function CompanionLinkedInlineList({ label, count, namesLine }: CompanionLinkedInlineListProps) {
  return (
    <p
      className="min-w-0 text-sm leading-relaxed text-white/70"
      title={namesLine}>
      <span className="font-semibold text-white/80">
        {label} ({count}) :
      </span>{" "}
      {namesLine}
    </p>
  );
}
