import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import ICharacter from "@/models/characters/ICharacter";
import { DotIcon, PlusCircleIcon, TrashIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface Props {
  character: ICharacter;
  isUpdate: boolean;
  updateCharacter: (player: ICharacter) => void;
}
export default function PlusResistancesSection({ character, isUpdate, updateCharacter }: Props) {
  const t = useTranslations("CharacterDetailsPanel");

  const [resistances, setResistances] = useState<string[]>(character.affinities.resistances);

  const changeResistances = (value: string[]) => {
    setResistances(value);
    updateCharacter({
      ...character,
      affinities: {
        ...character.affinities,
        resistances: value,
      },
    });
  };

  const addResistance = () => {
    changeResistances([...resistances, ""]);
  };
  const removeResistance = (index: number) => {
    const newResistances = [...resistances];
    newResistances.splice(index, 1);
    changeResistances(newResistances);
  };
  const updateResistance = (index: number, newResistance: string) => {
    const newResistances = [...resistances];
    newResistances[index] = newResistance;
    changeResistances(newResistances);
  };

  return (
    <Card className="p-4 flex flex-col bg-background">
      <div className="flex flex-row gap-3 w-full h-full">
        <div className="flex flex-col gap-3 w-full h-full">
          <div className="flex flex-row justify-between items-center">
            <h2 className="text-lg font-bold">{t("resistances.title")}</h2>
            {isUpdate && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <PlusCircleIcon
                    onClick={() => addResistance()}
                    className="text-primary cursor-pointer"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("actions.addResistance")}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          {resistances.length <= 0 && <span className="text-gray-500 text-sm">{t("resistances.noResistances")}</span>}
          {resistances.length > 0 && (
            <ul className="list-disc">
              {resistances.map((resistance, index) => (
                <li
                  key={index}
                  className="text-sm flex flex-row gap-2 items-center">
                  <DotIcon className="text-foreground" />
                  <Input
                    readOnly={!isUpdate}
                    id={index.toString()}
                    type={"text"}
                    value={resistance ?? ""}
                    onChange={(e) => updateResistance(index, e.target.value)}
                    placeholder={t("resistances.name")}
                    className={`w-[10vh] p-0 h-7 border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0`}
                  />
                  {isUpdate && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <TrashIcon
                          onClick={() => removeResistance(index)}
                          className="cursor-pointer text-primary"
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t("actions.deleteResistance")}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}
