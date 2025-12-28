import { Card } from "@/components/ui/card";
import { useState } from "react";
import INpc from "@/models/npc/INpc";
import { Champs } from "@/components/modules/characters/modals/PlayerModalDetails";
import { useTranslations } from "next-intl";

interface Props {
  npc: INpc;
  isUpdate: boolean;
  updateNpc: (npc: INpc) => void;
}
export default function NpcSpeedSection({ npc, isUpdate, updateNpc }: Props) {
  const t = useTranslations("CharacterDetailsPanel");

  const [walking, setWalking] = useState<number | undefined>(npc.stats.speed.walk);
  const [climbing, setClimbing] = useState<number | undefined>(npc.stats.speed.climb);
  const [flying, setFlying] = useState<number | undefined>(npc.stats.speed.fly);
  const [swimming, setSwimming] = useState<number | undefined>(npc.stats.speed.swim);
  const [burrowing, setBurrowing] = useState<number | undefined>(npc.stats.speed.burrow);

  const changeWalking = (value: any | undefined) => {
    setWalking(value);
    updateNpc({
      ...npc,
      stats: {
        ...npc.stats,
        speed: {
          ...npc.stats.speed,
          walk: parseInt(value),
        },
      },
    });
  };
  const changeClimbing = (value: any | undefined) => {
    setClimbing(value);
    updateNpc({
      ...npc,
      stats: {
        ...npc.stats,
        speed: {
          ...npc.stats.speed,
          climb: parseInt(value),
        },
      },
    });
  };
  const changeFlying = (value: any | undefined) => {
    setFlying(value);
    updateNpc({
      ...npc,
      stats: {
        ...npc.stats,
        speed: {
          ...npc.stats.speed,
          fly: parseInt(value),
        },
      },
    });
  };
  const changeSwimming = (value: any | undefined) => {
    setSwimming(value);
    updateNpc({
      ...npc,
      stats: {
        ...npc.stats,
        speed: {
          ...npc.stats.speed,
          swim: parseInt(value),
        },
      },
    });
  };
  const changeBurrowing = (value: any | undefined) => {
    setBurrowing(value);
    updateNpc({
      ...npc,
      stats: {
        ...npc.stats,
        speed: {
          ...npc.stats.speed,
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
