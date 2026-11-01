import { Accordion } from "@/components/ui/accordion";
import { Action, ActionUsageType } from "@/types/character";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { Button, toggleButtonPressedClassName } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useDistanceUnit } from "@/hooks/useDistanceUnit";
import ListCard from "@/components/character/tabContents/shared/listCard/ListCard";
import ListRow from "@/components/character/tabContents/shared/listCard/ListRow";
import {
  ACTION_USAGE_OPTIONS,
  formatActionAttack,
  formatActionDamage,
  normalizeUsageType,
} from "@/components/character/tabContents/battle/shared/actionSummary";

interface ActionSectionProps {
  title: string;
  actions: Action[];
  accentColor: string;
  /** Layout classes of the section (bento slot). @see FR-character-battle-bento-layout */
  className?: string;
  /** Caps the item list height and scrolls inside the section (read mode). */
  boundedList?: boolean;
}

/**
 * Read-mode action list.
 * @see FR-character-list-card
 * @see FR-character-action-section-visibility: heading stays visible when the list is empty
 */
const ActionSection = ({ title, actions, accentColor, className, boundedList = false }: ActionSectionProps) => {
  const t = useTranslations("characterDetail.battle");
  const { convertRange } = useDistanceUnit();
  const sectionId = useId();
  const headingId = `${sectionId}-heading`;

  const [openAccordionValues, setOpenAccordionValues] = useState<string[]>([]);
  const [prioritizeUsageType, setPrioritizeUsageType] = useState<ActionUsageType>("action");
  const usageTypeCounts = ACTION_USAGE_OPTIONS.reduce<Record<ActionUsageType, number>>((counts, usageType) => {
    counts[usageType] = 0;
    return counts;
  }, { action: 0, bonus_action: 0, reaction: 0 });

  actions.forEach((action) => {
    usageTypeCounts[normalizeUsageType(action.usageType)] += 1;
  });

  const displayedActions = [...actions].sort((a, b) => {
    const aIsPriority = normalizeUsageType(a.usageType) === prioritizeUsageType;
    const bIsPriority = normalizeUsageType(b.usageType) === prioritizeUsageType;
    if (aIsPriority === bIsPriority) return 0;
    return aIsPriority ? -1 : 1;
  });
  const hasActions = displayedActions.length > 0;

  const usageFilter = (
    <div
      className="flex flex-row flex-nowrap items-center gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="group"
      aria-label={t("usageTypePriorityGroup", { section: title })}>
      {ACTION_USAGE_OPTIONS.map((option) => {
        const count = usageTypeCounts[option];
        const isAvailable = count > 0;
        const isSelected = prioritizeUsageType === option;
        const usageLabel = t(`usageTypeOptions.${option}`);

        const button = (
          <Button
            type="button"
            size="sm"
            className={cn(
              "h-7 shrink-0 px-2 text-xs",
              isSelected && toggleButtonPressedClassName,
              !isAvailable && "opacity-45 grayscale cursor-default!",
            )}
            variant="secondary"
            aria-disabled={!isAvailable}
            aria-pressed={isSelected}
            aria-label={t("usageTypePriorityButton", {
              type: usageLabel,
              count,
              selected: isSelected ? t("selected") : t("notSelected"),
            })}
            onClick={() => {
              if (!isAvailable) return;
              setPrioritizeUsageType(option);
            }}>
            <ArrowUpDown
              className="size-3.5 shrink-0"
              aria-hidden="true"
            />
            <span className="truncate">{`${usageLabel} (${count})`}</span>
          </Button>
        );

        if (!isAvailable) {
          return (
            <Tooltip key={option}>
              <TooltipTrigger asChild>
                <span className="inline-flex max-w-full">{button}</span>
              </TooltipTrigger>
              <TooltipContent>{t("usageTypeUnavailableTooltip", { type: usageLabel })}</TooltipContent>
            </Tooltip>
          );
        }

        return (
          <span
            key={option}
            className="inline-flex max-w-full">
            {button}
          </span>
        );
      })}
    </div>
  );

  return (
    <ListCard
      headingId={headingId}
      title={title}
      count={displayedActions.length}
      accentColor={accentColor}
      className={className}
      toolbar={usageFilter}
      expanded={openAccordionValues.length > 0}
      onToggleAll={() => {
        if (!hasActions) return;
        setOpenAccordionValues(
          openAccordionValues.length > 0 ? [] : displayedActions.map((_, index) => `${sectionId}-action-${index}`),
        );
      }}
      expandLabel={t("expandSectionActions", { section: title })}
      collapseLabel={t("collapseSectionActions", { section: title })}
      emptyLabel={t("noActions")}
      bounded={boundedList}>
      <Accordion
        type="multiple"
        value={openAccordionValues}
        onValueChange={setOpenAccordionValues}
        className="w-full">
        {displayedActions.map((action, index) => {
          const itemId = `${sectionId}-action-${index}`;
          const usageLabel = t(`usageTypeOptions.${normalizeUsageType(action.usageType)}`);
          const attack = formatActionAttack(action);
          const damage = formatActionDamage(action.damage);
          const range = action.range ? convertRange(action.range) : null;
          const details = [
            { label: t("attackDC"), value: attack },
            { label: t("damageType"), value: damage },
            { label: t("range"), value: range },
          ].filter((detail) => detail.value);

          return (
            <ListRow
              key={`${action.name}-${index}`}
              value={itemId}
              triggerId={`${itemId}-trigger`}
              name={action.name}
              meta={[usageLabel, attack, damage, range].filter(Boolean)}
              triggerLabel={`${t("actionDetails")} ${action.name}`}
              isOpen={openAccordionValues.includes(itemId)}
              contentClassName="flex flex-col gap-2">
              {action.description && (
                <p className="whitespace-pre-wrap wrap-break-word">{action.description}</p>
              )}
              {details.length > 0 && (
                <dl className="flex flex-wrap gap-x-4 gap-y-1">
                  {details.map((detail) => (
                    <div
                      key={detail.label}
                      className="min-w-0">
                      <dt className={cn("inline font-semibold", accentColor)}>{detail.label}</dt>{" "}
                      <dd className="inline wrap-break-word">{detail.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </ListRow>
          );
        })}
      </Accordion>
    </ListCard>
  );
};

export default ActionSection;
