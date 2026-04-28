import { NPC, Player } from "@/types/character";
import CharacterInventoryView from "@/components/character/tabContents/inventory/view/CharacterInventoryView";
import CharacterInventoryTabEdit from "@/components/character/tabContents/inventory/form/CharacterInventoryTabEdit";
import { UseFormReturn, FieldValues } from "react-hook-form";

interface CharacterInventoryTabContentProps {
    accentColor: string;
    character: Player | NPC;
    form: UseFormReturn<FieldValues>;
    isEditing: boolean;
}

export default function CharacterInventoryTabContent({ accentColor, character, form, isEditing }: CharacterInventoryTabContentProps) {
    if (isEditing) {
        return <CharacterInventoryTabEdit accentColor={accentColor} form={form} />;
    }

    return <CharacterInventoryView accentColor={accentColor} character={character} />;
}
