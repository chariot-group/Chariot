import { APIContentType } from "@/constants/APIContentType";
import apiClient from "@/services/apiConfig";

const END_POINT = "/campaigns";

const GroupService = {
  async getAllGroups(
    query: {
      page?: number;
      offset?: number;
      label?: string;
      sort?: string;
      type: string;
      onlyWithMembers?: boolean;
    },
    idCampaingn: string,
  ) {
    try {
      const response = await apiClient(APIContentType.JSON).get(`${END_POINT}/${idCampaingn}/groups`, {
        params: query,
      });

      if (!response || !response.data || response === undefined) {
        throw new Error("Invalid API response");
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching groups:", error);
      return [];
    }
  },

  async updateGroup(id: string, data: any) {
    try {
      const response = await apiClient(APIContentType.JSON).patch(`/groups/${id}`, data);

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
      const response = await apiClient(APIContentType.JSON).get(`/groups/${id}`);

      if (!response || !response.data || response === undefined) {
        throw new Error("Invalid API response");
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching group:", error);
      return null;
    }
  },
  async deleteGroup(id: string) {
    try {
      const response = await apiClient(APIContentType.JSON).delete(`/groups/${id}`);

      if (!response || !response.data || response === undefined) {
        throw new Error("Invalid API response");
      }

      return response.data;
    } catch (err: any) {
      console.error("API error:", err);
      return "error";
    }
  },

  async createGroup(data: any) {
    try {
      const response = await apiClient(APIContentType.JSON).post(`/groups`, data);

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

export default GroupService;
