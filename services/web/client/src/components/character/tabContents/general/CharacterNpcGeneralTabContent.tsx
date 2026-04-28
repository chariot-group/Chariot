import { NPC } from "@/types/character";
import NpcGeneralTabContent from "@/components/character/tabContents/general/view/NpcGeneralTabContent";
import NpcGeneralTabEdit from "@/components/character/tabContents/general/form/NpcGeneralTabEdit";
import { UseFormReturn, FieldValues } from "react-hook-form";

interface CharacterNpcGeneralTabContentProps {
    character: NPC;
    accentColor: string;
    form: UseFormReturn<FieldValues>;
    isEditing: boolean;
}

export default function CharacterNpcGeneralTabContent({ character, accentColor, form, isEditing }: CharacterNpcGeneralTabContentProps) {
    if (isEditing) {
        return <NpcGeneralTabEdit npc={character} accentColor={accentColor} form={form} />;
    }

    return <NpcGeneralTabContent npc={character} accentColor={accentColor} />;
}
