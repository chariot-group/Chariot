import apiClient from "@/services/ApiService";
import {
  mediaAvatarCacheKey,
  type MediaAvatarScope,
  type MediaAvatarVariant,
} from "@/utils/media.utils";

export type PresignedReadRequest = {
  scope: MediaAvatarScope;
  id: string;
  variant: MediaAvatarVariant;
};

export type PresignedUrlResult = {
  url: string | null;
  expiresAt: string | null;
  source: "external" | "presigned" | "missing";
};

type PresignedReadResponse = {
  message: string;
  data: Record<string, PresignedUrlResult>;
};

class MediaService {
  private readonly BASE_PATH = "/media";
  private readonly USER_AVATAR_PATH = "/media/users/me/avatar";

  private multipartConfig() {
    return {
      transformRequest: [
        (data: FormData, headers: Record<string, string>) => {
          delete headers["Content-Type"];
          return data;
        },
      ],
    };
  }

  async resolvePresignedReads(
    requests: PresignedReadRequest[],
    sessionCode?: string | null,
  ): Promise<Record<string, PresignedUrlResult>> {
    if (requests.length === 0) {
      return {};
    }

    const response = await apiClient().post<PresignedReadResponse>(
      `${this.BASE_PATH}/presigned-read`,
      {
        requests,
        sessionCode: sessionCode?.trim() || undefined,
      },
    );

    return response.data.data ?? {};
  }

  async uploadCharacterAvatar(
    characterId: string,
    file: File,
    sessionCode?: string | null,
  ): Promise<{ avatar: string }> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient().post<{
      data: { avatar: string };
    }>(`${this.BASE_PATH}/characters/${characterId}/avatar`, formData, {
      params: sessionCode?.trim() ? { sessionCode: sessionCode.trim() } : undefined,
      ...this.multipartConfig(),
    });

    return response.data.data;
  }

  async deleteCharacterAvatar(
    characterId: string,
    sessionCode?: string | null,
  ): Promise<{ avatar: string }> {
    const response = await apiClient().delete<{ data: { avatar: string } }>(
      `${this.BASE_PATH}/characters/${characterId}/avatar`,
      {
        params: sessionCode?.trim() ? { sessionCode: sessionCode.trim() } : undefined,
      },
    );

    return response.data.data;
  }

  async uploadUserAvatar(file: File): Promise<{ avatar: string }> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient().post<{
      data: { avatar: string };
    }>(this.USER_AVATAR_PATH, formData, this.multipartConfig());

    return response.data.data;
  }

  async deleteUserAvatar(): Promise<{ avatar: string }> {
    const response = await apiClient().delete<{ data: { avatar: string } }>(
      this.USER_AVATAR_PATH,
    );

    return response.data.data;
  }

  buildCacheKey(
    scope: MediaAvatarScope,
    entityId: string,
    variant: MediaAvatarVariant,
  ): string {
    return mediaAvatarCacheKey(scope, entityId, variant);
  }
}

const mediaService = new MediaService();
export default mediaService;
