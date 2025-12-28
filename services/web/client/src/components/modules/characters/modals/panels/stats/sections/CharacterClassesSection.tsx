import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import IPlayer from "@/models/player/IPlayer";
import { PlusCircleIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { Champs } from "@/components/modules/characters/modals/PlayerModalDetails";
import { useTranslations } from "next-intl";

interface Props {
  player: IPlayer;
  isUpdate: boolean;
  updatePlayer: (player: IPlayer) => void;
}
export default function CharacterClassesSection({ player, isUpdate, updatePlayer }: Props) {
  const t = useTranslations("CharacterDetailsPanel");

  const [classes, setClasses] = useState(player.class);

  const changeClasses = (value: any[]) => {
    setClasses(value);
    updatePlayer({
      ...player,
      class: value,
    });
  };

  const addClass = () => {
    const newClass = {
      name: "",
      subclass: "",
      level: 1,
      hitDice: 6,
    };
    changeClasses([newClass, ...classes]);
  };

  const updateNameClass = (index: number, name: string) => {
    const newClasses = [...classes];
    newClasses[index].name = name;
    changeClasses(newClasses);
  };

  const updateSubclassClass = (index: number, subclass: string) => {
    const newClasses = [...classes];
    newClasses[index].subclass = subclass;
    changeClasses(newClasses);
  };

  const updateLevelClass = (index: number, level: number) => {
    const newClasses = [...classes];
    newClasses[index].level = level;
    changeClasses(newClasses);
  };

  const updateHitDiceClass = (index: number, hitDice: number) => {
    const newClasses = [...classes];
    newClasses[index].hitDice = hitDice;
    changeClasses(newClasses);
  };

  const deleteClass = (index: number) => {
    const newClasses = [...classes];
    newClasses.splice(index, 1);
    changeClasses(newClasses);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row gap-2">
        <h1 className="text-foreground text-lg font-bold">{t("classes.title")}</h1>
        {isUpdate && (
          <Tooltip>
            <TooltipTrigger asChild>
              <PlusCircleIcon
                onClick={() => addClass()}
                className="text-primary cursor-pointer"
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("actions.addClass")}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="grid grid-cols-3 gap-4 p-4 items-start">
        {classes.length <= 0 && (
          <div className="row-start-2 col-span-4 flex items-top justify-center">
            <p className="text-gray-500">{t("classes.noClass")}</p>
          </div>
        )}
        {classes.length > 0 &&
          classes.map((classe, index) => (
            <Card
              key={index}
              className="p-4 flex flex-col gap-2 bg-background">
              <div className="flex flex-row gap-2 justify-between">
                <Champs
                  isActive={isUpdate}
                  color="card"
                  label={t("classes.className")}
                  value={classe.name}
                  id={`class-${index}`}
                  type={"text"}
                  placeholder={t("classes.className")}
                  setValue={(value) => updateNameClass(index, value)}
                />
                {isUpdate && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TrashIcon
                        onClick={() => deleteClass(index)}
                        className="text-red-500 cursor-pointer"
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t("actions.deleteClass")}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <div className="flex flex-col w-full gap-2">
                <Champs
                  isActive={isUpdate}
                  width="w-auto"
                  color="card"
                  label={t("classes.subClass")}
                  value={classe.subclass}
                  id={`subclass-${index}`}
                  type={"text"}
                  placeholder={t("classes.subClass")}
                  setValue={(value) => updateSubclassClass(index, value)}
                />
                <Champs
                  isActive={isUpdate}
                  color="card"
                  label={t("classes.level")}
                  value={classe.level}
                  id={`level-${index}`}
                  type={"number"}
                  placeholder={t("classes.subClass")}
                  setValue={(value) => updateLevelClass(index, Number(value))}
                />
                <Champs
                  isActive={isUpdate}
                  width="w-auto"
                  color="card"
                  label={t("classes.hitDice")}
                  value={classe.hitDice}
                  id={`hitDice-${index}`}
                  type={"number"}
                  placeholder={t("classes.hitDice")}
                  setValue={(value) => updateHitDiceClass(index, Number(value))}
                />
              </div>
            </Card>
          ))}
      </div>
    </div>
  );
}
