"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAppSelector } from "@/store/hooks";
import { selectCampaigns } from "@/store/slices/campaignSlice";
import Token from "@public/assets/token.svg";
import Image from "next/image";
import { useParams } from "next/navigation";

export default function SessionPage() {
  const { idCampaign } = useParams<{ idCampaign: string }>();
  const campaigns = useAppSelector(selectCampaigns);
  const campaign = campaigns.find((c) => c._id === idCampaign);

  return (
    <main
      className="flex flex-col min-h-dvh"
      aria-label={`Session - ${campaign?.label ?? "Campagne"}`}>
      <div className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        {/* Players section */}
        <section
          aria-labelledby="players-heading"
          className="lg:col-span-3 flex flex-col gap-4">
          <Card className="flex flex-col gap-4 p-4 sm:p-6">
            <h1
              id="players-heading"
              className="text-xl sm:text-2xl font-bold">
              Session
              <span className="font-normal"> - {campaign?.label}</span>
            </h1>

            <div
              role="list"
              aria-label="Liste des joueurs"
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto scroll-smooth focus-visible:outline-none [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-400/60 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-50 [&::-webkit-scrollbar-thumb]:rounded-full"
              tabIndex={0}>
              {[
                "Hugo PIEDANNA",
                "Hugo PIEDANNA",
                "Hugo PIEDANNA",
                "Hugo PIEDANNA",
                "Hugo PIEDANNA",
                "Hugo PIEDANNA",
                "Hugo PIEDANNA",
                "Hugo PIEDANNA",
                "Hugo PIEDANNA",
                "Hugo PIEDANNA",
                "Hugo PIEDANNA",
                "Hugo PIEDANNA",
                "Hugo PIEDANNA",
                "Hugo PIEDANNA",
                "Hugo PIEDANNA",
                "Hugo PIEDANNA",
                "Hugo PIEDANNA",
                "Hugo PIEDANNA",
              ].map((name, index) => (
                <Card
                  key={index}
                  role="listitem"
                  className="border bg-gray border-none gap-0 p-3">
                  <span className="text-sm font-bold">{name}</span>
                  <span className="text-sm text-muted-foreground">Joueur {index + 1}</span>
                </Card>
              ))}
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline">Quitter la session</Button>
              <Button aria-label="Ajouter un token (0 sur 5 disponibles)">
                <span className="flex items-center gap-1.5">
                  Ajouter un token : 0/5
                  <Image
                    src={Token}
                    alt=""
                    aria-hidden="true"
                    className="w-3 h-3 sm:w-4 sm:h-4"
                  />
                </span>
              </Button>
            </div>
          </Card>
        </section>

        {/* Session code section */}
        <aside
          aria-labelledby="session-code-heading"
          className="lg:col-span-1">
          <Card className="flex flex-col gap-0 p-4 sm:p-6">
            <h2
              id="session-code-heading"
              className="text-base sm:text-lg font-bold mb-4">
              Code de la session
            </h2>
            <p
              className="w-full text-xl text-center"
              aria-label="Code de session : 555 555">
              555 - 555
            </p>
            <Button
              variant="outline"
              className="w-full mt-4"
              aria-label="Copier le code de la session dans le presse-papier">
              Copier le code
            </Button>
          </Card>
        </aside>
      </div>
    </main>
  );
}
