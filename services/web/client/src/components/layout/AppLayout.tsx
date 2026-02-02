"use client";

import Sidebar from "@/components/layout/Sidebar";
import Profile from "./Profile";
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
        <main className="flex-1 pl-6 pt-0 min-h-screen">
          <header className="w-full flex justify-center items-center px-4 py-2 relative">
            <Image
              src={Logo}
              alt="Chariot"
              width={90}
              height={90}
              priority
            />
            <div className="absolute right-4">
              <Profile />
            </div>
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}
