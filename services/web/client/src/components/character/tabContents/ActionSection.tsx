import { Card } from "@/components/ui/card";
import { Action } from "@/types/character";
import React from "react";

interface ActionSectionProps {
    title: string;
    actions: Action[];
    accentColor: string;
}

const ActionSection = ({ title, actions, accentColor }: ActionSectionProps) => {
    if (actions.length === 0) return null;

    return (
        <div className="flex flex-col gap-2">
            <Card className='gap-2 h-fit rounded-full'>
                <h2 className={`text-2xl sm:text-3xl font-semibold ${accentColor}`}>
                    {title}
                </h2>
            </Card>
            <Card className='gap-2 h-fit grid grid-cols-9 rounded-full'>
                <span className={`text-xl sm:text-xl font-semibold col-start-1 col-end-3 ${accentColor}`}>
                    Nom
                </span>
                <span className={`text-xl sm:text-xl font-semibold col-start-3 col-end-4 justify-self-center ${accentColor}`}>
                    Attaque/DD
                </span>
                <span className={`text-xl sm:text-xl font-semibold col-start-4 ${accentColor}`}>
                    Dégats/Type
                </span>
                <span className={`text-xl sm:text-xl font-semibold col-start-5 ${accentColor}`}>
                    Description
                </span>
            </Card>
            {actions.map((action, index) => (
                <Card key={index} className='gap-2 h-fit grid grid-cols-9 items-center rounded-full'>
                    <span className={`text-xl sm:text-xl col-start-1 col-end-3`}>
                        {action.name}{action.type && ` (${action.type})`}
                    </span>
                    <span className={`text-xl sm:text-xl col-start-3 col-end-4 justify-self-center`}>
                        {action.attackBonus ? `+${action.attackBonus}` : '-'}
                    </span>
                    <span className={`text-xl sm:text-xl col-start-4 col-end-5 w-full justify-self-center`}>
                        {action.damage && action.damage.length > 0
                            ? action.damage.map((d, i) => (
                                <span key={i}>{d.dice} {d.type}{i < action.damage!.length - 1 ? ' + ' : ''}</span>
                            ))
                            : '-'
                        } {action.range && `(${action.range})`}
                    </span>
                    <span className={`text-xl sm:text-xl col-start-5 col-end-10 w-full`}>
                        {action.description && <div className="text-sm italic">{action.description}</div>}
                    </span>
                </Card>
            ))}
        </div>
    );
};

export default ActionSection;
