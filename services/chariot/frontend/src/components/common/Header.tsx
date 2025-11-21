import { useTranslations } from "next-intl";
import { Button } from "../ui/button";
import { ICampaign } from "@/models/campaigns/ICampaign";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import LocaleSwitcher from "@/components/locale/LocaleSwitcher";
import { useParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import jwt from "jsonwebtoken";
import AuthService from "@/services/authService";
import { IUser } from "@/models/users/IUser";
import stringService from "@/services/stringService";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRouter } from "next/navigation";

interface HeaderProps {
  campaign: ICampaign | null;
  battle?: boolean;
}

export function Header({ campaign, battle }: HeaderProps) {
  const t = useTranslations("Header");
  const router = useRouter();

  const [user, setUser] = useState<IUser>();

  const getProfile = useCallback(
    async (id: string) => {
      try {
        let response = await AuthService.profile(id);
        if (!response.data) {
          logout();
          return;
        }
        setUser(response.data);
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    },
    [router],
  );

  const logout = () => {
    document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/auth/login");
  };

  useEffect(() => {
    const token: string | undefined = document.cookie
      .split("; ")
      .find((row) => row.startsWith("accessToken="))
      ?.split("=")[1];
    const userId: string = jwt.decode(token ?? "")?.sub as string;

    getProfile(userId);
  }, []);

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
          {user && (
            <Popover>
              <PopoverTrigger asChild>
                <Avatar className="cursor-pointer">
                  <AvatarFallback className="bg-background text-foreground border">
                    {stringService.getInitials(user.username)}
                  </AvatarFallback>
                </Avatar>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2 mr-5">
                <a
                  onClick={logout}
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
