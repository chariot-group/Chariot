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
  updateCharacter: (character: ICharacter) => void;
}
export default function PlusImmunitiesSection({ character, isUpdate, updateCharacter }: Props) {
  const t = useTranslations("CharacterDetailsPanel");

  const [immunities, setImmunities] = useState<string[]>(character.affinities.immunities);

  const changeImmunities = (value: string[]) => {
    setImmunities(value);
    updateCharacter({
      ...character,
      affinities: {
        ...character.affinities,
        immunities: value,
      },
    });
  };

  const addImmmunitie = () => {
    changeImmunities([...immunities, ""]);
  };
  const removeImmunitie = (index: number) => {
    const newImmunities = [...immunities];
    newImmunities.splice(index, 1);
    changeImmunities(newImmunities);
  };
  const updateImmunitie = (index: number, newImmunitie: string) => {
    const newImmunities = [...immunities];
    newImmunities[index] = newImmunitie;
    changeImmunities(newImmunities);
  };

  return (
    <Card className="p-4 flex flex-col bg-background">
      <div className="flex flex-row gap-3 w-full h-full">
        <div className="flex flex-col gap-3 w-full h-full">
          <div className="flex flex-row justify-between items-center">
            <h2 className="text-lg font-bold">{t("immunities.title")}</h2>
            {isUpdate && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <PlusCircleIcon
                    onClick={() => addImmmunitie()}
                    className="text-primary cursor-pointer"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("actions.addImmunity")}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          {immunities.length <= 0 && <span className="text-gray-500 text-sm">{t("immunities.noImmunities")}</span>}
          {immunities.length > 0 && (
            <ul className="list-disc">
              {immunities.map((immunitie, index) => (
                <li
                  key={index}
                  className="text-sm flex flex-row gap-2 items-center">
                  <DotIcon className="text-foreground" />
                  <Input
                    readOnly={!isUpdate}
                    id={index.toString()}
                    type={"text"}
                    value={immunitie ?? ""}
                    onChange={(e) => updateImmunitie(index, e.target.value)}
                    placeholder={t("immunities.name")}
                    className={`w-[10vh] p-0 h-7 border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0`}
                  />
                  {isUpdate && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {isUpdate && (
                          <TrashIcon
                            onClick={() => removeImmunitie(index)}
                            className="cursor-pointer text-primary"
                          />
                        )}
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t("actions.deleteImmunity")}</p>
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
