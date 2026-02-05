import { Card } from "@/components/ui/card";
import { Character } from "@/types/character";
import Image from "next/image";
import ShieldIcon from "@public/assets/icons/shield-icon.svg";
import FeatherIcon from "@public/assets/icons/feather-icon.svg";
import RunningIcon from "@public/assets/icons/running-icon.svg";
import CharacterHealthBar from "../CharacterHealthBar";

interface Props {
    character: Character;
    accentColor: string;
}

const CharacterBattleTabContent = ({ character, accentColor }: Props) => {
    return (
        <div className="w-full flex flex-col gap-4 items-start">
            <div className="flex flex-row gap-4">
                <Card className='gap-2 max-w-1/4'>
                    <h2 className={`text-2xl sm:text-3xl font-semibold ${accentColor}`}>
                        Statistiques Principales
                    </h2>
                    <div className="flex flex-row justify-start gap-2 text-xl font-extrabold">
                        <span className="bg-white text-black flex flex-row rounded-full px-3 py-1 gap-2">
                            <Image
                                src={ShieldIcon}
                                alt=""
                                aria-hidden="true"
                                className="size-6 sm:size-7"
                            />
                            <span aria-hidden="true">18</span>
                        </span>
                        <span className="bg-white text-black flex flex-row rounded-full px-3 py-1 gap-2">
                            <Image
                                src={FeatherIcon}
                                alt=""
                                aria-hidden="true"
                                className="size-6 sm:size-7"
                            />
                            <span aria-hidden="true">+0</span>
                        </span>
                        <span className="bg-white text-black flex flex-row rounded-full px-3 py-1 gap-2">
                            <Image
                                src={RunningIcon}
                                alt=""
                                aria-hidden="true"
                                className="size-6 sm:size-7"
                            />
                            <span aria-hidden="true">9m</span>
                        </span>
                    </div>
                    <CharacterHealthBar currentHP={0} maxHP={40} tempHP={0} />
                </Card >
                <Card className='gap-2'>
                    <h2 className={`text-2xl sm:text-3xl font-semibold ${accentColor}`}>
                        Jets de Sauvegarde contre la Mort
                    </h2>
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
                        Capacités et traits
                    </h2>
                </Card >
                <Card className='gap-2'>
                    <h2 className={`text-2xl sm:text-3xl font-semibold ${accentColor}`}>
                        Actions
                    </h2>
                </Card >
            </div>
        </div>
    )
}

export default CharacterBattleTabContent
