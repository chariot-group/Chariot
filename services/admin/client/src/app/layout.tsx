import type { Metadata } from "next";
import { Inter_Tight, Geist } from "next/font/google";
import "@/app/globals.css";
import { KeycloakProvider } from "@/providers/KeycloakProvider";
import { SidebarProvider } from "@/providers/SidebarContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdminGuard from "@/components/AdminGuard";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chariot — Admin Paiements",
  description: "Dashboard d'administration des paiements Chariot",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={cn("font-sans", geist.variable)}>
      <body className={`${interTight.variable} antialiased font-sans dark`}>
        <KeycloakProvider>
          <AdminGuard>
            <SidebarProvider>
              <div className="flex h-screen overflow-hidden">
                <Sidebar />
                <div className="flex flex-1 flex-col overflow-hidden min-w-0">
                  <Header />
                  <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
                </div>
              </div>
            </SidebarProvider>
          </AdminGuard>
        </KeycloakProvider>
        <ToastContainer
          position="bottom-right"
          theme="dark"
          autoClose={3500}
          hideProgressBar={false}
          newestOnTop
        />
      </body>
    </html>
  );
}
