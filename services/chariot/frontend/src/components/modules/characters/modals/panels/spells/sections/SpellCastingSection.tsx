import { Card } from "@/components/ui/card";
import ISpellcasting, { ISpellSlotsByLevel } from "@/models/characters/spellcasting/ISpellcasting";
import { useEffect, useState } from "react";
import { Champs } from "@/components/modules/characters/modals/PlayerModalDetails";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PlusCircleIcon, TrashIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import ISpell from "@/models/characters/spellcasting/ISpell";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "next-intl";

interface Props {
  selectedSpellcasting: ISpellcasting;
  isUpdate: boolean;
  changeSpellCasting: (spellcasting: ISpellcasting) => void;
}
export default function SpellCastingSection({ selectedSpellcasting, isUpdate, changeSpellCasting }: Props) {
  const t = useTranslations("CharacterDetailsPanel");

  const [ability, setAbility] = useState<string | undefined>(selectedSpellcasting.ability);
  const [saveDC, setSaveDC] = useState<number | undefined>(selectedSpellcasting.saveDC);
  const [attackBonus, setAttackBonus] = useState<number>(selectedSpellcasting.attackBonus);
  const [totalSlots, setTotalSlots] = useState<number>(selectedSpellcasting.totalSlots);

  const [levelSelected, setLevelSelected] = useState<number>(1);

  const changeAbility = (value: string) => {
    setAbility(value);
    changeSpellCasting({
      ...selectedSpellcasting,
      ability: value,
    });
  };
  const changeSaveDC = (value: any) => {
    setSaveDC(value);
    changeSpellCasting({
      ...selectedSpellcasting,
      saveDC: parseInt(value),
    });
  };
  const changeAttackBonus = (value: any) => {
    setAttackBonus(value);
    changeSpellCasting({
      ...selectedSpellcasting,
      attackBonus: parseInt(value),
    });
  };
  const changeTotalSlots = (value: any) => {
    setTotalSlots(value);
    changeSpellCasting({
      ...selectedSpellcasting,
      totalSlots: parseInt(value),
    });
  };

  const [spellSlotsByLevel, setSpellSlotsByLevel] = useState<ISpellSlotsByLevel>(
    selectedSpellcasting.spellSlotsByLevel || {},
  );

  const [spells, setSpells] = useState<ISpell[]>(selectedSpellcasting.spells);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    setAbility(selectedSpellcasting.ability);
    setSaveDC(selectedSpellcasting.saveDC);
    setAttackBonus(selectedSpellcasting.attackBonus);
    setTotalSlots(selectedSpellcasting.totalSlots);
    setSpellSlotsByLevel(selectedSpellcasting.spellSlotsByLevel || {});
    setSpells(selectedSpellcasting.spells);
    setLoading(false);
  }, [selectedSpellcasting]);

  const updateSpellSlots = (value: ISpellSlotsByLevel) => {
    setSpellSlotsByLevel(value);
    changeSpellCasting({
      ...selectedSpellcasting,
      spellSlotsByLevel: value,
    });
  };

  const addSlot = () => {
    const newSpellSlotsByLevel = { ...spellSlotsByLevel };
    newSpellSlotsByLevel[Object.keys(spellSlotsByLevel).length + 1] = {
      total: 0,
      used: 0,
    };
    updateSpellSlots(newSpellSlotsByLevel);
  };
  const removeSpellSlot = (level: number) => {
    const newSpellSlotsByLevel = { ...spellSlotsByLevel };
    delete newSpellSlotsByLevel[level];
    updateSpellSlots(newSpellSlotsByLevel);
  };
  const updateUsedSlot = (level: number, used: any) => {
    const newSpellSlotsByLevel = { ...spellSlotsByLevel };
    newSpellSlotsByLevel[level] = {
      ...newSpellSlotsByLevel[level],
      used: parseInt(used),
    };

    updateSpellSlots(newSpellSlotsByLevel);
  };
  const updateTotalSlots = (level: number, total: any) => {
    const newSpellSlotsByLevel = { ...spellSlotsByLevel };
    newSpellSlotsByLevel[level] = {
      ...newSpellSlotsByLevel[level],
      total: parseInt(total),
    };

    let newTotal = 0;
    Object.keys(spellSlotsByLevel).map((lev, index) => {
      if (level == parseInt(lev)) {
        newTotal += parseInt(total);
      } else {
        newTotal += newSpellSlotsByLevel[lev as any].total || 0;
      }
    });
    changeTotalSlots(newTotal);

    updateSpellSlots(newSpellSlotsByLevel);
  };

  const updateSpell = (spells: ISpell[]) => {
    setSpells(spells);
    changeSpellCasting({
      ...selectedSpellcasting,
      spells: spells,
    });
  };

  const addSpell = () => {
    const newSpell = {
      name: "",
      level: levelSelected,
      description: "",
      castingTime: "",
      range: "",
      components: [],
    };
    updateSpell([...spells, newSpell]);
  };
  const removeSpell = (index: number) => {
    const newSpells = [...spells];
    newSpells.splice(index, 1);
    updateSpell(newSpells);
  };
  const updateNameSpell = (index: number, name: string) => {
    const newSpells = [...spells];
    newSpells[index] = {
      ...newSpells[index],
      name: name,
    };
    updateSpell(newSpells);
  };
  const updateLevelSpell = (index: number, level: any) => {
    const newSpells = [...spells];
    newSpells[index] = {
      ...newSpells[index],
      level: parseInt(level),
    };
    updateSpell(newSpells);
  };
  const updateDescriptionSpell = (index: number, description: string) => {
    const newSpells = [...spells];
    newSpells[index] = {
      ...newSpells[index],
      description: description,
    };
    updateSpell(newSpells);
  };
  const updateCastingTimeSpell = (index: number, castingTime: string) => {
    const newSpells = [...spells];
    newSpells[index] = {
      ...newSpells[index],
      castingTime: castingTime,
    };
    updateSpell(newSpells);
  };
  const updateRangeSpell = (index: number, range: string) => {
    const newSpells = [...spells];
    newSpells[index] = {
      ...newSpells[index],
      range: range,
    };
    updateSpell(newSpells);
  };
  const updateComponentsSpell = (index: number, components: string[]) => {
    const newSpells = [...spells];
    newSpells[index] = {
      ...newSpells[index],
      components: components,
    };
    updateSpell(newSpells);
  };

  return (
    <div className="flex flex-row gap-3 w-full h-full">
      <div className="flex flex-col gap-3 w-1/4 h-full">
        <Card className={"p-4 flex flex-col bg-background"}>
          <Champs
            isActive={isUpdate}
            color="card"
            id={"ability"}
            type={"text"}
            label={t("spellCasting.ability")}
            placeholder={t("spellCasting.ability")}
            value={ability}
            setValue={changeAbility}></Champs>
          <Champs
            isActive={isUpdate}
            color="card"
            min={0}
            id={"saveDC"}
            type={"number"}
            label={t("spellCasting.saveDice")}
            placeholder={t("spellCasting.saveDice")}
            value={saveDC}
            setValue={changeSaveDC}></Champs>
          <Champs
            isActive={isUpdate}
            color="card"
            min={0}
            id={"attackBonus"}
            type={"number"}
            label={t("spellCasting.attackBonus")}
            placeholder={t("spellCasting.attackBonus")}
            value={attackBonus}
            setValue={changeAttackBonus}></Champs>
          <p className="text-sm">
            <span className="font-bold">{t("spellCasting.totalSpellSlots")}: </span>
            {totalSlots}
          </p>
        </Card>

        <Card className={"p-4 gap-2 flex flex-col bg-background"}>
          <div className="flex flex-row gap-3 justify-between">
            <h1>Slots</h1>
            {isUpdate && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <PlusCircleIcon
                    onClick={() => addSlot()}
                    className="text-primary cursor-pointer"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("actions.addSlot")}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="flex flex-col gap-3">
            {loading ||
              (Object.keys(spellSlotsByLevel).length <= 0 && (
                <div className="row-start-2 col-span-4 flex items-top justify-center">
                  <p className="text-gray-500">{t("spellCasting.slots.noSlots")}</p>
                </div>
              ))}
            {!loading &&
              Object.keys(spellSlotsByLevel).map((level, index) => (
                <Card
                  key={index}
                  onClick={() => setLevelSelected(parseInt(level))}
                  className={`p-4 flex hover:shadow-[inset_0_0_0_1px_hsl(var(--ring))] h-full cursor-pointer flex-col bg-card ${levelSelected === parseInt(level) && 'shadow-[inset_0_0_0_1px_hsl(var(--ring))]'}`}>
                  <div className="flex flex-row gap-3 justify-between items-center">
                    <p className="text-sm">
                      <span className="font-bold">{t("spellCasting.slots.level")}: </span>
                      {level}
                    </p>
                    {isUpdate && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <TrashIcon
                            onClick={() => removeSpellSlot(level as any)}
                            className="text-primary cursor-pointer"
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t("actions.deleteSlot")}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <div className="flex flex-row gap-3">
                    <div className="flex flex-row items-center w-full">
                      <Label
                        htmlFor={"total" + level}
                        className="text-foreground flex flex-row gap-1 items-center w-full">
                        <span className="font-bold w-auto">{t("spellCasting.slots.totalSlots")}:</span>
                        <Input
                          readOnly={!isUpdate}
                          min={0}
                          id={"total" + level}
                          type={"number"}
                          value={spellSlotsByLevel[level as any].total}
                          onChange={(e) => updateTotalSlots(level as any, e.target.value as any)}
                          placeholder={t("spellCasting.slots.totalSlots")}
                          className={`w-10 p-0 h-7 border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0`}
                        />
                      </Label>
                    </div>
                    <div className="flex flex-row items-center w-full">
                      <Label
                        htmlFor={"used" + level}
                        className="text-foreground flex flex-row gap-1 items-center w-full">
                        <span className="font-bold w-auto">{t("spellCasting.slots.usedSlots")}:</span>
                        <Input
                          readOnly={!isUpdate}
                          max={spellSlotsByLevel[level as any].total}
                          min={0}
                          id={"used" + level}
                          type={"number"}
                          value={spellSlotsByLevel[level as any].used}
                          onChange={(e) => updateUsedSlot(level as any, e.target.value as any)}
                          placeholder={t("spellCasting.slots.usedSlots")}
                          className={`w-10 p-0 h-7 border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0`}
                        />
                      </Label>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </Card>
      </div>
      <div className="flex flex-col border border-ring h-full"></div>
      <div className="flex flex-col gap-3 w-3/4 h-full">
        <div className="flex flex-row gap-3 w-full">
          <h1 className="text-foreground text-lg font-bold">{t("spellCasting.spells.title")}</h1>
          {isUpdate && (
            <Tooltip>
              <TooltipTrigger asChild>
                <PlusCircleIcon
                  onClick={() => addSpell()}
                  className="text-primary cursor-pointer"
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("actions.addSpell")}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="grid grid-cols-3 gap-4 items-start">
          {loading ||
            (spells.length <= 0 && (
              <div className="row-start-2 col-span-4 flex items-top justify-center">
                <p className="text-gray-500">{t("spellCasting.spells.noSpells")}</p>
              </div>
            ))}
          {!loading &&
            spells.map((spell, index) => {

              if (spell.level !== levelSelected) {
                return null;
              }

              return (
                <Card
                  key={index}
                  className={"p-4 flex flex-col bg-background"}>
                  <div className="flex flex-row gap-3 justify-between items-center">
                    <Champs
                      isActive={isUpdate}
                      color="card"
                      id={"name" + index}
                      type={"text"}
                      label={t("spellCasting.spells.name")}
                      placeholder={t("spellCasting.spells.name")}
                      value={spell.name}
                      setValue={(value) => updateNameSpell(index, value)}></Champs>
                    {isUpdate && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <TrashIcon
                            onClick={() => removeSpell(index)}
                            className="text-primary cursor-pointer"
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t("actions.deleteSpell")}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <Champs
                      isActive={isUpdate}
                      color="card"
                      id={"level" + index}
                      type={"number"}
                      label={t("spellCasting.spells.level")}
                      placeholder={t("spellCasting.spells.level")}
                      value={spell.level}
                      setValue={(value) => updateLevelSpell(index, value)}></Champs>
                    <Champs
                      isActive={isUpdate}
                      color="card"
                      id={"castingTime" + index}
                      type={"text"}
                      label={t("spellCasting.spells.castingTime")}
                      placeholder={t("spellCasting.spells.castingTime")}
                      value={spell.castingTime}
                      setValue={(value) => updateCastingTimeSpell(index, value)}></Champs>
                    <Champs
                      isActive={isUpdate}
                      color="card"
                      id={"range" + index}
                      type={"text"}
                      label={t("spellCasting.spells.range")}
                      placeholder={t("spellCasting.spells.range")}
                      value={spell.range}
                      setValue={(value) => updateRangeSpell(index, value)}></Champs>
                    <Champs
                      isActive={isUpdate}
                      color="card"
                      id={"components" + index}
                      type={"text"}
                      label={t("spellCasting.spells.components")}
                      placeholder={t("spellCasting.spells.components")}
                      value={spell.components.join(", ")}
                      setValue={(value) => updateComponentsSpell(index, value.split(", "))}></Champs>
                    <div className="flex flex-col w-full gap-1.5 mt-1 h-1/3">
                      <Label
                        htmlFor={"description"}
                        className="text-foreground font-bold">
                        {t("spellCasting.spells.description")}:
                      </Label>
                      <Textarea
                        readOnly={!isUpdate}
                        id={"description" + index}
                        placeholder={t("spellCasting.spells.description")}
                        value={spell.description}
                        onChange={(e) => updateDescriptionSpell(index, e.target.value)}
                        className="h-full rounded-xl resize-none bg-card border-ring"
                      />
                    </div>
                  </div>
                </Card>
              )
            })}
        </div>
      </div>
    </div>
  );
}
