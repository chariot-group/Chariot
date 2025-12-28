import { Card } from "@/components/ui/card";
import INpc from "@/models/npc/INpc";
import { useState } from "react";
import { Champs } from "@/components/modules/characters/modals/PlayerModalDetails";
import { useTranslations } from "next-intl";

interface Props {
  npc: INpc;
  isUpdate: boolean;
  updateNpc: (npc: INpc) => void;
}
export default function NpcDetailsSection({ npc, isUpdate, updateNpc }: Props) {
  const t = useTranslations("CharacterDetailsPanel");

  const [passivePerception, setPassivePerception] = useState<number>(npc.stats.passivePerception);

  const changePassivePerception = (value: any) => {
    setPassivePerception(value);
    updateNpc({
      ...npc,
      stats: {
        ...npc.stats,
        passivePerception: parseInt(value),
      },
    });
  };

  return (
    <Card className="p-4 flex flex-col bg-background">
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
    </Card>
  );
}
