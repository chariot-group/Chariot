import { Card } from "@/components/ui/card";
import { Champs } from "@/components/modules/characters/modals/PlayerModalDetails";
import { useState } from "react";
import INpc from "@/models/npc/INpc";
import { useTranslations } from "next-intl";
import { getSkillsFor } from "@/constants/CharacterConstants";
import IAbilityScores from "@/models/npc/stat/sub/IAbilityScores";

interface Props {
  npc: INpc;
  isUpdate: boolean;
  updateNpc: (npc: INpc) => void;
}
export default function NpcAbilityScoresSection({ npc, isUpdate, updateNpc }: Props) {
  const t = useTranslations("CharacterDetailsPanel");

  const [strengthST, setStrengthST] = useState<number>(npc.stats.savingThrows.strength);
  const [dexterityST, setDexterityST] = useState<number>(npc.stats.savingThrows.dexterity);
  const [constitutionST, setConstitutionST] = useState<number>(npc.stats.savingThrows.constitution);
  const [intelligenceST, setIntelligenceST] = useState<number>(npc.stats.savingThrows.intelligence);
  const [wisdomST, setWisdomST] = useState<number>(npc.stats.savingThrows.wisdom);
  const [charismaST, setCharismaST] = useState<number>(npc.stats.savingThrows.charisma);

  const [strengthAS, setStrengthAS] = useState<number>(npc.stats.abilityScores.strength);
  const [dexterityAS, setDexterityAS] = useState<number>(npc.stats.abilityScores.dexterity);
  const [constitutionAS, setConstitutionAS] = useState<number>(npc.stats.abilityScores.constitution);
  const [intelligenceAS, setIntelligenceAS] = useState<number>(npc.stats.abilityScores.intelligence);
  const [wisdomAS, setWisdomAS] = useState<number>(npc.stats.abilityScores.wisdom);
  const [charismaAS, setCharismaAS] = useState<number>(npc.stats.abilityScores.charisma);

  const changeAbility = (oldValue: any, value: any, ability: keyof IAbilityScores) => {
    getSkillsFor(ability).forEach((skill) => {
      const skillValue = npc.stats.skills[skill];
      if (skillValue == oldValue) {
        npc.stats.skills[skill] = parseInt(value);
        updateNpc({
          ...npc,
          stats: {
            ...npc.stats,
            skills: {
              ...npc.stats.skills,
              [skill]: parseInt(value),
            },
          },
        });
      }
    });
  }

  const calculeSavingThrow = (abilityScore: number, setter: (n: number) => void) => {
    return setter(Math.floor((abilityScore - 10) / 2));
  };

  const changeStrengthST = (value: any) => {
    setStrengthST(value);
    updateNpc({
      ...npc,
      stats: {
        ...npc.stats,
        savingThrows: {
          ...npc.stats.savingThrows,
          strength: parseInt(value),
        },
      },
    });
  };
  const changeDexterityST = (value: any) => {
    setDexterityST(value);
    updateNpc({
      ...npc,
      stats: {
        ...npc.stats,
        savingThrows: {
          ...npc.stats.savingThrows,
          dexterity: parseInt(value),
        },
      },
    });
  };
  const changeConstitutionST = (value: any) => {
    setConstitutionST(value);
    updateNpc({
      ...npc,
      stats: {
        ...npc.stats,
        savingThrows: {
          ...npc.stats.savingThrows,
          constitution: parseInt(value),
        },
      },
    });
  };
  const changeIntelligenceST = (value: any) => {
    setIntelligenceST(value);
    updateNpc({
      ...npc,
      stats: {
        ...npc.stats,
        savingThrows: {
          ...npc.stats.savingThrows,
          intelligence: parseInt(value),
        },
      },
    });
  };
  const changeWisdomST = (value: any) => {
    setWisdomST(value);
    updateNpc({
      ...npc,
      stats: {
        ...npc.stats,
        savingThrows: {
          ...npc.stats.savingThrows,
          wisdom: parseInt(value),
        },
      },
    });
  };
  const changeCharismaST = (value: any) => {
    setCharismaST(value);
    updateNpc({
      ...npc,
      stats: {
        ...npc.stats,
        savingThrows: {
          ...npc.stats.savingThrows,
          charisma: parseInt(value),
        },
      },
    });
  };
  const changeStrengthAS = (value: any) => {
    changeAbility(strengthAS, value, "strength");
    calculeSavingThrow(parseInt(value), changeStrengthST);
    setStrengthAS(value);
    updateNpc({
      ...npc,
      stats: {
        ...npc.stats,
        abilityScores: {
          ...npc.stats.abilityScores,
          strength: parseInt(value),
        },
      },
    });
  };
  const changeDexterityAS = (value: any) => {
    changeAbility(dexterityAS, value, "dexterity");
    calculeSavingThrow(parseInt(value), changeDexterityST);
    setDexterityAS(value);
    updateNpc({
      ...npc,
      stats: {
        ...npc.stats,
        abilityScores: {
          ...npc.stats.abilityScores,
          dexterity: parseInt(value),
        },
      },
    });
  };
  const changeConstitutionAS = (value: any) => {
    changeAbility(constitutionAS, value, "constitution");
    calculeSavingThrow(parseInt(value), changeConstitutionST);
    setConstitutionAS(value);
    updateNpc({
      ...npc,
      stats: {
        ...npc.stats,
        abilityScores: {
          ...npc.stats.abilityScores,
          constitution: parseInt(value),
        },
      },
    });
  };
  const changeIntelligenceAS = (value: any) => {
    changeAbility(intelligenceAS, value, "intelligence");
    calculeSavingThrow(parseInt(value), changeIntelligenceST);
    setIntelligenceAS(value);
    updateNpc({
      ...npc,
      stats: {
        ...npc.stats,
        abilityScores: {
          ...npc.stats.abilityScores,
          intelligence: parseInt(value),
        },
      },
    });
  };
  const changeWisdomAS = (value: any) => {
    changeAbility(wisdomAS, value, "wisdom");
    calculeSavingThrow(parseInt(value), changeWisdomST);
    setWisdomAS(value);
    updateNpc({
      ...npc,
      stats: {
        ...npc.stats,
        abilityScores: {
          ...npc.stats.abilityScores,
          wisdom: parseInt(value),
        },
      },
    });
  };
  const changeCharismaAS = (value: any) => {
    changeAbility(charismaAS, value, "charisma");
    calculeSavingThrow(parseInt(value), changeCharismaST);
    setCharismaAS(value);
    updateNpc({
      ...npc,
      stats: {
        ...npc.stats,
        abilityScores: {
          ...npc.stats.abilityScores,
          charisma: parseInt(value),
        },
      },
    });
  };

  return (
    <div className="flex flex-col gap-3 w-1/6 h-full">
      {/* Stats */}
      <Card className="p-4 flex flex-col bg-background">
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
      </Card>
      <Card className="p-4 flex flex-col bg-background">
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
      </Card>
      <Card className="p-4 flex flex-col bg-background">
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
      </Card>
      <Card className="p-4 flex flex-col bg-background">
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
      </Card>
      <Card className="p-4 flex flex-col bg-background">
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
      </Card>
      <Card className="p-4 flex flex-col bg-background">
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
      </Card>
    </div>
  );
}
