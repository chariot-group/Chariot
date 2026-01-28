"use client";

import { useRef } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { makeStore } from "@/store";

export default function ReduxProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<ReturnType<typeof makeStore> | undefined>(undefined);

  if (!storeRef.current) {
    // Create the store and persistor instance the first time this renders
    storeRef.current = makeStore();
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
