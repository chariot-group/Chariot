import { APIContentType } from "@/constants/APIContentType";
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";

let keycloakInstance: any | null = null;

export const setKeycloakInstance = (instance: any) => {
  keycloakInstance = instance;
};

// Créer une seule instance axios partagée
let apiClientInstance: AxiosInstance | null = null;

const createApiClient = (): AxiosInstance => {
  const url = process.env.NEXT_PUBLIC_API_URL;

  if (!url) {
    throw new Error("API URL is not defined. Set NEXT_PUBLIC_API_URL in your environment.");
  }

  const instance = axios.create({
    baseURL: url,
    headers: {
      "Content-Type": APIContentType.JSON,
    },
    withCredentials: true,
  });

  // Intercepteur de requête - récupère le token à chaque requête
  instance.interceptors.request.use(
    (config) => {
      // Récupérer le token directement depuis l'instance Keycloak
      const token = keycloakInstance?.token;

      console.log('🔑 Request interceptor:', {
        hasToken: !!token,
        tokenPreview: token,
        url: config.url
      });

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Intercepteur de réponse pour gérer les erreurs 401
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      if (error.response?.status === 401 && !originalRequest._retry && keycloakInstance) {
        originalRequest._retry = true;

        console.warn("⚠️ 401 Unauthorized - Attempting to refresh token");

        try {
          // Vérifier si l'utilisateur est authentifié
          if (!keycloakInstance.authenticated) {
            console.error("❌ User not authenticated, redirecting to login");
            keycloakInstance.login();
            return Promise.reject(error);
          }

          // Forcer le refresh du token
          const refreshed = await keycloakInstance.updateToken(-1); // -1 force le refresh

          console.log('🔄 Token refresh result:', refreshed);

          if (refreshed || keycloakInstance.token) {
            // Mettre à jour le header avec le nouveau token
            const newToken = keycloakInstance.token;
            console.log('✅ New token obtained:', newToken?.substring(0, 20) + '...');

            if (newToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }

            // Réessayer la requête
            return instance(originalRequest);
          } else {
            console.error("❌ Token refresh failed - no new token");
            keycloakInstance.login();
            return Promise.reject(error);
          }
        } catch (refreshError) {
          console.error("❌ Error refreshing token:", refreshError);
          if (typeof window !== "undefined") {
            keycloakInstance.login();
          }
          return Promise.reject(error);
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

// Fonction pour obtenir l'instance (créée une seule fois)
const apiClient = (contentType?: string): AxiosInstance => {
  if (!apiClientInstance) {
    apiClientInstance = createApiClient();
  }

  // Si un content-type spécifique est demandé, le définir pour cette requête
  if (contentType) {
    apiClientInstance.defaults.headers.common["Content-Type"] = contentType;
  }

  return apiClientInstance;
};

export default apiClient;