import { Card } from "@/components/ui/card";
import { Player } from "@/types/character";
import Image from "next/image";
import ShieldIcon from "@public/assets/icons/shield-icon.svg";
import FeatherIcon from "@public/assets/icons/feather-icon.svg";
import RunningIcon from "@public/assets/icons/running-icon.svg";
import CharacterHealthBar from "@/components/character/CharacterHealthBar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import PerformedThrow from "@public/assets/death-saves/performed-throw.svg";
import UnperformedThrow from "@public/assets/death-saves/unperformed-throw.svg";
import Competence from "@/components/character/tabContents/general/Competence";

interface Props {
    player: Player;
    accentColor: string;
}

const BattlePlayerTabContent = ({ player, accentColor }: Props) => {

    function isMastered(competence: string): boolean {
        return player.stats.masteriesAbility[competence as keyof typeof player.stats.masteriesAbility] === true;
    }

    return (
        <div className="w-full flex flex-col gap-4 items-start">
            <div className="flex flex-row gap-4">
                <Card className='gap-2 max-w-1/4 rounded-xl'>
                    <h2 className={`text-2xl sm:text-3xl font-semibold ${accentColor}`}>
                        Statistiques Principales
                    </h2>
                    <div className="flex flex-row justify-start gap-2 text-xl font-extrabold">
                        <div className="bg-white text-black flex flex-row justify-center gap-1 rounded-full px-5 py-1 items-center">
                            <Image
                                src={ShieldIcon}
                                alt=""
                                aria-hidden="true"
                                className="size-5"
                            />
                            <span aria-hidden="true">{player.stats.armorClass}</span>
                        </div>
                        <div className="bg-white text-black flex flex-row justify-center gap-1 rounded-full px-5 py-1 items-center">
                            <Image
                                src={FeatherIcon}
                                alt=""
                                aria-hidden="true"
                                className="size-6"
                            />
                            <span aria-hidden="true">7</span>
                        </div>
                        <div className="bg-white text-black flex flex-row justify-center gap-1 rounded-full px-5 py-1 items-center">
                            <Image
                                src={RunningIcon}
                                alt=""
                                aria-hidden="true"
                                className="size-6"
                            />
                            <span aria-hidden="true">7m</span>
                        </div>
                    </div>
                    <CharacterHealthBar currentHP={player.stats.currentHitPoints} maxHP={player.stats.maxHitPoints} tempHP={player.stats.tempHitPoints} />
                    <div className="text-lg px-2">
                        <span>
                            Dés de Vie :
                        </span>
                        {player.class.map((c, i) => (
                            <span key={c.name}>{i === 0 ? ' ' : ' + '}<span className="font-bold">{c.level}d{c.hitDice}</span>{` (${c.name})`}</span>
                        ))}
                    </div>
                </Card >

                {/* Jet de sauvegarde */}
                <div className="flex flex-col gap-3">
                    <Card
                        className="gap-3 py-4 px-4 md:px-6 h-fit"
                        role="region"
                        aria-labelledby="saving-throws-heading">
                        <h2
                            id="saving-throws-heading"
                            className={`text-xl sm:text-3xl font-semibold ${accentColor}`}>
                            Jets de sauvegarde
                        </h2>
                    </Card>
                    <div
                        className="grid grid-cols-1 md:grid-cols-2 gap-2"
                        role="list">
                        {player?.stats &&
                            Object.entries(player?.stats?.savingThrows).map(([key, value]) => {
                                const isMasteredKey = isMastered(key);
                                const abilityName = `${key}`;
                                return (
                                    <Competence
                                        key={key}
                                        competence={abilityName}
                                        value={isMasteredKey ? 2 : 0}
                                        accentColor={accentColor}
                                        skills={value}
                                    />
                                );
                            })}
                    </div>
                </div>
                <Card className='gap-2 rounded-xl h-fit'>
                    <h2 className={`text-2xl sm:text-3xl font-semibold ${accentColor}`}>
                        Jets de Sauvegarde contre la Mort
                    </h2>
                    <div className="flex flex-row gap-3 items-center">
                        <span>Succès :</span>
                        <div className="grid grid-cols-3 gap-2">
                            <Image
                                src={PerformedThrow}
                                alt={"Mastery Icon"}
                                width={20}
                                height={20}
                                className="shrink-0"
                                aria-hidden="true"
                            />
                            <Image
                                src={PerformedThrow}
                                alt={"Mastery Icon"}
                                width={20}
                                height={20}
                                className="shrink-0"
                                aria-hidden="true"
                            />
                            <Image
                                src={UnperformedThrow}
                                alt={"Mastery Icon"}
                                width={20}
                                height={20}
                                className="shrink-0"
                                aria-hidden="true"
                            />
                        </div>
                    </div>
                    <div className="flex flex-row gap-3 items-center">
                        <span>Échecs :</span>
                        <div className="grid grid-cols-3 gap-2">
                            <Image
                                src={PerformedThrow}
                                alt={"Mastery Icon"}
                                width={20}
                                height={20}
                                className="shrink-0"
                                aria-hidden="true"
                            />
                            <Image
                                src={UnperformedThrow}
                                alt={"Mastery Icon"}
                                width={20}
                                height={20}
                                className="shrink-0"
                                aria-hidden="true"
                            />
                            <Image
                                src={UnperformedThrow}
                                alt={"Mastery Icon"}
                                width={20}
                                height={20}
                                className="shrink-0"
                                aria-hidden="true"
                            />
                        </div>
                    </div>
                </Card >
            </div>
            <div className="flex flex-row gap-4 w-full">
                <Card className='gap-2 w-2/5 rounded-xl h-fit'>
                    <h2 className={`text-2xl sm:text-3xl font-semibold ${accentColor}`}>
                        Capacités et traits
                    </h2>
                    <Accordion
                        type="single"
                        collapsible
                        className="w-full">
                        {player?.abilities.map((ability, index) => (
                            <AccordionItem
                                key={ability.name}
                                value={ability.name}>
                                <AccordionTrigger
                                    className="text-left hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 rounded py-3"
                                    aria-label={`details ${ability.name}`}>
                                    <span className="text-sm sm:text-base font-medium">{ability.name}</span>
                                </AccordionTrigger>
                                <AccordionContent
                                    className="text-sm sm:text-base pb-3 pt-1"
                                    role="region"
                                    aria-label={`description ${ability.name}`}>
                                    {ability.description}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </Card >
                <div className="w-3/5 flex flex-col gap-2">
                    <Card className='gap-2 h-fit rounded-full'>
                        <h2 className={`text-2xl sm:text-3xl font-semibold ${accentColor}`}>
                            Actions
                        </h2>
                    </Card >
                    <Card className='gap-2 h-fit grid grid-cols-7 rounded-full'>
                        <span className={`text-xl sm:text-xl font-semibold col-start-1 col-end-3 ${accentColor}`}>
                            Nom
                        </span>
                        <span className={`text-xl sm:text-xl font-semibold col-start-3 col-end-4 justify-self-center ${accentColor}`}>
                            Attaque
                        </span>
                        <span className={`text-xl sm:text-xl font-semibold col-start-4 ${accentColor}`}>
                            Dégats/Type
                        </span>
                    </Card >
                    <Card className='gap-2 h-fit grid grid-cols-7 items-center rounded-full'>
                        <span className={`text-xl sm:text-xl col-start-1 col-end-3`}>
                            Épée longue embrasée
                        </span>
                        <span className={`text-xl sm:text-xl col-start-3 col-end-4 justify-self-center`}>
                            +6
                        </span>
                        <span className={`text-xl sm:text-xl col-start-4 col-end-8 w-full`}>
                            1d8+4 tranchant (1M) / 1d10+4 tranchant (2M) +2d8 radiants (Châtiment)
                        </span>
                    </Card >
                </div>

            </div>
        </div>
    )
}

export default BattlePlayerTabContent
