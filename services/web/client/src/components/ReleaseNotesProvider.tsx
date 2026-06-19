"use client";

import { useEffect, useRef, useState } from "react";
import { useKeycloak } from "@/providers/KeycloakProvider";
import { CURRENT_APP_VERSION } from "@/data/release-notes";
import {
  getStoredUserId,
  getLastSeenVersion,
  setLastSeenVersion,
  isReleaseNotesMuted,
} from "@/lib/releaseNotesSeen";
import { ReleaseNotesModal } from "@/components/dialogs/ReleaseNotesModal";

export default function ReleaseNotesProvider() {
  const { authenticated, loading } = useKeycloak();
  const [open, setOpen] = useState(false);
  const hasOpenedRef = useRef(false);

  useEffect(() => {
    if (loading || !authenticated) return;
    if (hasOpenedRef.current) return;

    // chariot_user_id is set by KeycloakProvider at auth time (FR-010)
    const userId = getStoredUserId();

    if (isReleaseNotesMuted(userId)) return;
    if (getLastSeenVersion(userId) === CURRENT_APP_VERSION) return;

    hasOpenedRef.current = true;
    setOpen(true);
  }, [authenticated, loading]);

  const handleClose = () => {
    setLastSeenVersion(getStoredUserId(), CURRENT_APP_VERSION);
    setOpen(false);
  };

  if (!open) return null;

  return <ReleaseNotesModal open={open} onClose={handleClose} />;
}
