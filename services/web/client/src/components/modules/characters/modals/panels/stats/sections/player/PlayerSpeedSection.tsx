import { Card } from "@/components/ui/card";
import { useState } from "react";
import { Champs } from "@/components/modules/characters/modals/PlayerModalDetails";
import IPlayer from "@/models/player/IPlayer";
import { useTranslations } from "next-intl";

interface Props {
  player: IPlayer;
  isUpdate: boolean;
  updatePlayer: (player: IPlayer) => void;
}
export default function PlayerSpeedSection({ player, isUpdate, updatePlayer }: Props) {
  const t = useTranslations("CharacterDetailsPanel");

  const [walking, setWalking] = useState<number | undefined>(player.stats.speed.walk);
  const [climbing, setClimbing] = useState<number | undefined>(player.stats.speed.climb);
  const [flying, setFlying] = useState<number | undefined>(player.stats.speed.fly);
  const [swimming, setSwimming] = useState<number | undefined>(player.stats.speed.swim);
  const [burrowing, setBurrowing] = useState<number | undefined>(player.stats.speed.burrow);

  const changeWalking = (value: any | undefined) => {
    setWalking(value);
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        speed: {
          ...player.stats.speed,
          walk: parseInt(value),
        },
      },
    });
  };
  const changeClimbing = (value: any | undefined) => {
    setClimbing(value);
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        speed: {
          ...player.stats.speed,
          climb: parseInt(value),
        },
      },
    });
  };
  const changeFlying = (value: any | undefined) => {
    setFlying(value);
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        speed: {
          ...player.stats.speed,
          fly: parseInt(value),
        },
      },
    });
  };
  const changeSwimming = (value: any | undefined) => {
    setSwimming(value);
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        speed: {
          ...player.stats.speed,
          swim: parseInt(value),
        },
      },
    });
  };
  const changeBurrowing = (value: any | undefined) => {
    setBurrowing(value);
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        speed: {
          ...player.stats.speed,
          burrow: parseInt(value),
        },
      },
    });
  };

  return (
    <Card className="p-4 flex flex-col bg-background">
      <Champs
        width="w-auto"
        isActive={isUpdate}
        min={0}
        color="card"
        label={t("speed.walking")}
        value={walking}
        id={"walk"}
        type={"number"}
        placeholder={t("speed.walking")}
        setValue={changeWalking}
      />
      <Champs
        width="w-auto"
        isActive={isUpdate}
        min={0}
        color="card"
        label={t("speed.climbing")}
        value={climbing}
        id={"climb"}
        type={"number"}
        placeholder={t("speed.climbing")}
        setValue={changeClimbing}
      />
      <Champs
        width="w-auto"
        isActive={isUpdate}
        min={0}
        color="card"
        label={t("speed.flying")}
        value={flying}
        id={"fly"}
        type={"number"}
        placeholder={t("speed.flying")}
        setValue={changeFlying}
      />
      <Champs
        width="w-auto"
        isActive={isUpdate}
        min={0}
        color="card"
        label={t("speed.swimming")}
        value={swimming}
        id={"swim"}
        type={"number"}
        placeholder={t("speed.swimming")}
        setValue={changeSwimming}
      />
      <Champs
        width="w-auto"
        isActive={isUpdate}
        min={0}
        color="card"
        label={t("speed.burrowing")}
        value={burrowing}
        id={"burrow"}
        type={"number"}
        placeholder={t("speed.burrowing")}
        setValue={changeBurrowing}
      />
    </Card>
  );
}
