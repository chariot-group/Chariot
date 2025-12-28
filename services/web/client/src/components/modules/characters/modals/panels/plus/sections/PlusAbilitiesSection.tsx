import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PlusCircleIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { Champs } from "@/components/modules/characters/modals/PlayerModalDetails";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ICharacter from "@/models/characters/ICharacter";
import { useTranslations } from "next-intl";

interface Props {
  character: ICharacter;
  isUpdate: boolean;
  updateCharacter: (character: ICharacter) => void;
}
export default function PlusAbilitiesSection({ character, isUpdate, updateCharacter }: Props) {
  const t = useTranslations("CharacterDetailsPanel");

  const [abilities, setAbilities] = useState(character.abilities);

  const updateAbilities = (newAbilities: any) => {
    setAbilities(newAbilities);
    updateCharacter({
      ...character,
      abilities: newAbilities,
    });
  };

  const addAbility = () => {
    updateAbilities([{ name: "", description: "" }, ...abilities]);
  };
  const deleteAbility = (index: number) => {
    const newAbilities = [...abilities];
    newAbilities.splice(index, 1);
    updateAbilities(newAbilities);
  };
  const updateNameAbility = (index: number, newName: string) => {
    const newAbilities = [...abilities];
    newAbilities[index].name = newName;
    updateAbilities(newAbilities);
  };
  const updateDescriptionAbility = (index: number, newDescription: string) => {
    const newAbilities = [...abilities];
    newAbilities[index].description = newDescription;
    updateAbilities(newAbilities);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row gap-2">
        <h1 className="text-foreground text-lg font-bold">{t("abilities.title")}</h1>
        {isUpdate && (
          <Tooltip>
            <TooltipTrigger asChild>
              <PlusCircleIcon
                onClick={() => addAbility()}
                className="text-primary cursor-pointer"
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("actions.addAbility")}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="grid grid-cols-3 gap-4 p-4 items-start">
        {abilities.length <= 0 && (
          <div className="row-start-2 col-span-4 flex items-top justify-center">
            <p className="text-gray-500">{t("abilities.noAbilities")}</p>
          </div>
        )}
        {abilities.length > 0 &&
          abilities.map((ability, index) => (
            <Card
              key={index}
              className="p-4 flex justify-between flex-col gap-2 bg-background">
              <div className="flex flex-row items-center gap-2 w-full">
                <Champs
                  isActive={isUpdate}
                  width="w-full"
                  color="card"
                  label={t("abilities.name")}
                  value={ability.name}
                  id={`class-${index}`}
                  type={"text"}
                  placeholder={t("abilities.name")}
                  setValue={(value) => updateNameAbility(index, value)}
                />
                {isUpdate && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TrashIcon
                        onClick={() => deleteAbility(index)}
                        className="text-red-500 cursor-pointer"
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t("actions.deleteAbility")}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <div className="flex flex-col gap-2 w-full h-full">
                <div className="flex flex-col w-full gap-1.5 h-1/3">
                  <Label
                    htmlFor={"description"}
                    className="text-foreground font-bold">
                    {t("abilities.description")}:
                  </Label>
                  <Textarea
                    readOnly={!isUpdate}
                    id={"description"}
                    placeholder={t("abilities.description")}
                    value={ability.description}
                    onChange={(e) => updateDescriptionAbility(index, e.target.value)}
                    className="h-full rounded-xl resize-none bg-card border-ring"
                  />
                </div>
              </div>
            </Card>
          ))}
      </div>
    </div>
  );
}
