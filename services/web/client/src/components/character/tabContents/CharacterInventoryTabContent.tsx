import { NPC, Player } from '@/types/character';
import GP from "@public/assets/golden-piece.svg";
import SP from "@public/assets/silver-piece.svg";
import EP from "@public/assets/electrum-piece.svg";
import PP from "@public/assets/platinum-piece.svg";
import CP from "@public/assets/copper-piece.svg";
import Image from "next/image";
import { Card } from '@/components/ui/card';

interface Props {
    accentColor: string;
    character: Player | NPC;
}


const CharacterInventoryTabContent = ({
    accentColor,
    character,
}: Props) => {
    return (
        <div className="w-full flex flex-row gap-4 items-start">
            <div className="flex flex-col gap-4 w-2/5" >
                <Card className='gap-2'>
                    <h2 className={`text-2xl sm:text-3xl font-semibold ${accentColor}`}>
                        Pièces
                    </h2>
                    <div className="flex flex-row justify-between">
                        <span
                            className="flex flex-row gap-1 font-medium text-sm sm:text-base items-center"
                            aria-hidden="true">
                            <Image
                                src={PP}
                                alt=""
                                aria-hidden="true"
                                className="size-6 sm:size-7"
                            />
                            {character?.treasure.pp ?? 0} pp
                        </span>
                        <span
                            className="flex flex-row gap-1 font-medium text-sm sm:text-base items-center"
                            aria-hidden="true">
                            <Image
                                src={GP}
                                alt=""
                                aria-hidden="true"
                                className="size-6 sm:size-7"
                            />
                            {character?.treasure.gp ?? 0} gp
                        </span>
                        <span
                            className="flex flex-row gap-1 font-medium text-sm sm:text-base items-center"
                            aria-hidden="true">
                            <Image
                                src={EP}
                                alt=""
                                aria-hidden="true"
                                className="size-6 sm:size-7"
                            />
                            {character?.treasure.ep ?? 0} ep
                        </span>
                        <span
                            className="flex flex-row gap-1 font-medium text-sm sm:text-base items-center"
                            aria-hidden="true">
                            <Image
                                src={SP}
                                alt=""
                                aria-hidden="true"
                                className="size-6 sm:size-7"
                            />
                            {character?.treasure.sp ?? 0} sp
                        </span>
                        <span
                            className="flex flex-row gap-1 font-medium text-sm sm:text-base items-center"
                            aria-hidden="true">
                            <Image
                                src={CP}
                                alt=""
                                aria-hidden="true"
                                className="size-6 sm:size-7"
                            />
                            {character?.treasure.cp ?? 0} cp
                        </span>
                    </div>
                </Card>
                <Card className='gap-2'>
                    <h2 className={`text-2xl sm:text-3xl font-semibold ${accentColor}`}>
                        Équipement
                    </h2>
                    <p>
                        {character?.treasure.treasure ?? ""}
                    </p>
                </Card>
            </div >
            <Card className='min-w-3/5 gap-2'>
                <h2 className={`text-start text-2xl sm:text-3xl font-semibold mb-3 ${accentColor}`}>
                    Trésor
                </h2>
                <p>
                    {character?.treasure.treasure ?? ""}
                </p>
            </Card>
        </div >
    )
}

export default CharacterInventoryTabContent
