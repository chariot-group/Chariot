import { Card } from "@/components/ui/card";
import { Player } from "@/types/character";
import { User } from "lucide-react";
import Image from "next/image";
import { useEffect } from "react";

interface PlayerGeneralTabContentProps {
  player: Player;
  accentColor: string;
}

export default function PlayerGeneralTabContent({ player, accentColor }: PlayerGeneralTabContentProps) {
  useEffect(() => {
    // Any side effects or data fetching can be handled here
    console.log(player);
  }, [player]);

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <Card
          className="flex flex-col xl:flex-row overflow-hidden gap-2 p-3"
          role="region"
          aria-labelledby="profile-info-heading">
          <div
            className="relative w-full xl:w-1/2 aspect-video"
            role="img"
            aria-label={
              player?.firstname ? `${player.firstname} ${player.lastname} profile picture` : "Default profile picture"
            }>
            {player?.avatar === null || player?.avatar === undefined ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-middle-light rounded-[15px]">
                <User
                  className="h-16 w-16"
                  aria-hidden="true"
                />
              </div>
            ) : (
              <Image
                fill
                className="object-cover rounded-[15px] bg-gray-middle-light"
                src={player?.avatar || "/default-avatar.png"}
                alt=""
                priority
                sizes="(max-width: 640px) 100vw, 50vw"
              />
            )}
          </div>
          <div className="flex flex-col w-full xl:w-1/2">
            <p
              className={`text-3xl font-bold wrap-break-word ${accentColor}`}
              aria-label="Username">
              {player?.firstname} {player?.lastname}
            </p>
            <p
              className="text-2xl font-semibold wrap-break-word"
              aria-label="Full name">
              {player?.surname}
            </p>
          </div>
        </Card>
        <Card className="gap-2 p-3">
          <h2 className={`text-2xl font-semibold ${accentColor}`}>Personnage</h2>
          <div className="flex flex-col">
            <p className="text-sm">
              <strong>Race :</strong> {player?.profile?.race}
            </p>
            <p className="text-sm">
              <strong> Niveau global:</strong> {player?.progression?.level ?? 0} ({player?.progression?.experience ?? 0}{" "}
              XP)
            </p>
            <p className="text-sm">
              <strong>Classe(s) :</strong> {player?.class.map((c) => c.name + " Niv " + c.level).join(" / ")}
            </p>
            {player?.class.map((c) => (
              <p
                key={c.name}
                className="text-sm">
                <strong>Sous classe de {c.name} :</strong> {c.subclass}
              </p>
            ))}
          </div>
        </Card>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-2">
          {/* Historique */}
          <Card className="gap-2">
            <h2 className={`text-2xl font-semibold ${accentColor}`}>Historique</h2>
          </Card>
          {/* Alignement */}
          <Card className="gap-2 p-3 flex-row items-center">
            <h2 className={`text-2xl font-semibold ${accentColor}`}>Alignement</h2>
            <p className="font-semibold">{player?.profile?.alignment}</p>
          </Card>
          {/* Maitrise */}
          <Card className="gap-2">
            <h2 className={`text-2xl font-semibold ${accentColor}`}>Maitrise</h2>
            <div className="flex flex-col gap-0">
              <p className="text-sm">
                <strong>Langue(s):</strong> {player?.stats?.languages.join(", ")}
              </p>
              <p className="text-sm">
                <strong>Outil(s):</strong> {player?.stats?.tools.join(", ")}
              </p>
              <p className="text-sm">
                <strong>Arme(s):</strong> {player?.stats?.weapons.join(", ")}
              </p>
              <p className="text-sm">
                <strong>Armure(s):</strong> {player?.stats?.armors.join(", ")}
              </p>
            </div>
          </Card>
        </div>
        <div>
          <Card className="gap-2 md:gap-4">
            <h2 className={`text-xl md:text-2xl font-semibold ${accentColor}`}>Description</h2>
          </Card>
        </div>
        <div className="flex flex-col gap-2">
          <Card className="p-3">
            <h2 className={`text-xl md:text-2xl font-semibold ${accentColor}`}>Compétences</h2>
          </Card>
          <div className="grid grid-cols-2 gap-1">
            {player?.stats?.masteries &&
              Object.entries(player.stats.masteries).map(([key, value]) => (
                <Card
                  key={key}
                  className="p-2">
                  <p className="text-sm">
                    <strong>{key}:</strong> {value}
                  </p>
                </Card>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
