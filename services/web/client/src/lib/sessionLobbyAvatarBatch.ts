import type { SessionParticipant } from "@/services/SessionService";
import type { MediaAvatarScope, MediaAvatarSize } from "@/utils/media.utils";

export type SessionLobbyAvatarBatchItem = {
  scope: MediaAvatarScope;
  entityId: string;
  storedValue: string;
  size: MediaAvatarSize;
};

type SessionLobbyAvatarBatchInput = {
  participants: SessionParticipant[];
  participantAvatars: Record<string, string | null | undefined>;
  characterDetails: Record<string, { avatar?: string } | undefined>;
};

/**
 * Builds presigned-URL batch items for session lobby participant cards.
 * GM → user scope (PP, session-readable). Players → character scope only (never player PP).
 * @see FR-media-avatar-read-access
 */
export function buildSessionLobbyAvatarBatchItems(
  input: SessionLobbyAvatarBatchInput,
): SessionLobbyAvatarBatchItem[] {
  const items: SessionLobbyAvatarBatchItem[] = [];

  for (const participant of input.participants) {
    if (participant.status === "gameMaster") {
      const stored = input.participantAvatars[participant.userId];
      if (stored?.trim()) {
        items.push({
          scope: "user",
          entityId: participant.userId,
          storedValue: stored,
          size: "thumb",
        });
      }
      continue;
    }

    const characterId = participant.characterId;
    if (!characterId) {
      continue;
    }

    const avatar = input.characterDetails[characterId]?.avatar;
    if (avatar?.trim()) {
      items.push({
        scope: "character",
        entityId: characterId,
        storedValue: avatar,
        size: "thumb",
      });
    }
  }

  return items;
}

export type SessionLobbyParticipantAvatarDescriptor = {
  scope: MediaAvatarScope;
  entityId: string;
  storedValue?: string | null;
};

export function resolveSessionLobbyParticipantAvatar(
  participant: SessionParticipant,
  participantAvatars: Record<string, string | null | undefined>,
  characterDetails: Record<string, { avatar?: string } | undefined>,
): SessionLobbyParticipantAvatarDescriptor | null {
  if (participant.status === "gameMaster") {
    return {
      scope: "user",
      entityId: participant.userId,
      storedValue: participantAvatars[participant.userId],
    };
  }

  if (!participant.characterId) {
    return null;
  }

  return {
    scope: "character",
    entityId: participant.characterId,
    storedValue: characterDetails[participant.characterId]?.avatar,
  };
}

export function getSessionLobbyParticipantAvatarUrl(
  descriptor: SessionLobbyParticipantAvatarDescriptor | null,
  getUrl: (scope: MediaAvatarScope, entityId: string, size?: MediaAvatarSize) => string | null,
): string | null | undefined {
  if (!descriptor) {
    return undefined;
  }
  return getUrl(descriptor.scope, descriptor.entityId, "thumb");
}
