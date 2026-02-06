import { Card } from "@/components/ui/card";
import { NPC } from "@/types/character";
import Image from "next/image";
import ShieldIcon from "@public/assets/icons/shield-icon.svg";
import RunningIcon from "@public/assets/icons/running-icon.svg";
import FeatherIcon from "@public/assets/icons/feather-icon.svg";
import CharacterHealthBar from "@/components/character/CharacterHealthBar";
import Skill from "@/components/character/tabContents/general/Skill";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ActionSection from "@/components/character/tabContents/ActionSection";
import { Bird, Mountain, Shovel, Waves } from "lucide-react";

interface Props {
    npc: NPC;
    accentColor: string;
}

const BattleNPCTabContent = ({ npc, accentColor }: Props) => {
    // Configuration des badges de statistiques
    const speedBadges = [
        { key: 'walk', value: npc.stats.speed.walk, icon: <Image src={RunningIcon} alt="" aria-hidden="true" className="size-6" /> },
        { key: 'climb', value: npc.stats.speed.climb, icon: <Mountain size={24} className='text-black' /> },
        { key: 'swim', value: npc.stats.speed.swim, icon: <Waves size={24} className='text-black' /> },
        { key: 'fly', value: npc.stats.speed.fly, icon: <Bird size={24} className='text-black' /> },
        { key: 'burrow', value: npc.stats.speed.burrow, icon: <Shovel size={24} className='text-black' /> },
    ];

    return (
        <div className="w-full flex flex-col gap-2 md:gap-4 items-start">
            <div className="flex flex-row gap-2 md:gap-4 w-full">
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
                            <span aria-hidden="true">{npc.stats.armorClass}</span>
                        </div>
                        <div className="bg-white text-black flex flex-row justify-center gap-1 rounded-full px-5 py-1 items-center">
                            <Image
                                src={FeatherIcon}
                                alt=""
                                aria-hidden="true"
                                className="size-5"
                            />
                            <span aria-hidden="true">{npc.stats.initiative > 0 ? `+${npc.stats.initiative}` : npc.stats.initiative}</span>
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
                    <CharacterHealthBar currentHP={npc.stats.currentHitPoints} maxHP={npc.stats.maxHitPoints} tempHP={npc.stats.tempHitPoints} />
                    <div className="text-lg px-2">
                        <span>
                            Dés de point de Vie :
                        </span>
                        {npc.hitPointsRoll && (
                            <span className="font-bold"> {npc.hitPointsRoll}</span>
                        )}
                    </div>
                </Card >
                {/* Jet de sauvegarde */}
                <div className="flex flex-col w-1/4 gap-2">
                    <Card
                        className="gap-2 py-4 px-4 md:px-6"
                        role="region"
                        aria-labelledby="saving-throws-heading">
                        <h2
                            id="saving-throws-heading"
                            className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
                            Jets de sauvegarde
                        </h2>
                    </Card>
                    <div
                        className="grid grid-cols-1 xl:grid-cols-2 gap-2"
                        role="list">
                        {npc?.stats &&
                            Object.entries(npc?.stats?.savingThrows).map(([key, value]) => {
                                const abilityName = `${key}`;
                                const abilityScore = npc?.stats?.abilityScores[key as keyof typeof npc.stats.abilityScores] || 0;
                                const valeurCalculer = Math.floor((abilityScore - 10) / 2);
                                return (
                                    <Skill
                                        key={key}
                                        skillName={abilityName}
                                        value={value > 0 ? 2 : 0}
                                        accentColor={accentColor}
                                        skills={value > 0 ? value : valeurCalculer}
                                    />
                                );
                            })}
                    </div>
                </div>
                <Card className='gap-2 md:gap-4 w-1/2 h-fit'>
                    <h2 className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
                        Capacités et traits
                    </h2>
                    <Accordion
                        type="single"
                        collapsible
                        className="w-full">
                        {npc?.abilities.map((ability, index) => (
                            <AccordionItem
                                key={ability.name}
                                value={ability.name}>
                                <AccordionTrigger
                                    className="text-left hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 py-3"
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
            </div>
            <div className="grid grid-cols-3 gap-2 md:gap-4 w-full">
                <ActionSection
                    title="Actions"
                    actions={npc.actions.standard}
                    accentColor={accentColor}
                />
                <ActionSection
                    title="Actions Légendaires"
                    actions={npc.actions.legendary}
                    accentColor={accentColor}
                />
                <ActionSection
                    title="Actions de repère"
                    actions={npc.actions.lair}
                    accentColor={accentColor}
                />
            </div>
        </div >
    )
}

export default BattleNPCTabContent
