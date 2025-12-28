import { Card } from "@/components/ui/card";
import { useState } from "react";
import IPlayer from "@/models/player/IPlayer";
import { Checkbox } from "@/components/ui/checkbox";
import { Champs } from "@/components/modules/characters/modals/PlayerModalDetails";
import { useTranslations } from "next-intl";

interface Props {
  player: IPlayer;
  isUpdate: boolean;
  updatePlayer: (player: IPlayer) => void;
}
export default function PlayerDetailsSection({ player, isUpdate, updatePlayer }: Props) {
  const t = useTranslations("CharacterDetailsPanel");

  const [proficiencyBonus, setProficiencyBonus] = useState<number>(player.stats.proficiencyBonus);
  const [passivePerception, setPassivePerception] = useState<number>(player.stats.passivePerception);

  const [inspiration, setInspiration] = useState<boolean>(player.inspiration);

  const changeProficiencyBonus = (value: any) => {
    setProficiencyBonus(value);
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        proficiencyBonus: parseInt(value),
      },
    });
  };
  const changePassivePerception = (value: any) => {
    setPassivePerception(value);
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        passivePerception: parseInt(value),
      },
    });
  };
  const changeInspiration = (value: boolean) => {
    setInspiration(value);
    updatePlayer({
      ...player,
      inspiration: value,
    });
  };

  return (
    <Card className="p-4 flex flex-col bg-background">
      <Champs
        isActive={isUpdate}
        min={0}
        color="card"
        label={t("details.proficiencyBonus")}
        value={proficiencyBonus}
        id={"proficiencyBonus"}
        type={"number"}
        placeholder={t("details.proficiencyBonus")}
        setValue={changeProficiencyBonus}
      />
      <Champs
        isActive={isUpdate}
        min={0}
        color="card"
        label={t("details.passivePerception")}
        value={passivePerception}
        id={"passivePerception"}
        type={"number"}
        placeholder={t("details.passivePerception")}
        setValue={changePassivePerception}
      />
      <div className="flex items-center space-x-2">
        <label
          htmlFor="inspiration"
          className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {t("details.inspiration")}:
        </label>
        <Checkbox
          disabled={!isUpdate}
          id="inspiration"
          checked={inspiration}
          onCheckedChange={(state: boolean) => changeInspiration(state)}
        />
      </div>
    </Card>
  );
}
