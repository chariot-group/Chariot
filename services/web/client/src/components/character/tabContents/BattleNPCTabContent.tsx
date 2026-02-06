import { Card } from "@/components/ui/card";
import { NPC } from "@/types/character";
import Image from "next/image";
import ShieldIcon from "@public/assets/icons/shield-icon.svg";
import CharacterHealthBar from "@/components/character/CharacterHealthBar";
import Skill from "@/components/character/tabContents/general/Skill";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ActionSection from "@/components/character/tabContents/ActionSection";

interface Props {
    npc: NPC;
    accentColor: string;
}

const BattleNPCTabContent = ({ npc, accentColor }: Props) => {

    return (
        <div className="w-full flex flex-col gap-4 items-start">
            <div className="flex flex-row gap-4 w-full">
                <Card className='gap-2 w-1/4 h-fit'>
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
                {/* Jet de sauvegarde */}
                <div className="flex flex-col w-1/4 gap-3">

                    <Card
                        className="gap-3 py-4 px-4 md:px-6"
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
                <Card className='gap-2 w-1/2 rounded-xl h-fit'>
                    <h2 className={`text-2xl sm:text-3xl font-semibold ${accentColor}`}>
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
            </div>
            <div className="flex flex-col gap-4 w-full">
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
