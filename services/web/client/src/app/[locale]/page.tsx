"use client";

import dynamic from "next/dynamic";

/**
 * Loaded on demand: the locale root is where Keycloak sends users back, and its logic needs the
 * store and API services, which belong to the authenticated shell — not to the auth gate.
 * @see FR-web-first-load-performance (Slow-network authentication round trip, requirement 11)
 */
const RootPageContent = dynamic(() => import("@/components/home/RootPageContent"), {
  ssr: false,
  loading: () => null,
});

export default function Home() {
  return <RootPageContent />;
}
