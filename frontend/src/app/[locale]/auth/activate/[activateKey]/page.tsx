"use client";
import LocaleSwitcher from "@/components/locale/LocaleSwitcher";
import ActiveAccount from "@/components/modules/activateAccount/activateAccount";
import { Card } from "@/components/ui/card";
import { useParams } from "next/navigation";

export default function ActivatePage() {
  const { activateKey } = useParams();

  return (
    <div className="w-full h-[100dvh] justify-center gap-1 flex flex-col items-center bg-background">
      <Card className="w-[40%] shadow-md relative">
        <LocaleSwitcher className="absolute right-0 border-none shadow-none m-1 bg-card" />
        <ActiveAccount activateKey={activateKey as string} />
      </Card>
    </div>
  );
}
