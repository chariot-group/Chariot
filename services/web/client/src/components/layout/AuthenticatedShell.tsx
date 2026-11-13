"use client";

import { Suspense, type ReactNode } from "react";
import ReduxProvider from "@/providers/ReduxProvider";
import ToastContainer from "@/components/ToastContainer";
import LocaleDetector from "@/components/LocaleDetector";
import AccountLocaleSync from "@/components/AccountLocaleSync";
import CampaignContextUrlSync from "@/components/CampaignContextUrlSync";
import PostLoginNavigator from "@/components/PostLoginNavigator";
import ReleaseNotesProvider from "@/components/ReleaseNotesProvider";
import SessionCharacterSyncClientDynamic from "@/components/SessionCharacterSyncClientDynamic";
import SessionLobbyDialogDynamic from "@/components/dialogs/SessionLobbyDialogDynamic";
import SessionJoinParamListener from "@/components/SessionJoinParamListener";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export interface AuthenticatedShellProps {
  children: ReactNode;
}

/**
 * Application shell rendered once Keycloak has authenticated the user. Loaded on demand by
 * `AuthenticatedShellGate` so none of it is part of the initial JS of a `/[locale]` route.
 * Composition and mount order are unchanged from the former root layout (session clients
 * still mount only after authentication — FR-session-websocket-lifecycle).
 * @see FR-web-first-load-performance (Slow-network authentication round trip, requirement 11)
 */
export default function AuthenticatedShell({ children }: AuthenticatedShellProps) {
  return (
    <ReduxProvider>
      <SessionCharacterSyncClientDynamic />
      <SessionLobbyDialogDynamic />
      <Suspense>
        <SessionJoinParamListener />
      </Suspense>
      <SidebarProvider className="h-dvh min-h-0 overflow-hidden">
        <AppSidebar />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden relative">
          <PostLoginNavigator />
          <ReleaseNotesProvider />
          <LocaleDetector />
          <AccountLocaleSync />
          <CampaignContextUrlSync />
          <ToastContainer />
          <Header />

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
        </div>
      </SidebarProvider>
    </ReduxProvider>
  );
}
