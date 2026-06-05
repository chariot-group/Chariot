"use client";

import dynamic from "next/dynamic";

const SessionCharacterSyncClient = dynamic(
  () => import("@/components/SessionCharacterSyncClient"),
  { ssr: false, loading: () => null },
);

const SessionBattleSyncClient = dynamic(
  () => import("@/components/SessionBattleSyncClient"),
  { ssr: false, loading: () => null },
);

export default function SessionCharacterSyncClientDynamic() {
  return (
    <>
      <SessionCharacterSyncClient />
      <SessionBattleSyncClient />
    </>
  );
}
