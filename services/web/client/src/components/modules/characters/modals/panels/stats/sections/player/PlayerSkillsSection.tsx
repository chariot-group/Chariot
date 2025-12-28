import { Card } from "@/components/ui/card";
import { useState } from "react";
import IPlayer from "@/models/player/IPlayer";
import { Champs } from "@/components/modules/characters/modals/PlayerModalDetails";
import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  player: IPlayer;
  isUpdate: boolean;
  updatePlayer: (player: IPlayer) => void;
}
export default function PlayerSkillsSection({ player, isUpdate, updatePlayer }: Props) {
  const t = useTranslations("CharacterDetailsPanel");

  const [athletics, setAthletics] = useState<number>(player.stats.skills.athletics);
  const [acrobatics, setAcrobatics] = useState<number>(player.stats.skills.acrobatics);
  const [sleightHand, setSleightHand] = useState<number>(player.stats.skills.sleightHand);
  const [stealth, setStealth] = useState<number>(player.stats.skills.stealth);
  const [arcana, setArcana] = useState<number>(player.stats.skills.arcana);
  const [history, setHistory] = useState<number>(player.stats.skills.history);
  const [investigation, setInvestigation] = useState<number>(player.stats.skills.investigation);
  const [nature, setNature] = useState<number>(player.stats.skills.nature);
  const [religion, setReligion] = useState<number>(player.stats.skills.religion);
  const [animalHandling, setAnimalHandling] = useState<number>(player.stats.skills.animalHandling);
  const [insight, setInsight] = useState<number>(player.stats.skills.insight);
  const [medicine, setMedicine] = useState<number>(player.stats.skills.medicine);
  const [perception, setPerception] = useState<number>(player.stats.skills.perception);
  const [survival, setSurvival] = useState<number>(player.stats.skills.survival);
  const [deception, setDeception] = useState<number>(player.stats.skills.deception);
  const [intimidation, setIntimidation] = useState<number>(player.stats.skills.intimidation);
  const [performance, setPerformance] = useState<number>(player.stats.skills.performance);
  const [persuasion, setPersuasion] = useState<number>(player.stats.skills.persuasion);

  const changeAthletics = (value: any) => {
    setAthletics(value);
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        skills: {
          ...player.stats.skills,
          athletics: parseInt(value),
        },
      },
    });
  };
  const changeAcrobatics = (value: any) => {
    setAcrobatics(value);
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        skills: {
          ...player.stats.skills,
          acrobatics: parseInt(value),
        },
      },
    });
  };
  const changeSleightHand = (value: any) => {
    setSleightHand(value);
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        skills: {
          ...player.stats.skills,
          sleightHand: parseInt(value),
        },
      },
    });
  };
  const changeStealth = (value: any) => {
    setStealth(value);
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        skills: {
          ...player.stats.skills,
          stealth: parseInt(value),
        },
      },
    });
  };
  const changeArcana = (value: any) => {
    setArcana(value);
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        skills: {
          ...player.stats.skills,
          arcana: parseInt(value),
        },
      },
    });
  };
  const changeHistory = (value: any) => {
    setHistory(value);
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        skills: {
          ...player.stats.skills,
          history: parseInt(value),
        },
      },
    });
  };
  const changeInvestigation = (value: any) => {
    setInvestigation(value);
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        skills: {
          ...player.stats.skills,
          investigation: parseInt(value),
        },
      },
    });
  };
  const changeNature = (value: any) => {
    setNature(value);
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        skills: {
          ...player.stats.skills,
          nature: parseInt(value),
        },
      },
    });
  };
  const changeReligion = (value: any) => {
    setReligion(value);
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        skills: {
          ...player.stats.skills,
          religion: parseInt(value),
        },
      },
    });
  };
  const changeAnimalHandling = (value: any) => {
    setAnimalHandling(value);
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        skills: {
          ...player.stats.skills,
          animalHandling: parseInt(value),
        },
      },
    });
  };
  const changeInsight = (value: any) => {
    setInsight(value);
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        skills: {
          ...player.stats.skills,
          insight: parseInt(value),
        },
      },
    });
  };
  const changeMedicine = (value: any) => {
    setMedicine(value);
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        skills: {
          ...player.stats.skills,
          medicine: parseInt(value),
        },
      },
    });
  };
  const changePerception = (value: any) => {
    setPerception(value);
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        skills: {
          ...player.stats.skills,
          perception: parseInt(value),
        },
      },
    });
  };
  const changeSurvival = (value: any) => {
    setSurvival(value);
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        skills: {
          ...player.stats.skills,
          survival: parseInt(value),
        },
      },
    });
  };
  const changeDeception = (value: any) => {
    setDeception(value);
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        skills: {
          ...player.stats.skills,
          deception: parseInt(value),
        },
      },
    });
  };
  const changeIntimidation = (value: any) => {
    setIntimidation(value);
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        skills: {
          ...player.stats.skills,
          intimidation: parseInt(value),
        },
      },
    });
  };
  const changePerformance = (value: any) => {
    setPerformance(value);
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        skills: {
          ...player.stats.skills,
          performance: parseInt(value),
        },
      },
    });
  };
  const changePersuasion = (value: any) => {
    setPersuasion(value);
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        skills: {
          ...player.stats.skills,
          persuasion: parseInt(value),
        },
      },
    });
  };

  const updateMastery = (skill: string, value: boolean) => {
    updatePlayer({
      ...player,
      stats: {
        ...player.stats,
        masteries: {
          ...player.stats.masteries,
          [skill]: value,
        },
      },
    });
  }

  const calculateBonus = (skill: number) => {
    return skill + player.stats.proficiencyBonus;
  };

  return (
    <Card className="p-4 flex flex-col bg-background">
      <div className="flex items-center justify-between gap-2">
        <Checkbox
          disabled={!isUpdate}
          id="mastery-athletics"
          checked={player.stats.masteries.athletics}
          onCheckedChange={(value: boolean) => updateMastery("athletics", value)}
        />
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
        {
          player.stats.masteries.athletics && (
            <span className="text-xs text-muted-foreground">
              ({calculateBonus(player.stats.skills.athletics)})
            </span>
          )
        }
      </div>
      <div className="flex items-center justify-between gap-2">
        <Checkbox
          disabled={!isUpdate}
          id="mastery-acrobatics"
          checked={player.stats.masteries.acrobatics}
          onCheckedChange={(value: boolean) => updateMastery("acrobatics", value)}
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
        {
          player.stats.masteries.acrobatics && (
            <span className="text-xs text-muted-foreground">
              ({calculateBonus(player.stats.skills.acrobatics)})
            </span>
          )
        }
      </div>
      <div className="flex items-center justify-between gap-2">
        <Checkbox
          disabled={!isUpdate}
          id="mastery-stealth"
          checked={player.stats.masteries.stealth}
          onCheckedChange={(value: boolean) => updateMastery("stealth", value)}
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
        {
          player.stats.masteries.stealth && (
            <span className="text-xs text-muted-foreground">
              ({calculateBonus(player.stats.skills.stealth)})
            </span>
          )
        }
      </div>
      <div className="flex items-center justify-between gap-2">
        <Checkbox
          disabled={!isUpdate}
          id="mastery-sleightHand"
          checked={player.stats.masteries.sleightHand}
          onCheckedChange={(value: boolean) => updateMastery("sleightHand", value)}
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
        {
          player.stats.masteries.sleightHand && (
            <span className="text-xs text-muted-foreground">
              ({calculateBonus(player.stats.skills.sleightHand)})
            </span>
          )
        }
      </div>
      <div className="flex items-center justify-between gap-2">
        <Checkbox
          disabled={!isUpdate}
          id="mastery-arcana"
          checked={player.stats.masteries.arcana}
          onCheckedChange={(value: boolean) => updateMastery("arcana", value)}
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
        {
          player.stats.masteries.arcana && (
            <span className="text-xs text-muted-foreground">
              ({calculateBonus(player.stats.skills.arcana)})
            </span>
          )
        }
      </div>
      <div className="flex items-center justify-between gap-2">
        <Checkbox
          disabled={!isUpdate}
          id="mastery-history"
          checked={player.stats.masteries.history}
          onCheckedChange={(value: boolean) => updateMastery("history", value)}
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
        {
          player.stats.masteries.history && (
            <span className="text-xs text-muted-foreground">
              ({calculateBonus(player.stats.skills.history)})
            </span>
          )
        }
      </div>
      <div className="flex items-center justify-between gap-2">
        <Checkbox
          disabled={!isUpdate}
          id="mastery-investigation"
          checked={player.stats.masteries.investigation}
          onCheckedChange={(value: boolean) => updateMastery("investigation", value)}
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
        {
          player.stats.masteries.investigation && (
            <span className="text-xs text-muted-foreground">
              ({calculateBonus(player.stats.skills.investigation)})
            </span>
          )
        }
      </div>
      <div className="flex items-center justify-between gap-2">
        <Checkbox
          disabled={!isUpdate}
          id="mastery-nature"
          checked={player.stats.masteries.nature}
          onCheckedChange={(value: boolean) => updateMastery("nature", value)}
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
        {
          player.stats.masteries.nature && (
            <span className="text-xs text-muted-foreground">
              ({calculateBonus(player.stats.skills.nature)})
            </span>
          )
        }
      </div>
      <div className="flex items-center justify-between gap-2">
        <Checkbox
          disabled={!isUpdate}
          id="mastery-religion"
          checked={player.stats.masteries.religion}
          onCheckedChange={(value: boolean) => updateMastery("religion", value)}
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
        {
          player.stats.masteries.religion && (
            <span className="text-xs text-muted-foreground">
              ({calculateBonus(player.stats.skills.religion)})
            </span>
          )
        }
      </div>
      <div className="flex items-center justify-between gap-2">
        <Checkbox
          disabled={!isUpdate}
          id="mastery-animalHandling"
          checked={player.stats.masteries.animalHandling}
          onCheckedChange={(value: boolean) => updateMastery("animalHandling", value)}
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
        {
          player.stats.masteries.animalHandling && (
            <span className="text-xs text-muted-foreground">
              ({calculateBonus(player.stats.skills.animalHandling)})
            </span>
          )
        }
      </div>
      <div className="flex items-center justify-between gap-2">
        <Checkbox
          disabled={!isUpdate}
          id="mastery-insight"
          checked={player.stats.masteries.insight}
          onCheckedChange={(value: boolean) => updateMastery("insight", value)}
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
        {
          player.stats.masteries.insight && (
            <span className="text-xs text-muted-foreground">
              ({calculateBonus(player.stats.skills.insight)})
            </span>
          )
        }
      </div>
      <div className="flex items-center justify-between gap-2">
        <Checkbox
          disabled={!isUpdate}
          id="mastery-medicine"
          checked={player.stats.masteries.medicine}
          onCheckedChange={(value: boolean) => updateMastery("medicine", value)}
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
        {
          player.stats.masteries.medicine && (
            <span className="text-xs text-muted-foreground">
              ({calculateBonus(player.stats.skills.medicine)})
            </span>
          )
        }
      </div>
      <div className="flex items-center justify-between gap-2">
        <Checkbox
          disabled={!isUpdate}
          id="mastery-perception"
          checked={player.stats.masteries.perception}
          onCheckedChange={(value: boolean) => updateMastery("perception", value)}
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
        {
          player.stats.masteries.perception && (
            <span className="text-xs text-muted-foreground">
              ({calculateBonus(player.stats.skills.perception)})
            </span>
          )
        }
      </div>
      <div className="flex items-center justify-between gap-2">
        <Checkbox
          disabled={!isUpdate}
          id="mastery-survival"
          checked={player.stats.masteries.survival}
          onCheckedChange={(value: boolean) => updateMastery("survival", value)}
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
        {
          player.stats.masteries.survival && (
            <span className="text-xs text-muted-foreground">
              ({calculateBonus(player.stats.skills.survival)})
            </span>
          )
        }
      </div>
      <div className="flex items-center justify-between gap-2">
        <Checkbox
          disabled={!isUpdate}
          id="mastery-deception"
          checked={player.stats.masteries.deception}
          onCheckedChange={(value: boolean) => updateMastery("deception", value)}
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
        {
          player.stats.masteries.deception && (
            <span className="text-xs text-muted-foreground">
              ({calculateBonus(player.stats.skills.deception)})
            </span>
          )
        }
      </div>
      <div className="flex items-center justify-between gap-2">
        <Checkbox
          disabled={!isUpdate}
          id="mastery-intimidation"
          checked={player.stats.masteries.intimidation}
          onCheckedChange={(value: boolean) => updateMastery("intimidation", value)}
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
        {
          player.stats.masteries.intimidation && (
            <span className="text-xs text-muted-foreground">
              ({calculateBonus(player.stats.skills.intimidation)})
            </span>
          )
        }
      </div>
      <div className="flex items-center justify-between gap-2">
        <Checkbox
          disabled={!isUpdate}
          id="mastery-performance"
          checked={player.stats.masteries.performance}
          onCheckedChange={(value: boolean) => updateMastery("performance", value)}
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
        {
          player.stats.masteries.performance && (
            <span className="text-xs text-muted-foreground">
              ({calculateBonus(player.stats.skills.performance)})
            </span>
          )
        }
      </div>
      <div className="flex items-center justify-between gap-2">
        <Checkbox
          disabled={!isUpdate}
          id="mastery-persuasion"
          checked={player.stats.masteries.persuasion}
          onCheckedChange={(value: boolean) => updateMastery("persuasion", value)}
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
        {
          player.stats.masteries.persuasion && (
            <span className="text-xs text-muted-foreground">
              ({calculateBonus(player.stats.skills.persuasion)})
            </span>
          )
        }
      </div>
    </Card>
  );
}
