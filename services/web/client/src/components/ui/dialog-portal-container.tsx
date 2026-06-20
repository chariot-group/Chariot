"use client";

import * as React from "react";

const DialogPortalContainerContext = React.createContext<HTMLElement | null>(null);

export function DialogPortalContainerProvider({
  container,
  children,
}: {
  container: HTMLElement | null;
  children: React.ReactNode;
}) {
  return (
    <DialogPortalContainerContext.Provider value={container}>{children}</DialogPortalContainerContext.Provider>
  );
}

export function useDialogPortalContainer(): HTMLElement | null {
  return React.useContext(DialogPortalContainerContext);
}
