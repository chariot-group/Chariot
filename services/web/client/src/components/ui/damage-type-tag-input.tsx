"use client";

import { DEFAULT_DAMAGE_TYPES } from "@/utils/attack.utils";
import { TagInput } from "@/components/ui/tag-input";

interface DamageTypeTagInputProps {
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    id?: string;
    "aria-invalid"?: boolean;
    "aria-describedby"?: string;
    customDamageTypes?: string[];
}

/**
 * Reusable input to select one or more damage types, including custom entries.
 */
export function DamageTypeTagInput({
    value = [],
    onChange,
    placeholder = "",
    customDamageTypes = [],
    ...props
}: DamageTypeTagInputProps) {
    const allDamageTypes = [...DEFAULT_DAMAGE_TYPES, ...customDamageTypes];

    return (
        <TagInput
            value={value}
            onChange={onChange}
            suggestions={allDamageTypes}
            placeholder={placeholder}
            {...props}
        />
    );
}
