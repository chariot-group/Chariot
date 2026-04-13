"use client";

import Profile from "@/components/layout/Profile";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import NavigationService from "@/services/NavigationService";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

import Logo from "@public/logo.svg";
import { SidebarTrigger } from "@/components/ui/sidebar";
import React from "react";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.split("/")[1] || "fr";
  const dispatch = useAppDispatch();
  const getState = useAppSelector((state) => state);
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION;

  const handleLogoClick = async () => {
    try {
      const destination = await NavigationService.determinePostLoginDestination(locale, dispatch, () => getState);
      router.push(destination.path);
    } catch (error) {
      console.error("Failed to determine post-login destination:", error);
      // Fallback vers welcome en cas d'erreur
      router.push(`/${locale}/welcome`);
    }
  };

  return (
    <React.Fragment>
      {process.env.NEXT_PUBLIC_ENV_NAME === "integration" && (
        <div className="w-full bg-yellow-500 text-black text-center py-2 px-4 font-semibold text-sm">
          ⚠️ ENVIRONNEMENT D'INTEG v{appVersion}
        </div>
      )}
      <header className="w-full flex flex-row justify-between items-center px-2 sm:px-4 z-10">
        <SidebarTrigger className="self-start mt-1" />
        <button
          onClick={handleLogoClick}
          className="cursor-pointer bg-transparent border-none p-0">
          <Image
            src={Logo}
            alt="Chariot"
            width={70}
            height={70}
            className="w-16 h-16 sm:w-20 sm:h-20 md:w-22.5 md:h-22.5"
            priority
          />
        </button>
        <Profile />
      </header>
    </React.Fragment>
  );
}
