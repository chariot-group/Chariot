import { Card } from "@/components/ui/card";
import INpc from "@/models/npc/INpc";
import { useState } from "react";
import { Champs } from "@/components/modules/characters/modals/PlayerModalDetails";
import { Size, SIZES } from "@/constants/CharacterConstants";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { ALIGNMENTS } from "@/constants/CharacterConstants";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { PopoverTrigger } from "@radix-ui/react-popover";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  npc: INpc;
  isUpdate: boolean;
  updateNpc: (npc: INpc) => void;
}
export default function NpcProfileSection({ npc, isUpdate, updateNpc }: Props) {
  const t = useTranslations("CharacterDetailsPanel");

  const [type, setType] = useState<string | undefined>(npc.profile?.type);
  const [subType, setSubType] = useState<string | undefined>(npc.profile?.subtype);
  const [alignment, setAlignment] = useState<string | undefined>(npc.profile?.alignment);

  const [size, setSize] = useState<string>(npc.stats.size);

  const [challengeRating, setChallengeRating] = useState<number | undefined>(npc.challenge?.challengeRating);
  const [experiencePoints, setExperiencePoints] = useState<number | undefined>(npc.challenge?.experiencePoints);

  const changeSize = (value: Size) => {
    setSize(value);
    updateNpc({
      ...npc,
      stats: {
        ...npc.stats,
        size: value,
      },
    });
  };
  const changeType = (value: string) => {
    setType(value);
    updateNpc({
      ...npc,
      profile: {
        ...npc.profile,
        type: value,
      },
    });
  };
  const changeSubType = (value: string) => {
    setSubType(value);
    updateNpc({
      ...npc,
      profile: {
        ...npc.profile,
        subtype: value,
      },
    });
  };
  const changeAlignment = (value: string) => {
    setAlignment(value);
    updateNpc({
      ...npc,
      profile: {
        ...npc.profile,
        alignment: value,
      },
    });
  };
  const changeChallengeRating = (value: any) => {
    setChallengeRating(value);
    updateNpc({
      ...npc,
      challenge: {
        ...npc.challenge,
        challengeRating: parseInt(value),
      },
    });
  };
  const changeExperiencePoints = (value: any) => {
    setExperiencePoints(value);
    updateNpc({
      ...npc,
      challenge: {
        ...npc.challenge,
        experiencePoints: parseInt(value),
      },
    });
  };

  const [open, setOpen] = useState<boolean>(false);


  const getTranslatedAlignments = (): string[] => {
    let alignments: string[] = [];
    ALIGNMENTS.forEach((alignment) => {
      const translated = t(`profile.alignments.${alignment}`, { defaultValue: alignment });
      if (translated !== alignment) {
        alignments.push(translated);
      } else {
        alignments.push(alignment);
      }
    });
    return alignments;
  };

  return (
    <Card className="p-4 flex flex-col bg-background">
      <Champs
        label={t("profile.type")}
        value={type}
        id={"type"}
        type={"text"}
        placeholder={t("profile.type")}
        isActive={isUpdate}
        setValue={changeType}
      />
      <Champs
        label={t("profile.subtype")}
        value={subType}
        id={"subtype"}
        type={"text"}
        placeholder={t("profile.subtype")}
        isActive={isUpdate}
        setValue={changeSubType}
      />
      <div className="flex flex-row items-center w-full">
        <Label
          htmlFor={"alignment"}
          className="text-foreground flex flex-row gap-1 items-center w-full">
          <span className="font-bold w-auto">{t("profile.alignment")}:</span>
          <Popover open={open} onOpenChange={(open) => setOpen(open)}>
            <PopoverTrigger asChild className="border">
              <Button
                variant="ghost" disabled={!isUpdate}
                className="w-[10vh] p-0 pl-1 h-7 border-none shadow-none text-left items-left justify-start font-normal disabled:opacity-1"
              >
                {alignment || t("profile.alignment")}
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[150px] p-0">
              <Command>
                <CommandInput
                  placeholder={t("profile.alignment")}
                  value={alignment ?? ""}
                  onValueChange={(val) => changeAlignment(val)}
                />
                <CommandEmpty>
                  {t("profile.noMatch")}
                </CommandEmpty>
                <CommandGroup>
                  {getTranslatedAlignments().map((option) => (
                    <CommandItem
                      key={option}
                      value={option}
                      onSelect={() => {
                        changeAlignment(option)
                        setOpen(false)
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", alignment === option ? "opacity-100" : "opacity-0")} />
                      {option}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </Label>
      </div>
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label className="text-foreground flex flex-row gap-1 items-center">
          <span className="font-bold">{t("appearance.size")}:</span>
          <Select
            onValueChange={changeSize}
            defaultValue={size}>
            <SelectTrigger
              disabled={!isUpdate}
              className="p-0 h-7 border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0">
              <SelectValue placeholder={t("appearance.size")} />
            </SelectTrigger>
            <SelectContent className="border-ring">
              {SIZES.map((size) => (
                <SelectItem
                  key={size}
                  value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Label>
      </div>
      <Champs
        label={t("challenge.challengeRating")}
        min={0}
        value={challengeRating}
        id={"challengeRating"}
        type={"number"}
        placeholder={t("challenge.challengeRating")}
        isActive={isUpdate}
        setValue={changeChallengeRating}
      />
      <Champs
        label={t("challenge.experiencePoints")}
        min={0}
        value={experiencePoints}
        id={"experiencePoints"}
        type={"number"}
        placeholder={t("challenge.experiencePoints")}
        isActive={isUpdate}
        setValue={changeExperiencePoints}
      />
    </Card>
  );
}
