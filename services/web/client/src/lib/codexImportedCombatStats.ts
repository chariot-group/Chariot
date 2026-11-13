const getAbilityModifier = (value?: number): number => Math.floor(((value ?? 10) - 10) / 2);

/** Normalise combat stats on Codex import (same semantics as CharacterFormView). */
export function buildCodexImportedCombatStats(data: {
  stats?: {
    abilityScores?: Partial<{
      strength: number;
      dexterity: number;
      constitution: number;
      intelligence: number;
      wisdom: number;
      charisma: number;
    }>;
    savingThrows?: Partial<{
      strength: number;
      dexterity: number;
      constitution: number;
      intelligence: number;
      wisdom: number;
      charisma: number;
    }>;
    armorClass?: number;
    speed?: Partial<{ walk: number; climb: number; swim: number; fly: number; burrow: number }>;
  };
}) {
  const abilityScores = {
    strength: data.stats?.abilityScores?.strength ?? 10,
    dexterity: data.stats?.abilityScores?.dexterity ?? 10,
    constitution: data.stats?.abilityScores?.constitution ?? 10,
    intelligence: data.stats?.abilityScores?.intelligence ?? 10,
    wisdom: data.stats?.abilityScores?.wisdom ?? 10,
    charisma: data.stats?.abilityScores?.charisma ?? 10,
  };
  const codexSavingThrows = data.stats?.savingThrows || {};
  const dexterityModifier = getAbilityModifier(abilityScores.dexterity);
  const baseArmorClass = data.stats?.armorClass ?? 0;

  return {
    abilityScores,
    armorClass: Math.max(baseArmorClass, 10 + dexterityModifier),
    speed: {
      walk: data.stats?.speed?.walk ?? 30,
      climb: data.stats?.speed?.climb ?? 0,
      swim: data.stats?.speed?.swim ?? 0,
      fly: data.stats?.speed?.fly ?? 0,
      burrow: data.stats?.speed?.burrow ?? 0,
    },
    savingThrows: {
      strength: Math.max(
        0,
        (codexSavingThrows.strength ?? getAbilityModifier(abilityScores.strength)) -
          getAbilityModifier(abilityScores.strength),
      ),
      dexterity: Math.max(
        0,
        (codexSavingThrows.dexterity ?? getAbilityModifier(abilityScores.dexterity)) -
          getAbilityModifier(abilityScores.dexterity),
      ),
      constitution: Math.max(
        0,
        (codexSavingThrows.constitution ?? getAbilityModifier(abilityScores.constitution)) -
          getAbilityModifier(abilityScores.constitution),
      ),
      intelligence: Math.max(
        0,
        (codexSavingThrows.intelligence ?? getAbilityModifier(abilityScores.intelligence)) -
          getAbilityModifier(abilityScores.intelligence),
      ),
      wisdom: Math.max(
        0,
        (codexSavingThrows.wisdom ?? getAbilityModifier(abilityScores.wisdom)) - getAbilityModifier(abilityScores.wisdom),
      ),
      charisma: Math.max(
        0,
        (codexSavingThrows.charisma ?? getAbilityModifier(abilityScores.charisma)) -
          getAbilityModifier(abilityScores.charisma),
      ),
    },
  };
}
