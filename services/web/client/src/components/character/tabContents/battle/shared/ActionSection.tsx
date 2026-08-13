import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Action, ActionUsageType } from "@/types/character";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { ArrowUpDown, ListChevronsDownUp, ListChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatSignedBonus } from "@/utils/attack.utils";
import { useDistanceUnit } from "@/hooks/useDistanceUnit";

interface ActionSectionProps {
  title: string;
  actions: Action[];
  accentColor: string;
}

const ACTION_USAGE_OPTIONS: ActionUsageType[] = ["action", "bonus_action", "reaction"];

const normalizeUsageType = (usageType?: string): ActionUsageType => {
  if (usageType === "bonus_action" || usageType === "reaction" || usageType === "action") {
    return usageType;
  }
  return "action";
};

/** @see FR-character-action-section-visibility: heading stays visible when the list is empty */
const ActionSection = ({ title, actions, accentColor }: ActionSectionProps) => {
  const t = useTranslations("characterDetail.battle");
  const tMagic = useTranslations("characterDetail.magic");
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

  return (
    <section
      className="flex flex-col gap-2 w-full"
      aria-labelledby={headingId}>
      <Card className="gap-2 p-4 md:px-6 h-fit flex flex-col min-w-0 w-full">
        <div className="flex flex-row items-center justify-between gap-2 min-w-0">
          <h2
            id={headingId}
            className={`min-w-0 flex-1 truncate text-xl sm:text-2xl font-semibold ${accentColor}`}>
            {title}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              if (!hasActions) return;
              if (openAccordionValues.length > 0) {
                setOpenAccordionValues([]);
              } else {
                setOpenAccordionValues(displayedActions.map((_, index) => `${sectionId}-action-${index}`));
              }
            }}
            disabled={!hasActions}
            className={accentColor}
            aria-label={openAccordionValues.length > 0
              ? t("collapseSectionActions", { section: title })
              : t("expandSectionActions", { section: title })}
            aria-expanded={openAccordionValues.length > 0}>
            {openAccordionValues.length > 0
              ? (
                <ListChevronsDownUp
                  className="size-5"
                  aria-hidden="true"
                />
              )
              : (
                <ListChevronsUpDown
                  className="size-5"
                  aria-hidden="true"
                />
              )}
            <span className="sr-only">
              {openAccordionValues.length > 0 ? tMagic("collapseAll") : tMagic("expandAll")}
            </span>
          </Button>
        </div>
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
                className={`h-7 shrink-0 px-2 text-xs ${!isAvailable ? "opacity-45 grayscale cursor-default!" : ""}`}
                variant={isSelected ? "default" : "outline"}
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
                  <TooltipContent>
                    {t("usageTypeUnavailableTooltip", { type: usageLabel })}
                  </TooltipContent>
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
      </Card>
      <Accordion
        type="multiple"
        value={openAccordionValues}
        onValueChange={setOpenAccordionValues}
        className="w-full flex flex-col gap-2">
        {displayedActions.map((action, index) => {
          const usageType = normalizeUsageType(action.usageType);
          const itemId = `${sectionId}-action-${index}`;
          const triggerId = `${itemId}-trigger`;
          const detailsId = `${itemId}-details`;
          return (
            <AccordionItem
              key={`${action.name}-${index}`}
              value={itemId}
              className="flex flex-col gap-2">
              <Card className="gap-2 p-0 flex-col">
                <AccordionTrigger
                  id={triggerId}
                  className="min-w-0 py-3 px-3 md:py-4 md:px-6 rounded-md"
                  aria-label={`${t("actionDetails")} ${action.name}`}>
                  <span className="min-w-0 flex-1 truncate text-base md:text-lg font-medium text-left">
                    {action.name}
                    {` (${t(`usageTypeOptions.${usageType}`)})`}
                  </span>
                </AccordionTrigger>
              </Card>
              <AccordionContent>
                <div
                  id={detailsId}
                  className="flex flex-wrap gap-2 items-start"
                  role="region"
                  aria-labelledby={triggerId}>
                  <Card className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2 py-3 px-3 md:py-4 md:px-6">
                    <span className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>{t("attackDC")}</span>
                    {(() => {
                      const attackOrDc = action.attackBonus !== undefined && action.attackBonus !== null
                        ? formatSignedBonus(action.attackBonus)
                        : action.dc?.dcValue
                          ? `DC ${action.dc.dcValue}`
                          : "-";
                      return (
                        <span
                          className="text-sm md:text-base"
                          aria-label={`${t("attackDC")} ${attackOrDc}`}>
                          {attackOrDc}
                        </span>
                      );
                    })()}
                  </Card>
                  <Card className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2 py-3 px-3 md:py-4 md:px-6">
                    <span className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>
                      {t("damageType")}
                    </span>
                    <span className="text-sm md:text-base">
                      {action.damage && action.damage.length > 0
                        ? action.damage.map((d, i) => (
                          <span key={i}>
                            {d.dice} {d.type}
                            {i < action.damage!.length - 1 ? " + " : ""}
                          </span>
                        ))
                        : "-"}
                      {action.range && ` (${convertRange(action.range)})`}
                    </span>
                  </Card>
                  {action.description && (
                    <Card className="flex flex-col gap-2 py-3 px-3 md:py-4 md:px-6 w-full">
                      <span className={`${accentColor} font-semibold text-sm md:text-base`}>{t("description")}</span>
                      <span className="text-sm md:text-base italic whitespace-pre-wrap wrap-break-word">{action.description}</span>
                    </Card>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </section>
  );
};

export default ActionSection;
