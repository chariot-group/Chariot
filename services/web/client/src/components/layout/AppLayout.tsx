"use client";

import Sidebar from "@/components/layout/Sidebar";
import Profile from "@/components/layout/Profile";
import Image from "next/image";
import { useTranslations } from "next-intl";

import Logo from "@public/logo.svg";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const t = useTranslations("AppLayout");

  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <main className="flex-1 pl-3 sm:pl-4 md:pl-6 pt-0 min-h-screen">
          <header className="w-full flex justify-center items-center px-2 sm:px-4 relative">
            <Image
              src={Logo}
              alt="Chariot"
              width={70}
              height={70}
              className="w-16 h-16 sm:w-20 sm:h-20 md:w-22.5 md:h-22.5"
              priority
            />
            <div className="absolute right-2 sm:right-4">
              <Profile />
            </div>
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}
