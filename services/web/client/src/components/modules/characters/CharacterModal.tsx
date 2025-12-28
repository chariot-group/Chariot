"use client";
import React, { useEffect, useState } from "react";
import ICharacter from "@/models/characters/ICharacter";
import IPlayer from "@/models/player/IPlayer";
import PlayerModalDetails from "@/components/modules/characters/modals/PlayerModalDetails";
import INpc from "@/models/npc/INpc";
import NpcModalDetails from "@/components/modules/characters/modals/NpcModalDetails";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  character: ICharacter;
  updateCharacter?: (character: ICharacter) => void;
  isUpdating: boolean;
}
const CharacterModal = ({ isOpen, onClose, character, updateCharacter = () => { }, isUpdating }: Props) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs"
        onClick={onClose}></div>
      <div
        className={`h-[90vh] w-[95%] 2xl:w-[80%] 2xl:h-[80vh] ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}>
        {character.kind === "player" && (
          <PlayerModalDetails
            isUpdate={isUpdating}
            player={character as IPlayer}
            onClose={onClose}
            updatePlayer={updateCharacter}
          />
        )}
        {character.kind === "npc" && (
          <NpcModalDetails
            npc={character as INpc}
            onClose={onClose}
            updateNpc={updateCharacter}
            isUpdate={isUpdating}
          />
        )}
      </div>
    </div>
  );
};

export default CharacterModal;
