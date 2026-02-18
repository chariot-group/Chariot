import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Controller, UseFormReturn, FieldArrayWithId, UseFieldArrayAppend, UseFieldArrayRemove } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Plus, Trash2, ListChevronsDownUp, ListChevronsUpDown } from "lucide-react";

interface ActionUpdateSectionProps {
  title: string;
  form: UseFormReturn<any>;
  fieldArrayName: string;
  fields: FieldArrayWithId<any, any, "id">[];
  append: UseFieldArrayAppend<any, any>;
  remove: UseFieldArrayRemove;
  accentColor: string;
}

const ActionUpdateSection = ({
  title,
  form,
  fieldArrayName,
  fields,
  append,
  remove,
  accentColor,
}: ActionUpdateSectionProps) => {
  const t = useTranslations("characterDetail.battle");
  const tMagic = useTranslations("characterDetail.magic");

  const [openAccordionValues, setOpenAccordionValues] = useState<string[]>([]);

  return (
    <section className="flex flex-col gap-2 w-full">
      <Card className="gap-3 p-4 md:px-6 h-fit justify-between flex-row items-center">
        <h2 className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>{title}</h2>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                name: "",
                type: "",
                description: "",
                attackBonus: 0,
                damage: [],
                range: "",
              })
            }
            className="flex items-center gap-2">
            <Plus className="size-4" />
            <span className="hidden sm:block">Ajouter</span>
          </Button>
          <button
            type="button"
            onClick={() => {
              if (openAccordionValues.length > 0) {
                setOpenAccordionValues([]);
              } else {
                setOpenAccordionValues(fields.map((_, index) => `action-${index}`));
              }
            }}
            className={`cursor-pointer text-sm p-2 hover:underline focus:outline-none focus:underline ${accentColor}`}
            aria-label={openAccordionValues.length > 0 ? tMagic("collapseAll") : tMagic("expandAll")}
            aria-expanded={openAccordionValues.length > 0}>
            {openAccordionValues.length > 0 ? <ListChevronsDownUp /> : <ListChevronsUpDown />}
          </button>
        </div>
      </Card>
      {fields.length > 0 && (
        <Accordion
          type="multiple"
          value={openAccordionValues}
          onValueChange={setOpenAccordionValues}
          className="w-full flex flex-col gap-2">
          {fields.map((field, index) => (
            <AccordionItem
              key={field.id}
              value={`action-${index}`}
              className="flex flex-col gap-2">
              <Card className="gap-2 p-0 flex-col">
                <AccordionTrigger
                  className="flex-1 py-3 px-3 md:py-4 md:px-6 rounded-md items-center justify-between"
                  aria-label={`Détails de l'action ${index + 1}`}>
                  <Controller
                    name={`${fieldArrayName}.${index}.name`}
                    control={form.control}
                    render={({ field: nameField }) => (
                      <Input
                        {...nameField}
                        placeholder="Nom de l'action"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  />
                  <Controller
                    name={`${fieldArrayName}.${index}.type`}
                    control={form.control}
                    render={({ field: typeField }) =>
                      typeField.value && <span className="text-base md:text-lg font-medium">({typeField.value})</span>
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(index);
                    }}
                    className="text-red-500 shrink-0">
                    <Trash2 className="size-4" />
                  </Button>
                </AccordionTrigger>
              </Card>
              <AccordionContent>
                <div className="flex flex-wrap gap-2 items-start">
                  <Card className="sm:items-center flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2 py-3 px-3 md:py-4 md:px-6">
                    <span className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>Type</span>
                    <Controller
                      name={`${fieldArrayName}.${index}.type`}
                      control={form.control}
                      render={({ field: typeField }) => <Input {...typeField} />}
                    />
                  </Card>
                  <Card className="sm:items-center flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2 py-3 px-3 md:py-4 md:px-6">
                    <span className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>
                      {t("attackDC")}
                    </span>
                    <Controller
                      name={`${fieldArrayName}.${index}.attackBonus`}
                      control={form.control}
                      render={({ field: attackField }) => (
                        <Input
                          {...attackField}
                          onChange={(e) => attackField.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                          type="number"
                          min={0}
                        />
                      )}
                    />
                  </Card>
                  <Card className="sm:items-center flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2 py-3 px-3 md:py-4 md:px-6">
                    <span className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>Portée</span>
                    <Controller
                      name={`${fieldArrayName}.${index}.range`}
                      control={form.control}
                      render={({ field: rangeField }) => <Input {...rangeField} />}
                    />
                  </Card>
                  <Card className="flex flex-col gap-2 py-3 px-3 md:py-4 md:px-6 w-full">
                    <span className={`${accentColor} font-semibold text-sm md:text-base`}>{t("description")}</span>
                    <Controller
                      name={`${fieldArrayName}.${index}.description`}
                      control={form.control}
                      render={({ field: descField }) => (
                        <Textarea
                          {...descField}
                          value={descField.value || ""}
                          placeholder="Description de l'action"
                        />
                      )}
                    />
                  </Card>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </section>
  );
};

export default ActionUpdateSection;
