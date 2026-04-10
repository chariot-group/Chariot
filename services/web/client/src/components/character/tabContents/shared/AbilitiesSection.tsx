import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ListChevronsDownUp, ListChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface Ability {
  name: string;
  description: string;
}

interface AbilitiesSectionProps {
  abilities: Ability[];
  accentColor: string;
  title: string;
  headingId: string;
  className?: string;
}

const AbilitiesSection = ({ abilities, accentColor, title, headingId, className = "" }: AbilitiesSectionProps) => {
  const tMagic = useTranslations("characterDetail.magic");
  const t = useTranslations("characterDetail.battle");

  const [openAccordionValues, setOpenAccordionValues] = useState<string[]>([]);

  return (
    <Card
      className={`gap-0.5 p-4 md:px-6 h-fit ${className}`}
      role="region"
      aria-labelledby={headingId}>
      <div className="flex flex-row justify-between">
        <h2
          id={headingId}
          className={`text-xl sm:text-2xl font-semibold truncate ${accentColor}`}>
          {title}
        </h2>
        <div className="flex justify-end shrink-0">
          <button
            type="button"
            onClick={() => {
              if (openAccordionValues.length > 0) {
                setOpenAccordionValues([]);
              } else {
                setOpenAccordionValues(abilities.map((ability, index) => `${ability.name}-${index}`));
              }
            }}
            className={`cursor-pointer text-sm pr-3 py-2 hover:underline focus:outline-none focus:underline ${accentColor}`}
            aria-label={openAccordionValues.length > 0 ? tMagic("collapseAll") : tMagic("expandAll")}
            aria-expanded={openAccordionValues.length > 0}>
            {openAccordionValues.length > 0 ? <ListChevronsDownUp /> : <ListChevronsUpDown />}
          </button>
        </div>
      </div>
      <Accordion
        type="multiple"
        value={openAccordionValues}
        onValueChange={setOpenAccordionValues}
        className="w-full">
        {abilities.map((ability, index) => (
          <AccordionItem
            key={`${ability.name}-${index}`}
            value={`${ability.name}-${index}`}
            className="border-b border-gray py-1.5">
            <AccordionTrigger
              className="text-left py-1.5 hover:no-underline truncate"
              aria-label={`${t("details")} ${ability.name}`}>
              <span className="text-sm sm:text-lg font-semibold truncate">{ability.name}</span>
            </AccordionTrigger>
            <AccordionContent
              className="text-sm sm:text-base pb-3 whitespace-pre-wrap wrap-break-word"
              role="region"
              aria-label={`${t("descriptionPrefix")} ${ability.name}`}>
              {ability.description}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Card>
  );
};

export default AbilitiesSection;
