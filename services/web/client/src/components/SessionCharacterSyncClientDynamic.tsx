"use client";

import dynamic from "next/dynamic";

const SessionCharacterSyncClient = dynamic(
  () => import("@/components/SessionCharacterSyncClient"),
  { ssr: false, loading: () => null },
);

export default function SessionCharacterSyncClientDynamic() {
  return <SessionCharacterSyncClient />;
}
