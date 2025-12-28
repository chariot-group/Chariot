import { Card } from "@/components/ui/card";
import { Champs } from "@/components/modules/characters/modals/PlayerModalDetails";
import { useState } from "react";
import IPlayer from "@/models/player/IPlayer";
import { useTranslations } from "next-intl";
import { getSkillsFor } from "@/constants/CharacterConstants";
import IAbilityScores from "@/models/npc/stat/sub/IAbilityScores";
import { set } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import IMasteryAbility from "@/models/player/stats/IMasteryAbility";

interface Props {
  player: IPlayer;
  isUpdate: boolean;
  updatePlayer: (player: IPlayer) => void;
}
export default function PlayerAbilityScoresSection({ player, isUpdate, updatePlayer }: Props) {
  const t = useTranslations("CharacterDetailsPanel");

  const [strengthST, setStrengthST] = useState<number>(player.stats.savingThrows.strength);
  const [dexterityST, setDexterityST] = useState<number>(player.stats.savingThrows.dexterity);
  const [constitutionST, setConstitutionST] = useState<number>(player.stats.savingThrows.constitution);
  const [intelligenceST, setIntelligenceST] = useState<number>(player.stats.savingThrows.intelligence);
  const [wisdomST, setWisdomST] = useState<number>(player.stats.savingThrows.wisdom);
  const [charismaST, setCharismaST] = useState<number>(player.stats.savingThrows.charisma);

  const [strengthAS, setStrengthAS] = useState<number>(player.stats.abilityScores.strength);
  const [dexterityAS, setDexterityAS] = useState<number>(player.stats.abilityScores.dexterity);
  const [constitutionAS, setConstitutionAS] = useState<number>(player.stats.abilityScores.constitution);
  const [intelligenceAS, setIntelligenceAS] = useState<number>(player.stats.abilityScores.intelligence);
  const [wisdomAS, setWisdomAS] = useState<number>(player.stats.abilityScores.wisdom);
  const [charismaAS, setCharismaAS] = useState<number>(player.stats.abilityScores.charisma);

  const changeAbility = (value: any, ability: keyof IAbilityScores) => {
    getSkillsFor(ability).forEach((skill) => {
      player.stats.skills[skill] = parseInt(value);
      updatePlayer({
        ...player,
        stats: {
          ...player.stats,
          skills: {
            ...player.stats.skills,
            [skill]: parseInt(value),
          },
        },
      });
    });
  }

  const calculeSavingThrow = (abilityScore: number) => {
    return Math.floor((abilityScore - 10) / 2);
  };

  const changeStrengthST = (value: any) => {
    setStrengthST(value);
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        savingThrows: {
          ...player.stats.savingThrows,
          strength: parseInt(value),
        },
      },
    });
  };
  const changeDexterityST = (value: any) => {
    setDexterityST(value);
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        savingThrows: {
          ...player.stats.savingThrows,
          dexterity: parseInt(value),
        },
      },
    });
  };
  const changeConstitutionST = (value: any) => {
    setConstitutionST(value);
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        savingThrows: {
          ...player.stats.savingThrows,
          constitution: parseInt(value),
        },
      },
    });
  };
  const changeIntelligenceST = (value: any) => {
    setIntelligenceST(value);
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        savingThrows: {
          ...player.stats.savingThrows,
          intelligence: parseInt(value),
        },
      },
    });
  };
  const changeWisdomST = (value: any) => {
    setWisdomST(value);
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        savingThrows: {
          ...player.stats.savingThrows,
          wisdom: parseInt(value),
        },
      },
    });
  };
  const changeCharismaST = (value: any) => {
    setCharismaST(value);
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        savingThrows: {
          ...player.stats.savingThrows,
          charisma: parseInt(value),
        },
      },
    });
  };
  const changeStrengthAS = (value: any) => {
    let st = calculeSavingThrow(parseInt(value));
    changeAbility(st, "strength");
    setStrengthST(st);
    setStrengthAS(value);
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        abilityScores: {
          ...player.stats.abilityScores,
          strength: parseInt(value),
        },
        savingThrows: {
          ...player.stats.savingThrows,
          strength: st,
        },
      },
    });
  };
  const changeDexterityAS = (value: any) => {
    let st = calculeSavingThrow(parseInt(value));
    changeAbility(st, "dexterity");
    setDexterityST(st);
    setDexterityAS(value);
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        abilityScores: {
          ...player.stats.abilityScores,
          dexterity: parseInt(value),
        },
        savingThrows: {
          ...player.stats.savingThrows,
          dexterity: st,
        },
      },
    });
  };
  const changeConstitutionAS = (value: any) => {
    let st = calculeSavingThrow(parseInt(value));
    changeAbility(st, "constitution");
    setConstitutionST(st);
    setConstitutionAS(value);
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        abilityScores: {
          ...player.stats.abilityScores,
          constitution: parseInt(value),
        },
        savingThrows: {
          ...player.stats.savingThrows,
          constitution: st,
        },
      },
    });
  };
  const changeIntelligenceAS = (value: any) => {
    let st = calculeSavingThrow(parseInt(value));
    changeAbility(st, "intelligence");
    setIntelligenceST(st);
    setIntelligenceAS(value);
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        abilityScores: {
          ...player.stats.abilityScores,
          intelligence: parseInt(value),
        },
        savingThrows: {
          ...player.stats.savingThrows,
          intelligence: st,
        },
      },
    });
  };
  const changeWisdomAS = (value: any) => {
    let st = calculeSavingThrow(parseInt(value));
    changeAbility(st, "wisdom");
    setWisdomST(st);
    setWisdomAS(value);
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        abilityScores: {
          ...player.stats.abilityScores,
          wisdom: parseInt(value),
        },
        savingThrows: {
          ...player.stats.savingThrows,
          wisdom: st,
        },
      },
    });
  };
  const changeCharismaAS = (value: any) => {
    let st = calculeSavingThrow(parseInt(value));
    changeAbility(st, "charisma");
    setCharismaST(st);
    setCharismaAS(value);
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        abilityScores: {
          ...player.stats.abilityScores,
          charisma: parseInt(value),
        },
        savingThrows: {
          ...player.stats.savingThrows,
          charisma: st,
        },
      },
    });
  };

  const updateMasteryAbility = (ability: keyof IMasteryAbility, value: boolean) => {

    const currentAbilities: IMasteryAbility = player.stats.masteriesAbility;

    const trueCount: number = Object.values(currentAbilities).filter(v => v).length;

    if (value === true && trueCount >= 2 && !currentAbilities[ability]) {
      return;
    }

    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        masteriesAbility: {
          ...player.stats.masteriesAbility,
          [ability]: value,
        },
      },
    });
  }

  return (
    <div className="flex flex-col gap-3 w-1/6 h-full">
      {/* Stats */}
      <Card className="p-4 flex flex-col bg-background">
        <div className="flex items-center justify-between gap-2">
          <Checkbox
            disabled={!isUpdate}
            id="mastery-strength"
            checked={player.stats.masteriesAbility.strength}
            onCheckedChange={(value: boolean) => updateMasteryAbility("strength", value)}
          />
          <Champs
            isActive={isUpdate}
            color="card"
            label={t("abilityScores.strength")}
            value={strengthAS}
            id={"strengthAS"}
            type={"number"}
            placeholder={t("abilityScores.strength")}
            setValue={changeStrengthAS}
          />
          {
            player.stats.masteriesAbility.strength &&
            <span className="text-xs text-muted-foreground">
              ({player.stats.abilityScores.strength + player.stats.proficiencyBonus})
            </span>
          }
        </div>
        <div className="flex items-center justify-between gap-2">
          <Champs
            isActive={isUpdate}
            color="card"
            label={t("abilityScores.save")}
            value={strengthST}
            id={"strengthST"}
            type={"number"}
            placeholder={t("abilityScores.save")}
            setValue={changeStrengthST}
          />
          {
            player.stats.masteriesAbility.strength &&
            <span className="text-xs text-muted-foreground">
              ({calculeSavingThrow(player.stats.abilityScores.strength + player.stats.proficiencyBonus)})
            </span>
          }
        </div>
      </Card >
      <Card className="p-4 flex flex-col bg-background">
        <div className="flex items-center justify-between gap-2">
          <Checkbox
            disabled={!isUpdate}
            id="mastery-strength"
            checked={player.stats.masteriesAbility.dexterity}
            onCheckedChange={(value: boolean) => updateMasteryAbility("dexterity", value)}
          />
          <Champs
            isActive={isUpdate}
            color="card"
            label={t("abilityScores.dexterity")}
            value={dexterityAS}
            id={"dexterityAS"}
            type={"number"}
            placeholder={t("abilityScores.dexterity")}
            setValue={changeDexterityAS}
          />
          {
            player.stats.masteriesAbility.dexterity &&
            <span className="text-xs text-muted-foreground">
              ({player.stats.abilityScores.dexterity + player.stats.proficiencyBonus})
            </span>
          }
        </div>
        <div className="flex items-center justify-between gap-2">
          <Champs
            isActive={isUpdate}
            color="card"
            label={t("abilityScores.save")}
            value={dexterityST}
            id={"dexterityST"}
            type={"number"}
            placeholder={t("abilityScores.save")}
            setValue={changeDexterityST}
          />
          {
            player.stats.masteriesAbility.dexterity &&
            <span className="text-xs text-muted-foreground">
              ({calculeSavingThrow(player.stats.abilityScores.dexterity + player.stats.proficiencyBonus)})
            </span>
          }
        </div>
      </Card>
      <Card className="p-4 flex flex-col bg-background">
        <div className="flex items-center justify-between gap-2">
          <Checkbox
            disabled={!isUpdate}
            id="mastery-strength"
            checked={player.stats.masteriesAbility.constitution}
            onCheckedChange={(value: boolean) => updateMasteryAbility("constitution", value)}
          />
          <Champs
            isActive={isUpdate}
            color="card"
            label={t("abilityScores.constitution")}
            value={constitutionAS}
            id={"constitutionAS"}
            type={"number"}
            placeholder={t("abilityScores.constitution")}
            setValue={changeConstitutionAS}
          />
          {
            player.stats.masteriesAbility.constitution &&
            <span className="text-xs text-muted-foreground">
              ({player.stats.abilityScores.constitution + player.stats.proficiencyBonus})
            </span>
          }
        </div>
        <div className="flex items-center justify-between gap-2">
          <Champs
            isActive={isUpdate}
            color="card"
            label={t("abilityScores.save")}
            value={constitutionST}
            id={"constitutionST"}
            type={"number"}
            placeholder={t("abilityScores.save")}
            setValue={changeConstitutionST}
          />
          {
            player.stats.masteriesAbility.constitution &&
            <span className="text-xs text-muted-foreground">
              ({calculeSavingThrow(player.stats.abilityScores.constitution + player.stats.proficiencyBonus)})
            </span>
          }
        </div>
      </Card>
      <Card className="p-4 flex flex-col bg-background">
        <div className="flex items-center justify-between gap-2">
          <Checkbox
            disabled={!isUpdate}
            id="mastery-strength"
            checked={player.stats.masteriesAbility.intelligence}
            onCheckedChange={(value: boolean) => updateMasteryAbility("intelligence", value)}
          />
          <Champs
            isActive={isUpdate}
            color="card"
            label={t("abilityScores.intelligence")}
            value={intelligenceAS}
            id={"intelligenceAS"}
            type={"number"}
            placeholder={t("abilityScores.intelligence")}
            setValue={changeIntelligenceAS}
          />
          {
            player.stats.masteriesAbility.intelligence &&
            <span className="text-xs text-muted-foreground">
              ({player.stats.abilityScores.intelligence + player.stats.proficiencyBonus})
            </span>
          }
        </div>
        <div className="flex items-center justify-between gap-2">
          <Champs
            isActive={isUpdate}
            color="card"
            label={t("abilityScores.save")}
            value={intelligenceST}
            id={"intelligenceST"}
            type={"number"}
            placeholder={t("abilityScores.save")}
            setValue={changeIntelligenceST}
          />
          {
            player.stats.masteriesAbility.intelligence &&
            <span className="text-xs text-muted-foreground">
              ({calculeSavingThrow(player.stats.abilityScores.intelligence + player.stats.proficiencyBonus)})
            </span>
          }
        </div>
      </Card>
      <Card className="p-4 flex flex-col bg-background">
        <div className="flex items-center justify-between gap-2">
          <Checkbox
            disabled={!isUpdate}
            id="mastery-strength"
            checked={player.stats.masteriesAbility.wisdom}
            onCheckedChange={(value: boolean) => updateMasteryAbility("wisdom", value)}
          />
          <Champs
            isActive={isUpdate}
            color="card"
            label={t("abilityScores.wisdom")}
            value={wisdomAS}
            id={"wisdomAS"}
            type={"number"}
            placeholder={t("abilityScores.wisdom")}
            setValue={changeWisdomAS}
          />
          {
            player.stats.masteriesAbility.wisdom &&
            <span className="text-xs text-muted-foreground">
              ({player.stats.abilityScores.wisdom + player.stats.proficiencyBonus})
            </span>
          }
        </div>
        <div className="flex items-center justify-between gap-2">
          <Champs
            isActive={isUpdate}
            color="card"
            label={t("abilityScores.save")}
            value={wisdomST}
            id={"wisdomST"}
            type={"number"}
            placeholder={t("abilityScores.save")}
            setValue={changeWisdomST}
          />
          {
            player.stats.masteriesAbility.wisdom &&
            <span className="text-xs text-muted-foreground">
              ({calculeSavingThrow(player.stats.abilityScores.wisdom + player.stats.proficiencyBonus)})
            </span>
          }
        </div>
      </Card>
      <Card className="p-4 flex flex-col bg-background">
        <div className="flex items-center justify-between gap-2">
          <Checkbox
            disabled={!isUpdate}
            id="mastery-strength"
            checked={player.stats.masteriesAbility.charisma}
            onCheckedChange={(value: boolean) => updateMasteryAbility("charisma", value)}
          />
          <Champs
            isActive={isUpdate}
            color="card"
            label={t("abilityScores.charisma")}
            value={charismaAS}
            id={"charismaAS"}
            type={"number"}
            placeholder={t("abilityScores.charisma")}
            setValue={changeCharismaAS}
          />
          {
            player.stats.masteriesAbility.charisma &&
            <span className="text-xs text-muted-foreground">
              ({player.stats.abilityScores.charisma + player.stats.proficiencyBonus})
            </span>
          }
        </div>
        <div className="flex items-center justify-between gap-2">
          <Champs
            isActive={isUpdate}
            color="card"
            label={t("abilityScores.save")}
            value={charismaST}
            id={"charismaST"}
            type={"number"}
            placeholder={t("abilityScores.save")}
            setValue={changeCharismaST}
          />
          {
            player.stats.masteriesAbility.charisma &&
            <span className="text-xs text-muted-foreground">
              ({calculeSavingThrow(player.stats.abilityScores.charisma + player.stats.proficiencyBonus)})
            </span>
          }
        </div>
      </Card>
    </div >
  );
}
