import { Card } from "@/components/ui/card";
import { Player } from "@/types/character";
import Image from "next/image";
import ShieldIcon from "@public/assets/icons/shield-icon.svg";
import FeatherIcon from "@public/assets/icons/feather-icon.svg";
import RunningIcon from "@public/assets/icons/running-icon.svg";
import CharacterHealthBar from "@/components/character/CharacterHealthBar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import RedCircle from "@public/assets/icons/red-circle.svg";
import WhiteCircle from "@public/assets/icons/white-circle.svg";
import Skill from "@/components/character/tabContents/general/Skill";
import ActionSection from "@/components/character/tabContents/ActionSection";
import { Bird, Mountain, Shovel, Waves } from "lucide-react";

interface Props {
    player: Player;
    accentColor: string;
}

const BattlePlayerTabContent = ({ player, accentColor }: Props) => {
    // Configuration des badges de statistiques
    const speedBadges = [
        { key: 'walk', value: player.stats.speed.walk, icon: <Image src={RunningIcon} alt="" aria-hidden="true" className="size-6" /> },
        { key: 'climb', value: player.stats.speed.climb, icon: <Mountain size={24} className='text-black' /> },
        { key: 'swim', value: player.stats.speed.swim, icon: <Waves size={24} className='text-black' /> },
        { key: 'fly', value: player.stats.speed.fly, icon: <Bird size={24} className='text-black' /> },
        { key: 'burrow', value: player.stats.speed.burrow, icon: <Shovel size={24} className='text-black' /> },
    ];

    function isMastered(skill: string): boolean {
        return player.stats.masteriesAbility[skill as keyof typeof player.stats.masteriesAbility] === true;
    }

    return (
        <div className="w-full flex flex-col gap-4 items-start">
            <div className="flex flex-row gap-4">
                <Card className='gap-2 max-w-1/4 h-fit'>
                    <h2 className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
                        Statistiques PNJ
                    </h2>
                    <div className="flex flex-row justify-start gap-2 text-xl font-extrabold flex-wrap">
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
                                className="size-5"
                            />
                            <span aria-hidden="true">{player.stats.initiative > 0 ? `+${player.stats.initiative}` : player.stats.initiative}</span>
                        </div>
                        {speedBadges.map((badge) =>
                            badge.value && (
                                <div key={badge.key} className="bg-white text-black flex flex-row justify-center gap-1 rounded-full px-5 py-1 items-center">
                                    {badge.icon}
                                    <span aria-hidden="true">{badge.value}ft</span>
                                </div>
                            )
                        )}
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
                            className={`ttext-xl sm:text-2xl font-semibold ${accentColor}`}>
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
                                    <Skill
                                        key={key}
                                        skillName={abilityName}
                                        value={isMasteredKey ? 2 : 0}
                                        accentColor={accentColor}
                                        skills={value}
                                    />
                                );
                            })}
                    </div>
                </div>
                <Card className='gap-2 rounded-xl h-fit'>
                    <h2 className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
                        Jets de Sauvegarde contre la Mort
                    </h2>
                    <div className="flex flex-row gap-2 items-center">
                        <span>Succès :</span>
                        <div className="grid grid-cols-3 gap-2">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <Image
                                    key={"death-save-success-" + index}
                                    src={index < player.deathSaves.successes ? RedCircle : WhiteCircle}
                                    alt={index < player.deathSaves.successes ? "Performed Throw" : "Unperformed Throw"}
                                    width={20}
                                    height={20}
                                    className="shrink-0"
                                    aria-hidden="true"
                                />))}
                        </div>
                    </div>
                    <div className="flex flex-row gap-2 items-center">
                        <span>Échecs :</span>
                        <div className="grid grid-cols-3 gap-2">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <Image
                                    key={"death-save-failure-" + index}
                                    src={index < player.deathSaves.failures ? RedCircle : WhiteCircle}
                                    alt={index < player.deathSaves.failures ? "Performed Throw" : "Unperformed Throw"}
                                    width={20}
                                    height={20}
                                    className="shrink-0"
                                    aria-hidden="true"
                                />))}
                        </div>
                    </div>
                </Card >
            </div>
            <div className="flex flex-row gap-2 md:gap-4 w-full">
                <Card className='gap-2 md:gap-4 w-2/5 rounded-xl h-fit'>
                    <h2 className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
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
                <div className="w-3/5 flex flex-row gap-2 md:gap-4">
                    <ActionSection
                        title="Actions"
                        actions={player.actions}
                        accentColor={accentColor}
                    />
                </div>

            </div>
        </div>
    )
}

export default BattlePlayerTabContent
