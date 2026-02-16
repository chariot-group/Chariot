import { Character } from "@/types/character";
import CharacterMagicView from "@/components/character/tabContents/magic/view/CharacterMagicView";
import CharacterMagicTabEdit from "@/components/character/tabContents/magic/form/CharacterMagicTabEdit";
import { UseFormReturn } from "react-hook-form";

interface CharacterMagicTabContentProps {
    character: Character;
    accentColor: string;
    form: UseFormReturn<any>;
    isEditing: boolean;
}

export default function CharacterMagicTabContent({ character, accentColor, form, isEditing }: CharacterMagicTabContentProps) {
    if (isEditing) {
        return <CharacterMagicTabEdit character={character} accentColor={accentColor} form={form} />;
    }

    return <CharacterMagicView character={character} accentColor={accentColor} />;
}
