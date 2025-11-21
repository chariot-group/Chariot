import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { IParticipant } from "@/models/participant/IParticipant";
import { Heart, Shield, Sword } from "lucide-react";
import React, { useEffect, useState } from "react";
import CharacterModal from "@/components/modules/characters/CharacterModal";
import { useTranslations } from "next-intl";
import CharacterService from "@/services/CharacterService";
import InitiativeDamagePopover from "@/components/modules/battle/InitiativeDamagePopover";

interface Props {
  participant: IParticipant;
  setParticipant: (participant: IParticipant) => void;
  handleInitiativeChange: (participant: IParticipant) => void;
  isCurrent?: boolean;
}

const InitiativeItem = ({ participant, setParticipant, handleInitiativeChange, isCurrent }: Props) => {
  const t = useTranslations("InitiativeItem");

  const [localInitiative, setLocalInitiative] = useState<string>("");
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    setLocalInitiative(participant.initiative?.toString() ?? "");
  }, [participant.initiative]);

  const onInitiativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!/^\d*$/.test(value) || value.length > 4) return;
    setLocalInitiative(value);
  };

  const onInitiativeBlur = () => {
    const parsed = Number(localInitiative);
    if (localInitiative === "") {
      handleInitiativeChange({ ...participant, initiative: 0 });
      setLocalInitiative("0");
    } else if (!isNaN(parsed)) {
      handleInitiativeChange({ ...participant, initiative: parsed });
    }
  };

  const onInitiativeFocus = () => {
    setLocalInitiative((participant.initiative ?? 0) === 0 ? "" : (participant.initiative ?? 0).toString());
  };

  const onHPChange = async (value: string) => {
    if (!/^\d*$/.test(value) || value.length > 4) return;
    setParticipant({
      ...participant,
      character: {
        ...participant.character,
        stats: {
          ...participant.character.stats,
          currentHitPoints: Number(value),
        },
      },
    });
    await CharacterService.updateCharacter(participant.character._id, {
      ...participant.character,
      stats: {
        ...participant.character.stats,
        currentHitPoints: Number(value),
      },
    });
  };

  return (
    <TableRow
      className={`text-xl ${participant.character.stats.currentHitPoints <= 0 && "hover:bg-destructive/30 bg-destructive/20"
        } ${isCurrent && "bg-secondary/20 hover:bg-secondary/30"}`}>
      <TableCell>
        <div className="relative flex items-center">
          <Input
            className="w-20 bg-card  md:text-xl font-semibold"
            value={localInitiative}
            onChange={onInitiativeChange}
            onBlur={onInitiativeBlur}
            onFocus={onInitiativeFocus}
          />
          <Sword className="absolute left-12" />
        </div>
      </TableCell>
      <TableCell>{participant.character.name}</TableCell>
      <TableCell>
        <Popover>
          <div className="relative flex items-center gap-1">
            <PopoverTrigger asChild>
              <Input
                className="w-24 bg-card md:text-xl font-semibold"
                value={participant.character.stats.currentHitPoints}
              />
            </PopoverTrigger>
            <Heart className="absolute left-16" />
          </div>
          <PopoverContent className="w-52 p-2 space-y-2">
            <InitiativeDamagePopover
              onMinusClicked={(value: number) => {
                const newHP = Math.max(0, participant.character.stats.currentHitPoints - value);
                onHPChange(newHP.toString());
              }}
              onPlusClicked={(value: number) => {
                const newHP = participant.character.stats.currentHitPoints + value;
                onHPChange(newHP.toString());
              }}
            />
          </PopoverContent>
        </Popover>
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className="text-xl bg-card w-20 flex justify-between">
          {participant.character.stats.armorClass}
          <Shield />
        </Badge>
      </TableCell>
      <TableCell>{participant.groupLabel}</TableCell>
      <TableCell>
        <Button
          variant="secondary"
          className="bg-secondary/80 hover:bg-secondary/60"
          onClick={() => setShowDetails(true)}>
          {t("detail")}
        </Button>
        <CharacterModal
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
          character={participant.character}
          isUpdating={false}
        />
      </TableCell>
    </TableRow>
  );
};

export default InitiativeItem;
