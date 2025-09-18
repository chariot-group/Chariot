"use client";
import React, { useEffect, useState } from "react";
import InitiativeList from "./InitiativeList";
import { IGroupWithRelations } from "@/models/groups/IGroup";
import { IParticipant } from "@/models/participant/IParticipant";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, RefreshCcw, Swords } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import usePersistentInitiatives, { InitiativeMap } from "@/hooks/usePersistentInitiatives";
interface Props {
  groups: (IGroupWithRelations | null)[];
  campaignId: string;
}

const InitiativeTracker = ({ groups, campaignId }: Props) => {
  const t = useTranslations("InitiativeTracker");

  const [participants, setParticipants] = useState<IParticipant[]>([]);
  const [currentParticipant, setCurrentParticipant] = useState<IParticipant | undefined>(undefined);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [initiatives, setInitiatives] = usePersistentInitiatives("battle-initiatives", {});

  useEffect(() => {
    if (groups.length !== 2) {
      console.warn("Exactly 2 groups are required.");
      return;
    }
    const allParticipants: IParticipant[] = [];
    groups.forEach((group) => {
      group?.characters.forEach((character) => {
        allParticipants.push({
          character,
          groupLabel: group.label,
          initiative: initiatives[character._id] ? parseInt(initiatives[character._id]) : 0,
        });
      });
    });

    sortAndSetParticipants(allParticipants);
  }, [groups]);

  const sortAndSetParticipants = (newParticipants: IParticipant[]) => {
    const sorted = [...newParticipants].sort((a, b) => {
      const initA = a.initiative ?? -Infinity;
      const initB = b.initiative ?? -Infinity;
      return initB - initA;
    });
    setParticipants(sorted);

    const newInitiatives: InitiativeMap = {};
    sorted.forEach((participant) => {
      if (typeof participant.initiative !== "undefined") {
        newInitiatives[participant.character._id] = participant.initiative.toString();
      }
    });
    setInitiatives(newInitiatives);
  };

  const handleReset = () => {
    const resetParticipants = participants.map((p) => ({
      ...p,
      initiative: 0,
      character: {
        ...p.character,
        stats: {
          ...p.character.stats,
          currentHitPoints: p.character.stats.maxHitPoints,
        },
      },
    }));
    sortAndSetParticipants(resetParticipants);
    setCurrentParticipant(undefined);
    setCurrentRound(1);
  };

  const handleNext = () => {
    if (!currentParticipant) return;
    const currentIndex = participants.findIndex((p) => p === currentParticipant);
    const total = participants.length;

    const validParticipants = participants.filter((p) => p.character.stats.currentHitPoints > 0);
    if (validParticipants.length === 0) return;

    const nextParticipant = [...Array(total - 1)]
      .map((_, i) => (currentIndex + i + 1) % total)
      .map((i) => participants[i])
      .find((p) => p.character.stats.currentHitPoints > 0);

    if (nextParticipant) {
      setCurrentParticipant(nextParticipant);
      if (nextParticipant.character._id === validParticipants[0].character._id) {
        setCurrentRound((prev) => prev + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (!currentParticipant) return;
    const currentIndex = participants.findIndex((p) => p === currentParticipant);
    const total = participants.length;

    const validParticipants = participants.filter((p) => p.character.stats.currentHitPoints > 0);
    if (validParticipants.length === 0) return;

    const previousParticipant = [...Array(total - 1)]
      .map((_, i) => (currentIndex - i - 1 + total) % total)
      .map((i) => participants[i])
      .find((p) => p.character.stats.currentHitPoints > 0);

    if (previousParticipant) {
      setCurrentParticipant(previousParticipant);

      if (currentParticipant.character._id === validParticipants[0].character._id && currentRound > 1) {
        setCurrentRound((prev) => prev - 1);
      }
    }
  };

  const handleBattleStart = () => {
    const firstParticipant = participants[0];
    if (firstParticipant) {
      setCurrentParticipant(firstParticipant);
    }
  };

  return (
    <div className="p-5">
      <div className="relative flex justify-between my-4">
        <Link href={`/campaigns/${campaignId}/battle/select`}>
          <Button
            variant="outline"
            onClick={handleReset}>
            {t("backToSelection")}
          </Button>
        </Link>
        <p className="text-3xl absolute left-[47%] text-center ">
          {t("round")} : {currentRound}
        </p>
      </div>

      <InitiativeList
        participants={participants}
        setParticipants={sortAndSetParticipants}
        currentParticipant={currentParticipant}
      />
      <div className="relative flex justify-between mt-5">
        <Button
          variant="outline"
          onClick={handleReset}>
          {t("reset")} <RefreshCcw />
        </Button>
        {currentParticipant && (
          <div className="absolute left-[47%] flex flex-row justify-center gap-x-2">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={
                currentRound === 1 &&
                currentParticipant.character._id ===
                  participants.find((p) => p.character.stats.currentHitPoints > 1)?.character._id
              }>
              {t("previous")} <ArrowLeft />
            </Button>
            <Button onClick={handleNext}>
              {t("next")} <ArrowRight />
            </Button>
          </div>
        )}
        {!currentParticipant && (
          <Button
            className="absolute left-[47%]"
            onClick={handleBattleStart}>
            {t("start")} <Swords />
          </Button>
        )}
      </div>
    </div>
  );
};

export default InitiativeTracker;
