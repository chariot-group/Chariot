import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Controller, UseFormReturn, FieldArrayWithId, UseFieldArrayAppend, UseFieldArrayRemove } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Plus, Trash2, ListChevronsDownUp, ListChevronsUpDown } from "lucide-react";
import { Field, FieldError } from "@/components/ui/field";

interface AbilitiesUpdateSectionProps {
  title: string;
  form: UseFormReturn<any>;
  fieldArrayName: string;
  fields: FieldArrayWithId<any, any, "id">[];
  append: UseFieldArrayAppend<any, any>;
  remove: UseFieldArrayRemove;
  accentColor: string;
}

const AbilitiesUpdateSection = ({
  title,
  form,
  fieldArrayName,
  fields,
  append,
  remove,
  accentColor,
}: AbilitiesUpdateSectionProps) => {
  const tMagic = useTranslations("characterDetail.magic");

  const [openAccordionValues, setOpenAccordionValues] = useState<string[]>([]);

  return (
    <Card
      className="gap-3 p-4 md:px-6 h-fit"
      role="region"
      aria-label={title}>
      <div className="flex flex-row justify-between items-center">
        <h2 className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>{title}</h2>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ name: "", description: "" })}
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
                setOpenAccordionValues(fields.map((_, index) => `ability-${index}`));
              }
            }}
            className={`cursor-pointer text-sm p-2 hover:underline focus:outline-none focus:underline ${accentColor}`}
            aria-label={openAccordionValues.length > 0 ? tMagic("collapseAll") : tMagic("expandAll")}
            aria-expanded={openAccordionValues.length > 0}>
            {openAccordionValues.length > 0 ? <ListChevronsDownUp /> : <ListChevronsUpDown />}
          </button>
        </div>
      </div>
      {fields.length > 0 && (
        <Accordion
          type="multiple"
          value={openAccordionValues}
          onValueChange={setOpenAccordionValues}
          className="w-full flex flex-col gap-3">
          {fields.map((field, index) => (
            <AccordionItem
              key={field.id}
              value={`ability-${index}`}
              className="border-b border-gray py-1.5">
              <AccordionTrigger
                className="text-left py-1.5 hover:no-underline"
                aria-label={`Détails de la capacité ${index + 1}`}>
                <Controller
                  name={`${fieldArrayName}.${index}.name`}
                  control={form.control}
                  render={({ field: nameField, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      orientation="vertical"
                      className="flex-1">
                      <Input
                        {...nameField}
                        placeholder="Nom de la capacité"
                        className="text-sm"
                        onClick={(e) => e.stopPropagation()}
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.error && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
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
              <AccordionContent className="text-sm sm:text-base pb-3">
                <Controller
                  name={`${fieldArrayName}.${index}.description`}
                  control={form.control}
                  render={({ field: descField, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      orientation="vertical">
                      <label
                        htmlFor={`${fieldArrayName}-description-${index}`}
                        className="text-sm font-medium">
                        Description
                      </label>
                      <Textarea
                        {...descField}
                        id={`${fieldArrayName}-description-${index}`}
                        placeholder="Description de la capacité"
                        rows={3}
                        className="text-sm"
                      />
                      {fieldState.error && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </Card>
  );
};

export default AbilitiesUpdateSection;
