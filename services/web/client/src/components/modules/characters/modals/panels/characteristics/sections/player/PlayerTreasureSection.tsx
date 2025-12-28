import { Card } from "@/components/ui/card";
import { Champs } from "@/components/modules/characters/modals/PlayerModalDetails";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import IPlayer from "@/models/player/IPlayer";
import { useTranslations } from "next-intl";

interface Props {
  player: IPlayer;
  isUpdate: boolean;
  updatePlayer: (player: IPlayer) => void;
}
export default function PlayerTreasureSection({ player, isUpdate, updatePlayer }: Props) {
  const t = useTranslations("CharacterDetailsPanel");

  const [cp, setCp] = useState<number>(player.treasure.cp);
  const [sp, setSp] = useState<number>(player.treasure.sp);
  const [ep, setEp] = useState<number>(player.treasure.ep);
  const [gp, setGp] = useState<number>(player.treasure.gp);
  const [pp, setPp] = useState<number>(player.treasure.pp);
  const [notes, setNotes] = useState<string | undefined>(player.treasure.notes);

  const changeCp = (value: any) => {
    setCp(value);
    updatePlayer({
      ...player,
      treasure: {
        ...player.treasure,
        cp: parseInt(value),
      },
    });
  };
  const changeSp = (value: any) => {
    setSp(value);
    updatePlayer({
      ...player,
      treasure: {
        ...player.treasure,
        sp: parseInt(value),
      },
    });
  };
  const changeEp = (value: any) => {
    setEp(value);
    updatePlayer({
      ...player,
      treasure: {
        ...player.treasure,
        ep: parseInt(value),
      },
    });
  };
  const changeGp = (value: any) => {
    setGp(value);
    updatePlayer({
      ...player,
      treasure: {
        ...player.treasure,
        gp: parseInt(value),
      },
    });
  };
  const changePp = (value: any) => {
    setPp(value);
    updatePlayer({
      ...player,
      treasure: {
        ...player.treasure,
        pp: parseInt(value),
      },
    });
  };
  const changeNotes = (value: string) => {
    setNotes(value);
    updatePlayer({
      ...player,
      treasure: {
        ...player.treasure,
        notes: value,
      },
    });
  };

  return (
    <Card className="p-4 flex flex-row gap-2 bg-background">
      <div className="flex flex-col w-1/4 justify-center">
        <Champs
          width="w-1/3"
          isActive={isUpdate}
          min={0}
          color="card"
          label={t("treasure.cp")}
          value={cp}
          id={"cp"}
          type={"number"}
          placeholder={t("treasure.cp")}
          setValue={changeCp}
        />
        <Champs
          width="w-1/3"
          isActive={isUpdate}
          min={0}
          color="card"
          label={t("treasure.sp")}
          value={sp}
          id={"sp"}
          type={"number"}
          placeholder={t("treasure.sp")}
          setValue={changeSp}
        />
        <Champs
          width="w-1/3"
          isActive={isUpdate}
          min={0}
          color="card"
          label={t("treasure.ep")}
          value={ep}
          id={"ep"}
          type={"number"}
          placeholder={t("treasure.ep")}
          setValue={changeEp}
        />
        <Champs
          width="w-1/3"
          isActive={isUpdate}
          min={0}
          color="card"
          id={"gp"}
          type={"number"}
          label={t("treasure.gp")}
          placeholder={t("treasure.gp")}
          value={gp}
          setValue={changeGp}></Champs>
        <Champs
          width="w-1/3"
          isActive={isUpdate}
          min={0}
          color="card"
          id={"pp"}
          type={"number"}
          label={t("treasure.pp")}
          placeholder={t("treasure.pp")}
          value={pp}
          setValue={changePp}></Champs>
      </div>
      <div className="flex flex-col h-full gap-2 w-3/4">
        <Label
          htmlFor={"notes"}
          className="text-foreground font-bold">
          {t("treasure.notes")}:
        </Label>
        <Textarea
          readOnly={!isUpdate}
          id={"notes"}
          placeholder={t("treasure.notes")}
          value={notes}
          onChange={(e) => changeNotes(e.target.value)}
          className="rounded-xl w-full h-full resize-none bg-card border-ring"
        />
      </div>
    </Card>
  );
}
