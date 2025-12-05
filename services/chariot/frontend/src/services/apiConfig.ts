import { APIContentType } from "@/constants/APIContentType";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const url = process.env.NEXT_PUBLIC_API_URL;

let keycloakTokenGetter: (() => string | null) | null = null;
let keycloakInstance: any | null = null;

export const setKeycloakTokenGetter = (getter: () => string | null) => {
  keycloakTokenGetter = getter;
};

export const setKeycloakInstance = (instance: any) => {
  keycloakInstance = instance;
};

const apiClient = (contentType: string) => {
  if (!url) {
    throw new Error("API URL is not defined");
  }

  const instance = axios.create({
    baseURL: url,
    headers: {
      "Content-Type": contentType || APIContentType.JSON,
    },
    withCredentials: true,
  });

  // Intercepteur de requête pour ajouter le token Keycloak
  instance.interceptors.request.use(
    (config) => {
      const token = keycloakTokenGetter ? keycloakTokenGetter() : null;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Intercepteur de réponse pour gérer les erreurs d'authentification
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      // En cas d'erreur 401, tenter de rafraîchir le token
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        console.warn("401 Unauthorized - Attempting to refresh token");

        try {
          if (keycloakInstance) {
            // Tenter de rafraîchir le token (5 secondes de validité minimum)
            const refreshed = await keycloakInstance.updateToken(5);

            if (refreshed) {
              console.log("Token refreshed successfully, retrying request");
              // Mettre à jour le header Authorization avec le nouveau token
              const newToken = keycloakInstance.token;
              if (newToken && originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
              }
              // Réessayer la requête avec le nouveau token
              return instance(originalRequest);
            }
          }

          // Si le refresh échoue, rediriger vers login
          console.error("Token refresh failed, redirecting to login");
          if (typeof window !== "undefined") {
            keycloakInstance?.login();
          }
        } catch (refreshError) {
          console.error("Error refreshing token:", refreshError);
          if (typeof window !== "undefined") {
            keycloakInstance?.login();
          }
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

export default apiClient;
