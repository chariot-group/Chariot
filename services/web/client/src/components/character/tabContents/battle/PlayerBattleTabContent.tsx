import { Card } from "@/components/ui/card";
import { Player } from "@/types/character";
import Image from "next/image";
import { useTranslations } from "next-intl";
import ShieldIcon from "@public/assets/icons/shield-icon.svg";
import FeatherIcon from "@public/assets/icons/feather-icon.svg";
import RunningIcon from "@public/assets/icons/running-icon.svg";
import CharacterHealthBar from "@/components/character/CharacterHealthBar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import RedCircle from "@public/assets/icons/red-circle.svg";
import WhiteCircle from "@public/assets/icons/white-circle.svg";
import Skill from "@/components/character/tabContents/general/Skill";
import { Bird, Mountain, Shovel, Waves } from "lucide-react";
import ActionSection from "@/components/character/tabContents/battle/ActionSection";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
    player: Player;
    accentColor: string;
}

const PlayerBattleTabContent = ({ player, accentColor }: Props) => {
    const t = useTranslations("characterDetail.combat");
    const tAbilities = useTranslations("characterDetail.player.general.abilities");

    // Configuration des badges de statistiques
    const speedBadges = [
        { key: 'walk', value: player.stats.speed.walk, icon: <Image src={RunningIcon} alt="" aria-hidden="true" className="size-6" />, tooltipKey: 'walkSpeedTooltip' },
        { key: 'climb', value: player.stats.speed.climb, icon: <Mountain size={24} className='text-black' aria-hidden="true" />, tooltipKey: 'climbSpeedTooltip' },
        { key: 'swim', value: player.stats.speed.swim, icon: <Waves size={24} className='text-black' aria-hidden="true" />, tooltipKey: 'swimSpeedTooltip' },
        { key: 'fly', value: player.stats.speed.fly, icon: <Bird size={24} className='text-black' aria-hidden="true" />, tooltipKey: 'flySpeedTooltip' },
        { key: 'burrow', value: player.stats.speed.burrow, icon: <Shovel size={24} className='text-black' aria-hidden="true" />, tooltipKey: 'burrowSpeedTooltip' },
    ];

    function isMastered(skill: string): boolean {
        return player.stats.masteriesAbility[skill as keyof typeof player.stats.masteriesAbility] === true;
    }

    return (
        <div className="w-full flex flex-col gap-4 items-start">
            <div className="grid grid-cols-4 max-[376px]:grid-cols-1 gap-3 md:gap-4 w-full">
                {/* Statistiques */}
                <Card
                    className='gap-3 p-4 md:px-6 col-span-2 lg:col-span-1 h-fit'
                    role="region"
                    aria-labelledby="stats-heading">
                    <h2
                        id="stats-heading"
                        className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
                        {t("stats")}
                    </h2>
                    <div className="flex flex-row justify-start gap-2 text-xl font-extrabold flex-wrap">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div
                                    className="bg-white text-black flex flex-row justify-center gap-1 rounded-full p-2 items-center cursor-help focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    tabIndex={0}
                                    role="img"
                                    aria-label={`${t("armorClass")} ${player.stats.armorClass}`}>
                                    <Image
                                        src={ShieldIcon}
                                        alt=""
                                        aria-hidden="true"
                                        className="size-5"
                                    />
                                    <span aria-hidden="true">{player.stats.armorClass}</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                {t("armorClassTooltip")}
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div
                                    className="bg-white text-black flex flex-row justify-center gap-1 rounded-full p-2 items-center cursor-help focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    tabIndex={0}
                                    role="img"
                                    aria-label={`${t("initiativeTooltip")} ${player.stats.initiative > 0 ? `+${player.stats.initiative}` : player.stats.initiative}`}>
                                    <Image
                                        src={FeatherIcon}
                                        alt=""
                                        aria-hidden="true"
                                        className="size-5"
                                    />
                                    <span aria-hidden="true">{player.stats.initiative > 0 ? `+${player.stats.initiative}` : player.stats.initiative}</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                {t("initiativeTooltip")}
                            </TooltipContent>
                        </Tooltip>
                        {speedBadges.map((badge) =>
                            badge.value && (
                                <Tooltip key={badge.key}>
                                    <TooltipTrigger asChild>
                                        <div
                                            className="bg-white text-black flex flex-row justify-center gap-1 rounded-full p-2 items-center cursor-help focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            tabIndex={0}
                                            role="img"
                                            aria-label={`${t(badge.tooltipKey as any)} ${badge.value} feet`}>
                                            {badge.icon}
                                            <span aria-hidden="true">{badge.value}ft</span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {t(badge.tooltipKey as any)}
                                    </TooltipContent>
                                </Tooltip>
                            )
                        )}
                    </div>
                    <CharacterHealthBar currentHP={player.stats.currentHitPoints} maxHP={player.stats.maxHitPoints} tempHP={player.stats.tempHitPoints} />
                    <div className="text-lg px-2">
                        <span>
                            {t("hitDice")}
                        </span>
                        {player.class.map((c, i) => (
                            <span key={c.name}>{i === 0 ? ' ' : ' + '}<span className="font-bold">{c.level}d{c.hitDice}</span>{` (${c.name})`}</span>
                        ))}
                    </div>
                </Card >

                {/* Jet de sauvegarde */}
                <div className="flex flex-col gap-2 col-span-2 2xl:col-span-1">
                    <Card
                        className="gap-3 p-4 md:px-6 h-fit"
                        role="region"
                        aria-labelledby="saving-throws-heading">
                        <h2
                            id="saving-throws-heading"
                            className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
                            {t("savingThrows")}
                        </h2>
                    </Card>
                    <div
                        className="grid max-[376px]:grid-cols-2 grid-cols-1 lg:grid-cols-2 gap-2"
                        role="list">
                        {player?.stats &&
                            Object.entries(player?.stats?.savingThrows).map(([key, value]) => {
                                const isMasteredKey = isMastered(key);
                                const abilityName = tAbilities(key as any);
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

                {/* Jets de sauvegarde contre la mort */}
                <Card
                    className='gap-3 p-4 md:px-6 rounded-xl h-fit col-span-3 md:col-span-2 lg:col-span-1 items-end'
                    role="region"
                    aria-labelledby="death-saves-heading">
                    <h2
                        id="death-saves-heading"
                        className={`text-xl sm:text-2xl font-semibold self-start ${accentColor}`}>
                        {t("deathSaves")}
                    </h2>
                    <div className=" grid grid-cols-2 gap-2 items-center w-full">
                        <span>{t("successes")}</span>
                        <div
                            className="grid grid-cols-3 w-2/3 lg:w-4/5"
                            role="status"
                            aria-label={`${t("successes")} ${player.deathSaves.successes} ${t("unperformedThrow")}`}>
                            {Array.from({ length: 3 }).map((_, index) => (
                                <Image
                                    key={"death-save-success-" + index}
                                    src={index < player.deathSaves.successes ? RedCircle : WhiteCircle}
                                    alt=""
                                    width={20}
                                    height={20}
                                    className="shrink-0"
                                    aria-hidden="true"
                                />))}
                        </div>
                        <span>{t("failures")}</span>
                        <div
                            className="grid grid-cols-3 w-2/3 lg:w-4/5"
                            role="status"
                            aria-label={`${t("failures")} ${player.deathSaves.failures} ${t("unperformedThrow")}`}>
                            {Array.from({ length: 3 }).map((_, index) => (
                                <Image
                                    key={"death-save-failure-" + index}
                                    src={index < player.deathSaves.failures ? RedCircle : WhiteCircle}
                                    alt=""
                                    width={20}
                                    height={20}
                                    className="shrink-0"
                                    aria-hidden="true"
                                />))}
                        </div>
                    </div>
                </Card >
            </div>
            <div className="grid lg:grid-cols-2 gap-2 w-full">
                {/* Capacités et traits */}
                <Card
                    className='gap-3 p-4 md:px-6 rounded-xl h-fit'
                    role="region"
                    aria-labelledby="abilities-traits-heading">
                    <h2
                        id="abilities-traits-heading"
                        className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
                        {t("abilitiesAndTraits")}
                    </h2>
                    <Accordion
                        type="single"
                        collapsible
                        className="w-full">
                        {player?.abilities.map((ability, index) => (
                            <AccordionItem
                                key={`${ability.name}-${index}`}
                                value={`${ability.name}-${index}`}>
                                <AccordionTrigger
                                    className="text-left hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md py-3 px-2"
                                    aria-label={`${t("details")} ${ability.name}`}>
                                    <span className="text-sm sm:text-base font-medium">{ability.name}</span>
                                </AccordionTrigger>
                                <AccordionContent
                                    className="text-sm sm:text-base pb-3 pt-1"
                                    role="region"
                                    aria-label={`${t("descriptionPrefix")} ${ability.name}`}>
                                    {ability.description}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </Card >
                <div className="flex flex-row gap-2">
                    {/* Actions */}
                    <ActionSection
                        title={t("actions")}
                        actions={player.actions}
                        accentColor={accentColor}
                    />
                </div>

            </div>
        </div>
    )
}

export default PlayerBattleTabContent
