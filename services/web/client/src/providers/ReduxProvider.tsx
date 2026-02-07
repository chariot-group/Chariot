"use client";

import { useRef, useEffect, useState } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { makeStore, isStoreForCurrentUser } from "@/store";

/**
 * Redux Provider avec support du versioning de cache par utilisateur (Solution 5)
 * Recrée automatiquement le store lorsqu'un changement d'utilisateur est détecté
 */
export default function ReduxProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<ReturnType<typeof makeStore> | undefined>(undefined);
  const [, forceUpdate] = useState({});

  // Initialize store on first render
  if (!storeRef.current) {
    const userId = typeof window !== "undefined" ? localStorage.getItem("chariot_user_id") : null;
    storeRef.current = makeStore(userId);
  }

  useEffect(() => {
    // Listen for user change events from KeycloakProvider
    const handleUserChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ userId: string }>;
      const newUserId = customEvent.detail.userId;

      console.log("[ReduxProvider] User change detected, recreating store for user:", newUserId);

      // Check if we need to recreate the store
      if (!isStoreForCurrentUser(newUserId)) {
        // Purge old store
        if (storeRef.current?.persistor) {
          storeRef.current.persistor.purge();
        }

        // Create new store with new user's cache
        storeRef.current = makeStore(newUserId);

        // Force re-render to use new store
        forceUpdate({});
      }
    };

    window.addEventListener("chariot:user-changed", handleUserChange);

    return () => {
      window.removeEventListener("chariot:user-changed", handleUserChange);
    };
  }, []);

  if (!storeRef.current) {
    return null;
  }

  return (
    <Provider store={storeRef.current.store}>
      <PersistGate
        loading={null}
        persistor={storeRef.current.persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}
