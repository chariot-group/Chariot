"use client";

import Sidebar from "@/components/layout/Sidebar";
import Profile from "./Profile";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6">
          <Profile />

          {children}
        </main>
      </div>
    </div>
  );
}
