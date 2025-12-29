import { Card } from "@/components/ui/card";
import { Champs } from "@/components/modules/characters/modals/PlayerModalDetails";
import { useState } from "react";
import IPlayer from "@/models/player/IPlayer";
import { useTranslations } from "next-intl";

interface Props {
  player: IPlayer;
  isUpdate: boolean;
  updatePlayer: (player: IPlayer) => void;
}
export default function PlayerFightingSection({ player, isUpdate, updatePlayer }: Props) {
  const t = useTranslations("CharacterDetailsPanel");

  const [maxHitPoints, setMaxHitPoints] = useState<number>(player.stats.maxHitPoints);
  const [currentHitPoints, setCurrentHitPoints] = useState<number>(player.stats.currentHitPoints);
  const [tempHitPoints, setTempHitPoints] = useState<number>(player.stats.tempHitPoints);
  const [armorClass, setArmorClass] = useState<number>(player.stats.armorClass);

  const changeMaxHitPoints = (value: any) => {
    setMaxHitPoints(value);
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        maxHitPoints: parseInt(value),
      },
    });
  };

  const changeCurrentHitPoints = (value: any) => {
    setCurrentHitPoints(value);
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        currentHitPoints: parseInt(value),
      },
    });
  };

  const changeTempHitPoints = (value: any) => {
    setTempHitPoints(value);
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        tempHitPoints: parseInt(value),
      },
    });
  };

  const changeArmorClass = (value: any) => {
    setArmorClass(value);
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        armorClass: parseInt(value),
      },
    });
  };

  return (
    <Card className="p-4 flex flex-col bg-background">
      <Champs
        isActive={isUpdate}
        min={0}
        color="card"
        label={t("batlle.maxHP")}
        value={maxHitPoints}
        id={"maxHP"}
        type={"number"}
        placeholder={t("batlle.maxHP")}
        setValue={changeMaxHitPoints}
      />
      <Champs
        isActive={isUpdate}
        min={0}
        max={maxHitPoints}
        color="card"
        label={t("batlle.currentHP")}
        value={currentHitPoints}
        id={"hp"}
        type={"number"}
        placeholder={t("batlle.currentHP")}
        setValue={changeCurrentHitPoints}
      />
      <Champs
        isActive={isUpdate}
        min={0}
        max={maxHitPoints}
        color="card"
        label={t("batlle.temporaryHP")}
        value={tempHitPoints}
        id={"tempHP"}
        type={"number"}
        placeholder={t("batlle.temporaryHP")}
        setValue={changeTempHitPoints}
      />
      <Champs
        isActive={isUpdate}
        min={0}
        color="card"
        label={t("batlle.armorClass")}
        value={armorClass}
        id={"armorClass"}
        type={"number"}
        placeholder={t("batlle.armorClass")}
        setValue={changeArmorClass}
      />
      <Champs
        isActive={false}
        color="card"
        id={"attackBonus"}
        type={"text"}
        label={t("batlle.initiativeBonus")}
        placeholder={t("batlle.initiativeBonus")}
        value={player.stats.savingThrows.dexterity}
        setValue={() => { }}></Champs>
    </Card>
  );
}
