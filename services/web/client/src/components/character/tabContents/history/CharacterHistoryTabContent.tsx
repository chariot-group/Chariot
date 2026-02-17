import { Character } from "@/types/character";
import CharacterHistoryView from "@/components/character/tabContents/history/view/CharacterHistoryView";
import CharacterHistoryTabEdit from "@/components/character/tabContents/history/form/CharacterHistoryTabEdit";
import { UseFormReturn } from "react-hook-form";

interface CharacterHistoryTabContentProps {
    character: Character;
    accentColor: string;
    form: UseFormReturn<any>;
    isEditing: boolean;
}

export default function CharacterHistoryTabContent({ character, accentColor, form, isEditing }: CharacterHistoryTabContentProps) {
    if (isEditing) {
        return <CharacterHistoryTabEdit character={character} accentColor={accentColor} form={form} />;
    }

    return <CharacterHistoryView character={character} accentColor={accentColor} />;
}
