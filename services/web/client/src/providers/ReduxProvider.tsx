"use client";

import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { makeStore, isStoreForCurrentUser } from "@/store";

/**
 * Redux Provider avec support du versioning de cache par utilisateur (Solution 5)
 * Recrée automatiquement le store lorsqu'un changement d'utilisateur est détecté
 */
export default function ReduxProvider({ children }: { children: React.ReactNode }) {
  const [storeContainer, setStoreContainer] = useState<ReturnType<typeof makeStore>>(() => {
    const userId = typeof window !== "undefined" ? localStorage.getItem("chariot_user_id") : null;
    return makeStore(userId);
  });

  useEffect(() => {
    // Listen for user change events from KeycloakProvider
    const handleUserChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ userId: string }>;
      const newUserId = customEvent.detail.userId;

      console.log("[ReduxProvider] User change detected, recreating store for user:", newUserId);

      // Check if we need to recreate the store
      if (!isStoreForCurrentUser(newUserId)) {
        // Purge old store
        setStoreContainer((currentStore) => {
          currentStore.persistor.purge();
          return makeStore(newUserId);
        });
      }
    };

    window.addEventListener("chariot:user-changed", handleUserChange);

    return () => {
      window.removeEventListener("chariot:user-changed", handleUserChange);
    };
  }, []);

  return (
    <Provider store={storeContainer.store}>
      <PersistGate
        loading={null}
        persistor={storeContainer.persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}
