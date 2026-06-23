"use client";

import dynamic from "next/dynamic";

const SessionLobbyDialog = dynamic(
  () => import("@/components/dialogs/SessionLobbyDialog").then((m) => ({ default: m.SessionLobbyDialog })),
  { ssr: false },
);

export default function SessionLobbyDialogDynamic() {
  return <SessionLobbyDialog />;
}
