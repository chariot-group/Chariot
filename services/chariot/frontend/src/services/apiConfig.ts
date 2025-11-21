import { APIContentType } from "@/constants/APIContentType";
import axios from "axios";

const url = process.env.NEXT_PUBLIC_API_URL;

const apiClient = (contentType: string) => {
  if (!url) {
    throw new Error("API URL is not defined");
  }
  const instance = axios.create({
    baseURL: url,
    headers: {
      "Content-Type": contentType || APIContentType.JSON,
      Authorization: `Bearer ${typeof window !== "undefined"
        ? document.cookie
          .split("; ")
          .find((row) => row.startsWith("accessToken="))
          ?.split("=")[1] || ""
        : ""
        }`,
    },
    withCredentials: true,
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error("API Error:", error);
      if (error.response?.status === 401) {
        if (!error.response.request.responseURL.includes("/auth/")) {
          document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

          if (typeof window !== "undefined") {
            window.location.href = "/auth/login";
          }
        }
      }

      return Promise.reject(error);
    },
  );

  return instance;
};

export default apiClient;
