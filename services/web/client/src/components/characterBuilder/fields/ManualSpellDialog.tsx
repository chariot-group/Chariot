"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SpellEditForm from "@/components/character/tabContents/magic/form/SpellEditForm";
import type { Character, Spell } from "@/types/character";

/**
 * Manual spell entry of the builder: the Magic tab spell fields (`SpellEditForm`) on a local form.
 * Saving returns the spell, cancelling returns nothing.
 * @see FR-ruleset-character-builder — Web builder UI (Spells, lot B)
 */
export function ManualSpellDialog({
  open,
  initialSpell,
  defaultLevel,
  attackBonus,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  initialSpell?: Partial<Spell>;
  defaultLevel: number;
  attackBonus: number;
  onOpenChange: (open: boolean) => void;
  onSave: (spell: Partial<Spell>) => void;
}) {
  const t = useTranslations("characterBuilder.spells");
  const form = useForm<Character>({ defaultValues: { spellcasting: [] } as unknown as Character });
  const name = useWatch({ control: form.control, name: "spellcasting.0.spells.0.name" as never }) as unknown;

  useEffect(() => {
    if (!open) return;
    form.reset({
      spellcasting: [{ spells: [{ name: "", level: defaultLevel, components: [], ...initialSpell }] }],
    } as unknown as Character);
  }, [open, initialSpell, defaultLevel, form]);

  const canSave = typeof name === "string" && name.trim() !== "";

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
        aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-primary-light">
            {initialSpell ? t("manualEditTitle") : t("manualTitle")}
          </DialogTitle>
        </DialogHeader>
        <form
          id="builder-manual-spell"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!canSave) return;
            onSave(form.getValues("spellcasting.0.spells.0" as never) as Partial<Spell>);
          }}>
          {open ? (
            <SpellEditForm
              form={form}
              spellcastingIndex={0}
              spellIndex={0}
              idPrefix="builder-manual-spell"
              isInnate={false}
              attackBonus={attackBonus}
            />
          ) : null}
        </form>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            form="builder-manual-spell"
            variant="accent"
            disabled={!canSave}>
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
