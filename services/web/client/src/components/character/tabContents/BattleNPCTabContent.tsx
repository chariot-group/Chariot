import { Card } from "@/components/ui/card";
import { NPC } from "@/types/character";
import Image from "next/image";
import ShieldIcon from "@public/assets/icons/shield-icon.svg";
import CharacterHealthBar from "@/components/character/CharacterHealthBar";

interface Props {
    npc: NPC;
    accentColor: string;
}

const BattleNPCTabContent = ({ npc, accentColor }: Props) => {
    return (
        <div className="w-full flex flex-col gap-4 items-start">
            <div className="flex flex-row gap-4">
                <Card className='gap-2 max-w-1/4'>
                    <h2 className={`text-2xl sm:text-3xl font-semibold ${accentColor}`}>
                        Statistiques PNJ
                    </h2>
                    <div className="flex flex-row justify-start gap-2 text-xl font-extrabold">
                        <div className="bg-white text-black flex flex-row justify-center gap-1 rounded-full px-5 py-1 items-center">
                            <Image
                                src={ShieldIcon}
                                alt=""
                                aria-hidden="true"
                                className="size-5"
                            />
                            <span aria-hidden="true">{npc.stats.armorClass}</span>
                        </div>
                    </div>
                    <CharacterHealthBar currentHP={npc.stats.currentHitPoints} maxHP={npc.stats.maxHitPoints} tempHP={npc.stats.tempHitPoints} />
                </Card >
                <Card className='gap-2'>
                    <h2 className={`text-2xl sm:text-3xl font-semibold ${accentColor}`}>
                        Caractéristiques
                    </h2>
                </Card >
            </div>
            <div className="flex flex-row gap-4">
                <Card className='gap-2'>
                    <h2 className={`text-2xl sm:text-3xl font-semibold ${accentColor}`}>
                        Actions
                    </h2>
                </Card >
            </div>
        </div>
    )
}

export default BattleNPCTabContent
