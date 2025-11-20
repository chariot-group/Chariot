import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import ICharacter from "@/models/characters/ICharacter";
import ISense from "@/models/npc/stat/sub/ISenses";
import { DotIcon, PlusCircleIcon, TrashIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface Props {
  character: ICharacter;
  isUpdate: boolean;
  updateCharacter: (npc: ICharacter) => void;
}
export default function CharacterSensesSection({ character, isUpdate, updateCharacter }: Props) {
  const t = useTranslations("CharacterDetailsPanel");

  const [senses, setSenses] = useState<ISense[]>(character.stats.senses);

  const changeSenses = (value: ISense[]) => {
    setSenses(value);
    updateCharacter({
      ...character,
      stats: {
        ...character.stats,
        senses: value,
      },
    });
  };

  const addSense = () => {
    const newSense = { name: "", value: 0 };
    changeSenses([...senses, newSense]);
  };

  const removeSense = (index: number) => {
    const newSenses = senses.filter((_, i) => i !== index);
    changeSenses(newSenses);
  };

  const updateSense = (index: number, key: keyof ISense, value: string | number) => {
    const newSenses = [...senses];
    newSenses[index] = { ...newSenses[index], [key]: key === "value" ? parseInt(value as string) : value };
    changeSenses(newSenses);
  };

  return (
    <Card className="p-4 flex flex-col bg-background">
      <div className="flex flex-row gap-3 w-full h-full">
        <div className="flex flex-col gap-3 w-full h-full">
          <div className="flex flex-row justify-between items-center">
            <h2 className="text-lg font-bold">{t("senses.title")}</h2>
            {isUpdate && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <PlusCircleIcon
                    onClick={() => addSense()}
                    className="text-primary cursor-pointer"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("actions.addSens")}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          {senses.length <= 0 && <span className="text-gray-500 text-sm">{t("senses.noSens")}</span>}
          {senses.length > 0 && (
            <ul className="list-disc">
              {senses.map((sense, index) => {
                return (
                  <li
                    key={index}
                    className="text-sm flex flex-row gap-0.5 items-center">
                    <DotIcon className="text-foreground" />
                    <Input
                      readOnly={!isUpdate}
                      id={index.toString()}
                      type={"text"}
                      value={sense?.name || ""}
                      onChange={(e) => updateSense(index, "name", e.target.value)}
                      placeholder={t("senses.sensName")}
                      className={`w-1/2 p-0 h-7 border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0`}
                    />
                    <span> :</span>
                    <Input
                      readOnly={!isUpdate}
                      min={0}
                      id={index.toString()}
                      type={"number"}
                      value={sense?.value || 0}
                      onChange={(e) => updateSense(index, "value", e.target.value)}
                      placeholder={t("senses.value")}
                      className={`w-1/3 p-0 h-7 border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0`}
                    />
                    {isUpdate && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <TrashIcon
                            onClick={() => removeSense(index)}
                            className="cursor-pointer text-primary ml-2"
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t("actions.deleteSens")}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}
