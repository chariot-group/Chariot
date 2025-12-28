import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import IPlayer from "@/models/player/IPlayer";
import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import Characteristic from "@/components/modules/characters/modals/panels/characteristics/PlayerCharacteristicSection";
import Stats from "@/components/modules/characters/modals/panels/stats/PlayerStats";
import Plus from "@/components/modules/characters/modals/panels/plus/PlusSection";
import Spells from "@/components/modules/characters/modals/panels/spells/SpellsSection";
import ICharacter from "@/models/characters/ICharacter";

interface Props {
  player: IPlayer;
  onClose: () => void;
  updatePlayer: (player: ICharacter) => void;
  isUpdate: boolean;
}
export default function PlayerModalDetails({ player, onClose, updatePlayer, isUpdate }: Props) {
  const t = useTranslations("CharacterDetailsPanel");

  const [panel, setPanel] = useState<"characteristics" | "stats" | "spells" | "plus">("characteristics");

  const [name, setName] = useState<string>(player.name);

  const [playerCurrent, setPlayerCurrent] = useState<IPlayer>(player);

  const update = (player: ICharacter) => {
    updatePlayer(player);
    setPlayerCurrent(player as IPlayer);
  };

  const changeName = (name: string) => {
    setName(name);
    updatePlayer({
      ...player,
      name: name,
    });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <Card className="h-full w-full p-4 flex flex-col gap-2">
      <div className="flex flex-row justify-between gap-3 h-[10%]">
        <div className="flex flex-row items-center gap-2">
          <Champs
            label={t("name")}
            value={name}
            id={"name"}
            type={"text"}
            placeholder={t("name")}
            isActive={isUpdate}
            setValue={changeName}
          />
          <Badge>{t(player.kind)}</Badge>
        </div>

        <div className="flex flex-row items-center gap-3">
          <span
            className={`hover:underline underline-offset-2 cursor-pointer ${
              panel === "characteristics" && "underline"
            }`}
            onClick={() => setPanel("characteristics")}>
            {t("panels.characterisitcs")}
          </span>
          <span
            className={`hover:underline underline-offset-2 cursor-pointer ${panel === "stats" && "underline"}`}
            onClick={() => setPanel("stats")}>
            {t("panels.stats")}
          </span>
          <span
            className={`hover:underline underline-offset-2 cursor-pointer ${panel === "spells" && "underline"}`}
            onClick={() => setPanel("spells")}>
            {t("panels.spells")}
          </span>
          <span
            className={`hover:underline underline-offset-2 cursor-pointer ${panel === "plus" && "underline"}`}
            onClick={() => setPanel("plus")}>
            {t("panels.other")}
          </span>
        </div>
        <XIcon
          onClick={onClose}
          className="cursor-pointer"
        />
      </div>
      {panel === "characteristics" && (
        <Characteristic
          isUpdate={isUpdate}
          updatePlayer={update}
          player={playerCurrent}
        />
      )}
      {panel === "stats" && (
        <Stats
          isUpdate={isUpdate}
          updatePlayer={update}
          player={playerCurrent}
        />
      )}
      {panel === "spells" && (
        <Spells
          isUpdate={isUpdate}
          updateCharacter={update}
          character={playerCurrent}
        />
      )}
      {panel === "plus" && (
        <Plus
          isUpdate={isUpdate}
          updateCharacter={update}
          character={playerCurrent}
        />
      )}
    </Card>
  );
}

interface IChampsProps {
  id: string;
  type: string;
  label: string;
  placeholder: string;
  value: any | null;
  setValue: (value: any) => void;
  onChange?: () => void;
  color?: string;
  isActive?: boolean;
  width?: string;
  min?: number;
  max?: number;
}
export function Champs({
  id,
  type,
  label,
  placeholder,
  value,
  setValue,
  onChange,
  isActive,
  width,
  min,
  max,
}: IChampsProps) {
  const [pending, setPending] = useState(false);

  const handleChange = (e: any) => {
    setPending(true);
    setValue(e.target.value);
  };

  useEffect(() => {
    if (pending) {
      onChange?.();
      setPending(false);
    }
  }, [value]);

  return (
    <div className="flex flex-row items-center w-full">
      <Label
        htmlFor={id}
        className="text-foreground flex flex-row gap-1 items-center w-full">
        <span className="font-bold w-auto">{label}:</span>
        <Input
          min={min}
          max={max}
          id={id}
          type={type}
          value={value ?? ""}
          onChange={handleChange}
          placeholder={placeholder}
          className={`${
            type === "number" ? "w-10" : "w-[10vh]"
          } ${width} p-0 h-7 border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0`}
          readOnly={!isActive}
        />
      </Label>
    </div>
  );
}
