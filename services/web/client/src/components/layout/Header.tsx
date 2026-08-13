"use client";

import Profile from "@/components/layout/Profile";
import SessionCommunityLibraryButton from "@/components/layout/SessionCommunityLibraryButton";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import Logo from "@public/logo.svg";
import { SidebarTrigger } from "@/components/ui/sidebar";
import React from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { openSessionLobby, selectIsInSession } from "@/store/slices/sessionSlice";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { resolveHeaderLogoClickIntent, resolveSessionLiveTone } from "@/lib/sessionPresenceUi";
import { useSessionRemainingSeconds } from "@/hooks/useSessionRemainingSeconds";
import { cn } from "@/lib/utils";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const locale = pathname.split("/")[1] || "fr";
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION;
  const t = useTranslations("header");
  const tSessionTime = useTranslations("sessionTime");
  const isInSession = useAppSelector(selectIsInSession);
  const remainingSeconds = useSessionRemainingSeconds();
  const logoIntent = resolveHeaderLogoClickIntent(isInSession);
  const liveTone = resolveSessionLiveTone(remainingSeconds);

  const logoAriaLabel =
    logoIntent === "openSessionLobby"
      ? liveTone === "critical"
        ? t("logoAriaLabelInSessionCritical")
        : liveTone === "warning"
          ? t("logoAriaLabelInSessionWarning")
          : t("logoAriaLabelInSession")
      : t("logoAriaLabelHome");

  const handleLogoClick = () => {
    if (logoIntent === "openSessionLobby") {
      dispatch(openSessionLobby());
      return;
    }

    router.push(`/${locale}/welcome`);
  };

  const logoButton = (
    <button
      type="button"
      onClick={handleLogoClick}
      aria-label={logoAriaLabel}
      aria-haspopup={logoIntent === "openSessionLobby" ? "dialog" : undefined}
      className="relative cursor-pointer border-none bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-[15px]">
      <Image
        src={Logo}
        alt=""
        width={70}
        height={70}
        className="h-16 w-16 sm:h-20 sm:w-20 md:h-22.5 md:w-22.5"
        priority
      />
      {logoIntent === "openSessionLobby" ? (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-[14%] right-[18%] size-2 rounded-full ring-1 ring-background motion-reduce:animate-none",
            liveTone === "warning" && "bg-yellow motion-safe:animate-session-warning",
            liveTone === "critical" && "bg-red motion-safe:animate-session-critical",
            liveTone === "live" && "bg-red motion-safe:animate-session-live",
          )}
        />
      ) : null}
    </button>
  );

  return (
    <React.Fragment>
      {process.env.NEXT_PUBLIC_ENV_NAME === "integration" && (
        <div className="w-full shrink-0 bg-yellow-500 text-black text-center py-2 px-4 font-semibold text-sm">
          ⚠️ ENVIRONNEMENT D&apos;INTEG v{appVersion}
        </div>
      )}
      <header className="w-full shrink-0 flex flex-row justify-between items-center px-2 sm:px-4 z-10">
        <SidebarTrigger className="self-start mt-1" />
        {logoIntent === "openSessionLobby" ? (
          <Tooltip>
            <TooltipTrigger asChild>{logoButton}</TooltipTrigger>
            <TooltipContent className="max-w-xs sm:max-w-sm">
              {tSessionTime("tooltip")}
              {liveTone === "warning" ? ` ${tSessionTime("tooltipWarning")}` : null}
              {liveTone === "critical" ? ` ${tSessionTime("tooltipCritical")}` : null}
            </TooltipContent>
          </Tooltip>
        ) : (
          logoButton
        )}
        <div className="relative flex items-center gap-3">
          <SessionCommunityLibraryButton />
          <Profile />
        </div>
      </header>
    </React.Fragment>
  );
}
