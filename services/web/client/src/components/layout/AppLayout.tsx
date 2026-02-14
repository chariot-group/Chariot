"use client";

import Sidebar from "@/components/layout/Sidebar";
import Profile from "@/components/layout/Profile";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import NavigationService from "@/services/NavigationService";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

import Logo from "@public/logo.svg";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.split("/")[1] || "fr";
  const dispatch = useAppDispatch();
  const getState = useAppSelector((state) => state);

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
    <div className="min-h-screen flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <main className="flex-1 xl:pl-6 pt-0 min-h-screen">
          <header className="w-full flex justify-center items-center px-2 sm:px-4 relative">
            <button onClick={handleLogoClick} className="cursor-pointer bg-transparent border-none p-0">
              <Image
                src={Logo}
                alt="Chariot"
                width={70}
                height={70}
                className="w-16 h-16 sm:w-20 sm:h-20 md:w-22.5 md:h-22.5"
                priority
              />
            </button>
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
