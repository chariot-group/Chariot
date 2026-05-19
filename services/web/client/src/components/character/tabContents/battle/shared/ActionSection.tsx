import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Action, ActionUsageType } from "@/types/character";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ArrowUpDown, ListChevronsDownUp, ListChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatSignedBonus } from "@/utils/attack.utils";

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

const ActionSection = ({ title, actions, accentColor }: ActionSectionProps) => {
  const t = useTranslations("characterDetail.battle");
  const tMagic = useTranslations("characterDetail.magic");

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

  if (actions.length === 0) return null;

  return (
    <section
      className="flex flex-col gap-2 w-full"
      aria-labelledby={`${title.toLowerCase().replace(/\s+/g, "-")}-heading`}>
      <Card className="gap-3 p-4 md:px-6 h-fit flex-col items-stretch xl:flex-row xl:items-start xl:justify-between">
        <div className="flex flex-col gap-2 min-w-0 flex-1">
          <h2
            id={`${title.toLowerCase().replace(/\s+/g, "-")}-heading`}
            className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
            {title}
          </h2>
          <div className="flex flex-wrap items-center gap-1">
            {ACTION_USAGE_OPTIONS.map((option) => {
              const count = usageTypeCounts[option];
              const isAvailable = count > 0;
              const isSelected = prioritizeUsageType === option;

              return (
                <Button
                  key={option}
                  type="button"
                  size="sm"
                  className={`h-6 px-2 text-xs ${!isAvailable ? "opacity-45 grayscale cursor-default!" : ""}`}
                  variant={isSelected ? "default" : "outline"}
                  aria-disabled={!isAvailable}
                  onClick={() => {
                    if (!isAvailable) return;
                    setPrioritizeUsageType(option);
                  }}>
                  <ArrowUpDown className="size-3.5" />
                  {`${t(`usageTypeOptions.${option}`)} (${count})`}
                </Button>
              );
            })}
          </div>
        </div>
        <div className="flex justify-end shrink-0 self-end xl:self-start">
          <button
            type="button"
            onClick={() => {
              if (!hasActions) return;
              if (openAccordionValues.length > 0) {
                setOpenAccordionValues([]);
              } else {
                setOpenAccordionValues(displayedActions.map((action, index) => `${action.name}-${index}`));
              }
            }}
            disabled={!hasActions}
            className={`text-sm pr-3 py-2 focus:outline-none ${hasActions ? "cursor-pointer hover:underline focus:underline" : "cursor-not-allowed opacity-45"} ${accentColor}`}
            aria-label={openAccordionValues.length > 0 ? tMagic("collapseAll") : tMagic("expandAll")}
            aria-expanded={openAccordionValues.length > 0}>
            {openAccordionValues.length > 0 ? <ListChevronsDownUp /> : <ListChevronsUpDown />}
          </button>
        </div>
      </Card>
      <Accordion
        type="multiple"
        value={openAccordionValues}
        onValueChange={setOpenAccordionValues}
        className="w-full flex flex-col gap-2">
        {displayedActions.map((action, index) => {
          const usageType = normalizeUsageType(action.usageType);
          return (
            <AccordionItem
              key={`${action.name}-${index}`}
              value={`${action.name}-${index}`}
              className="flex flex-col gap-2">
              <Card className="gap-2 p-0 flex-col">
                <AccordionTrigger
                  className="py-3 px-3 md:py-4 md:px-6 rounded-md truncate"
                  aria-label={`${t("actionDetails")} ${action.name}`}>
                  <div className="truncate flex items-center gap-1">
                    <span className="text-base md:text-lg font-medium text-left truncate">{action.name}</span>
                    <span className="text-base md:text-lg font-medium text-left">
                      {` (${t(`usageTypeOptions.${usageType}`)})`}
                    </span>
                  </div>
                </AccordionTrigger>
              </Card>
              <AccordionContent>
                <div
                  className="flex flex-wrap gap-2 items-start"
                  role="region"
                  aria-label={`${t("details")} ${action.name}`}>
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
                      {action.range && ` (${action.range})`}
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
