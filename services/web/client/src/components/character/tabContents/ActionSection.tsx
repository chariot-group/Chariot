import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Action } from "@/types/character";
import { useTranslations } from "next-intl";

interface ActionSectionProps {
    title: string;
    actions: Action[];
    accentColor: string;
}

const ActionSection = ({ title, actions, accentColor }: ActionSectionProps) => {
    const t = useTranslations("characterDetail.combat");
    
    if (actions.length === 0) return null;

    return (
        <div className="flex flex-col gap-2 w-full">
            <Card className='gap-2 h-fit'>
                <h2 className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
                    {title}
                </h2>
            </Card>
            <Accordion
                type="single"
                collapsible
                className="w-full flex flex-col gap-2">
                {actions.map((action, index) => (
                    <AccordionItem
                        key={index}
                        value={action.name}
                        className="flex flex-col gap-2">
                        <Card className="gap-2 p-0 flex-col">
                            <AccordionTrigger
                                className="py-3 px-3 md:py-4 md:px-6"
                                aria-label={`${t("actionDetails")} ${action.name}`}>
                                <span className="text-base md:text-lg font-medium text-left">
                                    {action.name}{action.type && ` (${action.type})`}
                                </span>
                            </AccordionTrigger>
                        </Card>
                        <AccordionContent>
                            <div className="flex flex-wrap gap-2 items-start">
                                <Card className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2 py-3 px-3 md:py-4 md:px-6">
                                    <span className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>
                                        {t("attackDC")}
                                    </span>
                                    <span className="text-sm md:text-base">
                                        {action.attackBonus ? `+${action.attackBonus}` : '-'}
                                    </span>
                                </Card>
                                <Card className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2 py-3 px-3 md:py-4 md:px-6">
                                    <span className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>
                                        {t("damageType")}
                                    </span>
                                    <span className="text-sm md:text-base">
                                        {action.damage && action.damage.length > 0
                                            ? action.damage.map((d, i) => (
                                                <span key={i}>{d.dice} {d.type}{i < action.damage!.length - 1 ? ' + ' : ''}</span>
                                            ))
                                            : '-'
                                        } {action.range && `(${action.range})`}
                                    </span>
                                </Card>
                                {action.description && (
                                    <Card className="flex flex-col gap-2 py-3 px-3 md:py-4 md:px-6 w-full">
                                        <span className={`${accentColor} font-semibold text-sm md:text-base`}>
                                            {t("description")}
                                        </span>
                                        <span className="text-sm md:text-base italic">
                                            {action.description}
                                        </span>
                                    </Card>
                                )}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
};

export default ActionSection;
