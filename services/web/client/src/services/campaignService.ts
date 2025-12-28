import { APIContentType } from "@/constants/APIContentType";
import apiClient from "@/services/apiConfig";

const moduleUrl = "/campaigns";

const CampaignService = {
  async getAllCampaigns(query: { page?: number; offset?: number; label?: string; sort?: string }) {
    try {
      const response = await apiClient(APIContentType.JSON).get(moduleUrl, {
        params: query,
      });

      return response.data;
    } catch (err: any) {
      console.error("API error:", err);
      if (err.status === 401) {
        return {
          statusCode: 401,
          message: "Unauthorized",
        };
      }
      return "error";
    }
  },
  async updateCampaign(id: string, data: any) {
    try {
      const response = await apiClient(APIContentType.JSON).patch(`${moduleUrl}/${id}`, data);

      if (!response || !response.data || response === undefined) {
        throw new Error("Invalid API response");
      }

      return response.data;
    } catch (err: any) {
      console.error("API error:", err);
      return "error";
    }
  },

  async createCampaign(data: any) {
    try {
      const response = await apiClient(APIContentType.JSON).post(`${moduleUrl}`, data);

      if (!response || !response.data || response === undefined) {
        throw new Error("Invalid API response");
      }

      return response.data;
    } catch (err: any) {
      console.error("API error:", err);
      return "error";
    }
  },

  async deleteCampaign(id: string) {
    try {
      const response = await apiClient(APIContentType.JSON).delete(`${moduleUrl}/${id}`);

      if (!response || !response.data || response === undefined) {
        throw new Error("Invalid API response");
      }

      return response.data;
    } catch (err: any) {
      console.error("API error:", err);
      return "error";
    }
  },

  async findOne(id: string) {
    try {
      const response = await apiClient(APIContentType.JSON).get(`${moduleUrl}/${id}`);

      if (!response || !response.data || response === undefined) {
        throw new Error("Invalid API response");
      }

      return response.data;
    } catch (err: any) {
      console.error("API error:", err);
      return "error";
    }
  },
};

export default CampaignService;
