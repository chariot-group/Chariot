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
  const tEdit = useTranslations("characterDetail.edit");

  const [openAccordionValues, setOpenAccordionValues] = useState<string[]>([]);

  return (
    <section className="flex flex-col gap-2 w-full">
      <Card className="gap-3 p-4 md:px-6 h-fit justify-between flex-row items-center">
        <h2 className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>{title}</h2>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              append({
                name: "",
                type: "",
                description: "",
                attackBonus: 0,
                damage: [],
                range: "",
              });
              // Attendre le prochain rendu pour que le nouvel élément soit présent
              setTimeout(() => {
                const lastAction = fields.length > 0 ? document.getElementById(`action-${fields.length - 1}`) : null;
                if (lastAction) {
                  lastAction.scrollIntoView({ behavior: "smooth", block: "center" });
                }
              }, 100);
            }}
            className="flex items-center gap-2">
            <Plus className="size-4" />
            <span className="hidden sm:block">{tEdit("add")}</span>
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
          {fields.map((field, index) => {
            const actionName = form.watch(`${fieldArrayName}.${index}.name`);
            const actionType = form.watch(`${fieldArrayName}.${index}.type`);

            // Vérifie si au moins un champ de l'action courante est invalide
            const nameError = form.getFieldState(`${fieldArrayName}.${index}.name`).invalid;
            const typeError = form.getFieldState(`${fieldArrayName}.${index}.type`).invalid;
            const attackBonusError = form.getFieldState(`${fieldArrayName}.${index}.attackBonus`).invalid;
            const rangeError = form.getFieldState(`${fieldArrayName}.${index}.range`).invalid;
            const descriptionError = form.getFieldState(`${fieldArrayName}.${index}.description`).invalid;
            const hasError = nameError || typeError || attackBonusError || rangeError || descriptionError;

            return (
              <AccordionItem
                id={`action-${index}`}
                key={field.id}
                value={`action-${index}`}
                className="flex flex-col gap-2">
                <Card className={`gap-2 p-0 flex-col ${hasError ? "ring-destructive ring" : ""}`}>
                  <div className="relative py-3 px-3 md:py-2 md:px-6">
                    <AccordionTrigger
                      className="w-full items-center gap-2 pr-10"
                      aria-label={`Détails de l'action ${index + 1}`}>
                      <div className="truncate flex items-center gap-1">
                        <span className={`text-base md:text-lg font-medium text-left truncate`}>{actionName}</span>
                        <span className="text-base md:text-lg font-medium text-left">
                          {actionType && ` (${actionType})`}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(index);
                      }}
                      className="text-red-500 shrink-0 absolute right-3 md:right-6 top-1/2 -translate-y-1/2">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </Card>
                <AccordionContent>
                  <div className="flex flex-wrap gap-2 items-start">
                    <Card className="sm:items-center flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2 py-3 px-3 md:py-4 md:px-6 w-full">
                      <span className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>{t("name")}</span>
                      <Controller
                        name={`${fieldArrayName}.${index}.name`}
                        control={form.control}
                        render={({ field: nameField, fieldState }) => (
                          <Field
                            data-invalid={fieldState.invalid}
                            orientation="vertical">
                            <Input
                              {...nameField}
                              className="text-sm"
                              required
                              aria-invalid={fieldState.invalid}
                            />
                            {fieldState.error && <FieldError errors={[fieldState.error]} />}
                          </Field>
                        )}
                      />
                    </Card>
                    <Card className="sm:items-center flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2 py-3 px-3 md:py-4 md:px-6">
                      <span className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>{t("type")}</span>
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
                      <span className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>
                        {t("damageType")}
                      </span>
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
                          />
                        )}
                      />
                    </Card>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </section>
  );
};

export default ActionUpdateSection;
