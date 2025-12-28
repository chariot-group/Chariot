import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import ISpellcasting from "@/models/characters/spellcasting/ISpellcasting";
import { PlusCircleIcon, TrashIcon } from "lucide-react";
import { useTranslations } from "next-intl";

interface Props {
  setSelectedSpellcasting: (spellcasting: ISpellcasting) => void;
  selectedSpellcasting: ISpellcasting;
  isUpdate: boolean;
  setSpellCastingIndex: (index: number) => void;
  changeSpellcasting: (spellcasting: ISpellcasting[]) => void;
  spellcasting: ISpellcasting[];
}
export default function SpellCastingsSection({
  isUpdate,
  setSelectedSpellcasting,
  selectedSpellcasting,
  setSpellCastingIndex,
  changeSpellcasting,
  spellcasting,
}: Props) {
  const t = useTranslations("CharacterDetailsPanel");

  const addSpellcasting = () => {
    const newSpellcasting: ISpellcasting = {
      ability: "",
      saveDC: 0,
      attackBonus: 0,
      spellSlotsByLevel: {},
      totalSlots: 0,
      spells: [],
    };
    changeSpellcasting([...spellcasting, newSpellcasting]);
    setSelectedSpellcasting(newSpellcasting);
    setSpellCastingIndex(spellcasting.length);
  };

  const removeSpellcasting = (index: number) => {
    const newSpellcasting = [...spellcasting];
    newSpellcasting.splice(index, 1);
    if (selectedSpellcasting == spellcasting[index]) {
      setSelectedSpellcasting(newSpellcasting[0]);
      setSpellCastingIndex(0);
    }
    changeSpellcasting(newSpellcasting);
  };

  return (
    <div className="flex flex-col gap-3 w-full h-full">
      <div className="flex flex-row justify-between">
        <h1 className="text-foreground text-lg font-bold">{t("spellCasting.title")}</h1>
        {isUpdate && (
          <Tooltip>
            <TooltipTrigger asChild>
              <PlusCircleIcon
                onClick={() => addSpellcasting()}
                className="text-primary cursor-pointer"
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("actions.addSpellCasting")}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="flex flex-col gap-3 h-full overflow-auto">
        {spellcasting.length <= 0 && <span className="text-gray-500 text-sm">{t("spellCasting.noSpellCasting")}</span>}
        {spellcasting.length > 0 &&
          spellcasting.map((spell, index) => (
            <Card
              key={index}
              onClick={() => {
                setSelectedSpellcasting(spell);
                setSpellCastingIndex(index);
              }}
              className={`border-ring shadow-md hover:shadow-[inset_0_0_0_1px_hsl(var(--ring))] cursor-pointer p-4 flex justify-between flex-col gap-2 bg-background ${selectedSpellcasting === spell && "shadow-[inset_0_0_0_1px_hsl(var(--ring))]"}`}>
              <div className="flex flex-row justify-between items-center gap-2">
                <p className="text-sm">
                  <span className="font-bold">{t("spellCasting.ability")}: </span>
                  {spell.ability}
                </p>
                {isUpdate && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TrashIcon
                        onClick={() => removeSpellcasting(index)}
                        className="text-primary cursor-pointer"
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t("actions.deleteSpellCasting")}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-sm">
                  <span className="font-bold">{t("spellCasting.saveDice")} </span>
                  {spell.saveDC}
                </p>
                <p className="text-sm">
                  <span className="font-bold">{t("spellCasting.attackBonus")}: </span>
                  {spell.attackBonus}
                </p>
                <p className="text-sm">
                  <span className="font-bold">{t("spellCasting.countSpell")}: </span>
                  {spell.spells.length}
                </p>
                <p className="text-sm">
                  <span className="font-bold">{t("spellCasting.totalSpellSlots")}: </span>
                  {spell.totalSlots}
                </p>
              </div>
            </Card>
          ))}
      </div>
    </div>
  );
}
