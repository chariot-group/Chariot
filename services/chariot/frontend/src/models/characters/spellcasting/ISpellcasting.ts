import ISpell from "@/models/characters/spellcasting/ISpell";

export default interface ISpellcasting {
  ability?: string;
  saveDC?: number;
  attackBonus: number;
  spellSlotsByLevel?: ISpellSlotsByLevel;
  totalSlots: number;
  spells: ISpell[];
}

interface Item {
  total?: number;
  used?: number;
}

export interface ISpellSlotsByLevel {
  [key: number]: Item;
}
