import { Card } from "@/components/ui/card";
import { useState } from "react";
import { Champs } from "@/components/modules/characters/modals/PlayerModalDetails";
import INpc from "@/models/npc/INpc";
import { useTranslations } from "next-intl";

interface Props {
  npc: INpc;
  isUpdate: boolean;
  updateNpc: (npc: INpc) => void;
}
export default function NpcSkillsSection({ npc, isUpdate, updateNpc }: Props) {
  const t = useTranslations("CharacterDetailsPanel");

  const [athletics, setAthletics] = useState<number>(npc.stats.skills.athletics);
  const [acrobatics, setAcrobatics] = useState<number>(npc.stats.skills.acrobatics);
  const [sleightHand, setSleightHand] = useState<number>(npc.stats.skills.sleightHand);
  const [stealth, setStealth] = useState<number>(npc.stats.skills.stealth);
  const [arcana, setArcana] = useState<number>(npc.stats.skills.arcana);
  const [history, setHistory] = useState<number>(npc.stats.skills.history);
  const [investigation, setInvestigation] = useState<number>(npc.stats.skills.investigation);
  const [nature, setNature] = useState<number>(npc.stats.skills.nature);
  const [religion, setReligion] = useState<number>(npc.stats.skills.religion);
  const [animalHandling, setAnimalHandling] = useState<number>(npc.stats.skills.animalHandling);
  const [insight, setInsight] = useState<number>(npc.stats.skills.insight);
  const [medicine, setMedicine] = useState<number>(npc.stats.skills.medicine);
  const [perception, setPerception] = useState<number>(npc.stats.skills.perception);
  const [survival, setSurvival] = useState<number>(npc.stats.skills.survival);
  const [deception, setDeception] = useState<number>(npc.stats.skills.deception);
  const [intimidation, setIntimidation] = useState<number>(npc.stats.skills.intimidation);
  const [performance, setPerformance] = useState<number>(npc.stats.skills.performance);
  const [persuasion, setPersuasion] = useState<number>(npc.stats.skills.persuasion);

  const changeAthletics = (value: any) => {
    setAthletics(value);
    updateNpc({
      ...npc,
      stats: {
        ...npc.stats,
        skills: {
          ...npc.stats.skills,
          athletics: parseInt(value),
        },
      },
    });
  };
  const changeAcrobatics = (value: any) => {
    setAcrobatics(value);
    updateNpc({
      ...npc,
      stats: {
        ...npc.stats,
        skills: {
          ...npc.stats.skills,
          acrobatics: parseInt(value),
        },
      },
    });
  };
  const changeSleightHand = (value: any) => {
    setSleightHand(value);
    updateNpc({
      ...npc,
      stats: {
        ...npc.stats,
        skills: {
          ...npc.stats.skills,
          sleightHand: parseInt(value),
        },
      },
    });
  };
  const changeStealth = (value: any) => {
    setStealth(value);
    updateNpc({
      ...npc,
      stats: {
        ...npc.stats,
        skills: {
          ...npc.stats.skills,
          stealth: parseInt(value),
        },
      },
    });
  };
  const changeArcana = (value: any) => {
    setArcana(value);
    updateNpc({
      ...npc,
      stats: {
        ...npc.stats,
        skills: {
          ...npc.stats.skills,
          arcana: parseInt(value),
        },
      },
    });
  };
  const changeHistory = (value: any) => {
    setHistory(value);
    updateNpc({
      ...npc,
      stats: {
        ...npc.stats,
        skills: {
          ...npc.stats.skills,
          history: parseInt(value),
        },
      },
    });
  };
  const changeInvestigation = (value: any) => {
    setInvestigation(value);
    updateNpc({
      ...npc,
      stats: {
        ...npc.stats,
        skills: {
          ...npc.stats.skills,
          investigation: parseInt(value),
        },
      },
    });
  };
  const changeNature = (value: any) => {
    setNature(value);
    updateNpc({
      ...npc,
      stats: {
        ...npc.stats,
        skills: {
          ...npc.stats.skills,
          nature: parseInt(value),
        },
      },
    });
  };
  const changeReligion = (value: any) => {
    setReligion(value);
    updateNpc({
      ...npc,
      stats: {
        ...npc.stats,
        skills: {
          ...npc.stats.skills,
          religion: parseInt(value),
        },
      },
    });
  };
  const changeAnimalHandling = (value: any) => {
    setAnimalHandling(value);
    updateNpc({
      ...npc,
      stats: {
        ...npc.stats,
        skills: {
          ...npc.stats.skills,
          animalHandling: parseInt(value),
        },
      },
    });
  };
  const changeInsight = (value: any) => {
    setInsight(value);
    updateNpc({
      ...npc,
      stats: {
        ...npc.stats,
        skills: {
          ...npc.stats.skills,
          insight: parseInt(value),
        },
      },
    });
  };
  const changeMedicine = (value: any) => {
    setMedicine(value);
    updateNpc({
      ...npc,
      stats: {
        ...npc.stats,
        skills: {
          ...npc.stats.skills,
          medicine: parseInt(value),
        },
      },
    });
  };
  const changePerception = (value: any) => {
    setPerception(value);
    updateNpc({
      ...npc,
      stats: {
        ...npc.stats,
        skills: {
          ...npc.stats.skills,
          perception: parseInt(value),
        },
      },
    });
  };
  const changeSurvival = (value: any) => {
    setSurvival(value);
    updateNpc({
      ...npc,
      stats: {
        ...npc.stats,
        skills: {
          ...npc.stats.skills,
          survival: parseInt(value),
        },
      },
    });
  };
  const changeDeception = (value: any) => {
    setDeception(value);
    updateNpc({
      ...npc,
      stats: {
        ...npc.stats,
        skills: {
          ...npc.stats.skills,
          deception: parseInt(value),
        },
      },
    });
  };
  const changeIntimidation = (value: any) => {
    setIntimidation(value);
    updateNpc({
      ...npc,
      stats: {
        ...npc.stats,
        skills: {
          ...npc.stats.skills,
          intimidation: parseInt(value),
        },
      },
    });
  };
  const changePerformance = (value: any) => {
    setPerformance(value);
    updateNpc({
      ...npc,
      stats: {
        ...npc.stats,
        skills: {
          ...npc.stats.skills,
          performance: parseInt(value),
        },
      },
    });
  };
  const changePersuasion = (value: any) => {
    setPersuasion(value);
    updateNpc({
      ...npc,
      stats: {
        ...npc.stats,
        skills: {
          ...npc.stats.skills,
          persuasion: parseInt(value),
        },
      },
    });
  };

  return (
    <Card className="p-4 flex flex-col bg-background">
      <Champs
        isActive={isUpdate}
        color="card"
        label={t("skills.athletics")}
        value={athletics}
        id={"athletics"}
        type={"number"}
        placeholder={t("skills.athletics")}
        setValue={changeAthletics}
      />
      <Champs
        isActive={isUpdate}
        color="card"
        label={t("skills.acrobatics")}
        value={acrobatics}
        id={"acrobatics"}
        type={"number"}
        placeholder={t("skills.acrobatics")}
        setValue={changeAcrobatics}
      />
      <Champs
        isActive={isUpdate}
        color="card"
        label={t("skills.stealth")}
        value={stealth}
        id={"stealth"}
        type={"number"}
        placeholder={t("skills.stealth")}
        setValue={changeStealth}
      />
      <Champs
        isActive={isUpdate}
        color="card"
        label={t("skills.sleightHand")}
        value={sleightHand}
        id={"sleightHand"}
        type={"number"}
        placeholder={t("skills.sleightHand")}
        setValue={changeSleightHand}
      />
      <Champs
        isActive={isUpdate}
        color="card"
        label={t("skills.arcana")}
        value={arcana}
        id={"arcana"}
        type={"number"}
        placeholder={t("skills.arcana")}
        setValue={changeArcana}
      />
      <Champs
        isActive={isUpdate}
        color="card"
        label={t("skills.history")}
        value={history}
        id={"history"}
        type={"number"}
        placeholder={t("skills.history")}
        setValue={changeHistory}
      />
      <Champs
        isActive={isUpdate}
        color="card"
        label={t("skills.investigation")}
        value={investigation}
        id={"investigation"}
        type={"number"}
        placeholder={t("skills.investigation")}
        setValue={changeInvestigation}
      />
      <Champs
        isActive={isUpdate}
        color="card"
        label={t("skills.nature")}
        value={nature}
        id={"nature"}
        type={"number"}
        placeholder={t("skills.nature")}
        setValue={changeNature}
      />
      <Champs
        isActive={isUpdate}
        color="card"
        label={t("skills.religion")}
        value={religion}
        id={"religion"}
        type={"number"}
        placeholder={t("skills.religion")}
        setValue={changeReligion}
      />
      <Champs
        isActive={isUpdate}
        color="card"
        label={t("skills.animalHandling")}
        value={animalHandling}
        id={"animalHandling"}
        type={"number"}
        placeholder={t("skills.animalHandling")}
        setValue={changeAnimalHandling}
      />
      <Champs
        isActive={isUpdate}
        color="card"
        label={t("skills.insight")}
        value={insight}
        id={"insight"}
        type={"number"}
        placeholder={t("skills.insight")}
        setValue={changeInsight}
      />
      <Champs
        isActive={isUpdate}
        color="card"
        label={t("skills.medicine")}
        value={medicine}
        id={"medicine"}
        type={"number"}
        placeholder={t("skills.medicine")}
        setValue={changeMedicine}
      />
      <Champs
        isActive={isUpdate}
        color="card"
        label={t("skills.perception")}
        value={perception}
        id={"perception"}
        type={"number"}
        placeholder={t("skills.perception")}
        setValue={changePerception}
      />
      <Champs
        isActive={isUpdate}
        color="card"
        label={t("skills.survival")}
        value={survival}
        id={"survival"}
        type={"number"}
        placeholder={t("skills.survival")}
        setValue={changeSurvival}
      />
      <Champs
        isActive={isUpdate}
        color="card"
        label={t("skills.deception")}
        value={deception}
        id={"deception"}
        type={"number"}
        placeholder={t("skills.deception")}
        setValue={changeDeception}
      />
      <Champs
        isActive={isUpdate}
        color="card"
        label={t("skills.intimidation")}
        value={intimidation}
        id={"intimidation"}
        type={"number"}
        placeholder={t("skills.intimidation")}
        setValue={changeIntimidation}
      />
      <Champs
        isActive={isUpdate}
        color="card"
        label={t("skills.performance")}
        value={performance}
        id={"performance"}
        type={"number"}
        placeholder={t("skills.performance")}
        setValue={changePerformance}
      />
      <Champs
        isActive={isUpdate}
        color="card"
        label={t("skills.persuasion")}
        value={persuasion}
        id={"persuasion"}
        type={"number"}
        placeholder={t("skills.persuasion")}
        setValue={changePersuasion}
      />
    </Card>
  );
}
