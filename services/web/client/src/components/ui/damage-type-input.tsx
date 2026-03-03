"use client";

import { DEFAULT_DAMAGE_TYPES } from "@/utils/attack.utils";
import { ComboboxInput } from "@/components/ui/combobox-input";

interface DamageTypeInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  customDamageTypes?: string[];
}

/**
 * Composant réutilisable permettant de sélectionner un type de dégâts
 * parmi les types de base de D&D 5e ou d'en ajouter un personnalisé.
 */
export function DamageTypeInput({
  value = "",
  onChange,
  placeholder = "",
  customDamageTypes = [],
  ...props
}: DamageTypeInputProps) {
  const allDamageTypes = [...DEFAULT_DAMAGE_TYPES, ...customDamageTypes];

  return (
    <ComboboxInput
      value={value}
      onChange={onChange}
      suggestions={allDamageTypes}
      placeholder={placeholder}
      {...props}
    />
  );
}
