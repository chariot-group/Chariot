import apiClient from '@/services/ApiService';
import { QuickLink, CreateQuickLinkDto, UpdateQuickLinkDto } from '@/types/quickLink';

class QuickLinkService {
  private readonly BASE_PATH = '/quick-links';

  async getQuickLinks(campaignId?: string | null): Promise<QuickLink[]> {
    const params: Record<string, string> = {};

    if (campaignId !== undefined) {
      params.campaignId = campaignId === null ? 'null' : campaignId;
    }

    const response = await apiClient().get<{ data: QuickLink[] }>(
      this.BASE_PATH,
      { params },
    );

    return response.data?.data ?? [];
  }

  async createQuickLink(dto: CreateQuickLinkDto): Promise<QuickLink> {
    const response = await apiClient().post<{ data: QuickLink }>(
      this.BASE_PATH,
      dto,
    );

    return response.data?.data;
  }

  async updateQuickLink(id: string, dto: UpdateQuickLinkDto): Promise<QuickLink> {
    const response = await apiClient().patch<{ data: QuickLink }>(
      `${this.BASE_PATH}/${id}`,
      dto,
    );
    return response.data?.data;
  }

  async deleteQuickLink(id: string): Promise<void> {
    await apiClient().delete(`${this.BASE_PATH}/${id}`);
  }
}

const quickLinkService = new QuickLinkService();
export default quickLinkService;
