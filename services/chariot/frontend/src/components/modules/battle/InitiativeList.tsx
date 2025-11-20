import React from "react";
import InitiativeItem from "@/components/modules/battle/InitiativeItem";
import ICharacter from "@/models/characters/ICharacter";
import { Table, TableBody, TableCaption, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IParticipant } from "@/models/participant/IParticipant";
import { useTranslations } from "next-intl";

interface Props {
  participants: IParticipant[];
  setParticipants: (participants: IParticipant[]) => void;
  currentParticipant?: IParticipant;
}

const InitiativeList = ({ participants, setParticipants, currentParticipant }: Props) => {
  const t = useTranslations("InitiativeList");

  const handleInitiativeChange = (participant: IParticipant) => {
    setParticipants(participants.map((p) => (p.character._id === participant.character._id ? participant : p)));
  };

  const handleSetParticipant = (updatedParticipant: IParticipant) =>
    setParticipants(
      participants.map((p) => (p.character._id === updatedParticipant.character._id ? updatedParticipant : p)),
    );

  return (
    <Table className="w-full border-y">
      <TableHeader>
        <TableRow className="text-xl text-center hover:bg-transparent">
          <TableHead>{t("initiative")}</TableHead>
          <TableHead>{t("name")}</TableHead>
          <TableHead>{t("hitPoints")}</TableHead>
          <TableHead>{t("armorClass")}</TableHead>
          <TableHead>{t("group")}</TableHead>
          <TableHead>{t("actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {participants.map((participant) => (
          <InitiativeItem
            key={participant.character._id}
            participant={participant}
            handleInitiativeChange={handleInitiativeChange}
            setParticipant={handleSetParticipant}
            isCurrent={currentParticipant?.character._id === participant.character._id}
          />
        ))}
      </TableBody>
    </Table>
  );
};

export default InitiativeList;
