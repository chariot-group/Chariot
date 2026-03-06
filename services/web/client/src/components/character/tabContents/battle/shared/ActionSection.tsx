import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Action } from "@/types/character";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ListChevronsDownUp, ListChevronsUpDown } from "lucide-react";

interface ActionSectionProps {
  title: string;
  actions: Action[];
  accentColor: string;
}

const ActionSection = ({ title, actions, accentColor }: ActionSectionProps) => {
  const t = useTranslations("characterDetail.battle");
  const tMagic = useTranslations("characterDetail.magic");

  const [openAccordionValues, setOpenAccordionValues] = useState<string[]>([]);

  if (actions.length === 0) return null;

  return (
    <section
      className="flex flex-col gap-2 w-full"
      aria-labelledby={`${title.toLowerCase().replace(/\s+/g, "-")}-heading`}>
      <Card className="gap-3 p-4 md:px-6 h-fit justify-between flex-row items-center">
        <h2
          id={`${title.toLowerCase().replace(/\s+/g, "-")}-heading`}
          className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
          {title}
        </h2>
        <div className="flex justify-end shrink-0">
          <button
            onClick={() => {
              if (openAccordionValues.length > 0) {
                setOpenAccordionValues([]);
              } else {
                setOpenAccordionValues(actions.map((action, index) => `${action.name}-${index}`));
              }
            }}
            className={`cursor-pointer text-sm pr-3 py-2 hover:underline focus:outline-none focus:underline ${accentColor}`}
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
        {actions.map((action, index) => (
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
                    {action.type && ` (${action.type})`}
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
                      ? `+${action.attackBonus}`
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
                      : "-"}{" "}
                    {action.range && `(${action.range})`}
                  </span>
                </Card>
                {action.description && (
                  <Card className="flex flex-col gap-2 py-3 px-3 md:py-4 md:px-6 w-full">
                    <span className={`${accentColor} font-semibold text-sm md:text-base`}>{t("description")}</span>
                    <span className="text-sm md:text-base italic break-all">{action.description}</span>
                  </Card>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
};

export default ActionSection;
