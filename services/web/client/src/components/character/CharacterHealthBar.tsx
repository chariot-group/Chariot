import Image from 'next/image'
import HeartIcon from "@public/assets/icons/heart-icon.svg";
import { Skull } from 'lucide-react';

interface CharacterHealthBarProps {
    currentHP: number
    maxHP: number
    tempHP: number
}

const CharacterHealthBar = ({
    currentHP,
    maxHP,
    tempHP,
}: CharacterHealthBarProps) => {
    const isFullWithTemp = currentHP === maxHP && tempHP > 0
    const visualMax = isFullWithTemp ? maxHP + tempHP : maxHP

    const redPercent = (currentHP / visualMax) * 100

    const yellowPercent =
        tempHP > 0
            ? Math.min(100 - redPercent, (tempHP / visualMax) * 100)
            : 0

    return (
        <div className="relative h-9 bg-white border border-black rounded-full overflow-hidden">
            {/* HP temporaires */}
            {yellowPercent > 0 && (
                <>
                    <div
                        className="absolute inset-y-0 left-0 bg-yellow transition-all duration-300 rounded-full"
                        style={{ width: `${redPercent + 10}%` }}
                    />
                    <div
                        className="absolute inset-y-0 bg-yellow transition-all duration-300 rounded-r-full"
                        style={{
                            left: `${redPercent}%`,
                            width: `${yellowPercent}%`,
                        }}
                    />
                </>
            )}

            {/* HP actuels */}
            <div
                className="absolute inset-y-0 left-0 bg-red transition-all duration-300 rounded-full"
                style={{ width: `${redPercent}%` }}
            />


            {/* OVERLAY UI */}
            <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
                {currentHP > 0 || tempHP > 0 ? (
                    <Image
                        src={HeartIcon}
                        alt=""
                        aria-hidden="true"
                        className="size-6 sm:size-7"
                    />
                ) : (
                    <Skull size={32} className='text-black' />
                )}

                <div className="font-bold text-xl text-black">
                    {currentHP}/{maxHP}
                </div>

                <div className="text-xl font-medium text-black">
                    {tempHP > 0 ? `+${tempHP}PV` : ''}
                </div>
            </div>
        </div>
    )
}

export default CharacterHealthBar