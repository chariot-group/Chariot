import { APIContentType } from "@/constants/APIContentType";
import apiClient from "@/services/apiConfig";

const HealthService = {
  async getHealth(): Promise<number | "error"> {
    try {
      const response = await apiClient(APIContentType.JSON).get("/");

      return response.status;
    } catch (err: any) {
      return "error";
    }
  },
};

export default HealthService;
