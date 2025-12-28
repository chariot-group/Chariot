import { useTranslations } from "next-intl";
import { Button } from "../ui/button";
import { ICampaign } from "@/models/campaigns/ICampaign";
import { useEffect, useState } from "react";
import Link from "next/link";
import LocaleSwitcher from "@/components/locale/LocaleSwitcher";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import stringService from "@/services/stringService";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRouter } from "next/navigation";
import { useKeycloak } from "@/providers/KeycloakProvider";

interface HeaderProps {
  campaign: ICampaign | null;
  battle?: boolean;
}

export function Header({ campaign, battle }: HeaderProps) {
  const t = useTranslations("Header");
  const router = useRouter();
  const { keycloak, authenticated, logout: keycloakLogout } = useKeycloak();

  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    if (authenticated && keycloak?.tokenParsed) {
      setUsername(keycloak.tokenParsed.preferred_username || "");
      setEmail(keycloak.tokenParsed.email || "");
    }
  }, [authenticated, keycloak]);

  const handleLogout = () => {
    keycloakLogout();
  };

  return (
    <header className="text-white p-4 bg-card border-b-2 border-ring shadow-md">
      <div className="flex justify-between items-center">
        {campaign && !battle && (
          <Link href={`/campaigns/${campaign._id}/battle/select`}>
            <Button>{t("launchBattle")}</Button>
          </Link>
        )}
        {battle && (
          <Link href={`/campaigns`}>
            <Button>{t("backToCampaign")}</Button>
          </Link>
        )}
        {!campaign && <div className="w-1/12"></div>}
        <div className="flex flex-col items-center">
          <Link href={"/campaigns"}>
            <h1 className="text-foreground text-2xl font-bold">{`${t("home")}`}</h1>
          </Link>
          {campaign && (
            <Link
              href={`/campaigns?search=${campaign.label}`}
              className="text-foreground hover:underline underline-offset-2">
              <p className="text-foreground">{campaign.label}</p>
            </Link>
          )}
        </div>
        <div className="flex flex-row items-center gap-4">
          <LocaleSwitcher />
          {authenticated && username && (
            <Popover>
              <PopoverTrigger asChild>
                <Avatar className="cursor-pointer">
                  <AvatarFallback className="bg-background text-foreground border">
                    {stringService.getInitials(username)}
                  </AvatarFallback>
                </Avatar>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2 mr-5">
                <a
                  onClick={handleLogout}
                  className="hover:underline underline-offset-4 cursor-pointer">
                  {t("signout")}
                </a>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    </header>
  );
}
