import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import Keycloak from "keycloak-js";
import { buildKeycloakAuthOptions } from "@/hooks/useLocalePreference";
import { reportClientIssue } from "@/logger/reportClientIssue";
import { getKeycloakInstance } from "@/lib/keycloakInstance";
import { createDedupeInFlightGetAdapter } from "@/lib/http/dedupeInFlightGetAdapter";

let loginRedirectInFlight = false;

/** @deprecated Import from `@/lib/keycloakInstance`; kept for existing callers. */
export { setKeycloakInstance } from "@/lib/keycloakInstance";

/** Debounce forced re-login — parallel 401s after SSO restart must not spam Keycloak. */
function redirectToLogin(kc: Keycloak): void {
  if (typeof window === "undefined" || loginRedirectInFlight) return;
  loginRedirectInFlight = true;
  const { locale } = buildKeycloakAuthOptions(window.location.pathname);
  const redirectUri = `${window.location.origin}/${locale}/welcome`;
  kc.login({ locale, redirectUri });
}

// Create a single shared axios instance
let apiClientInstance: AxiosInstance | null = null;

const createApiClient = (): AxiosInstance => {
  const url = process.env.NEXT_PUBLIC_API_URL;

  if (!url) {
    throw new Error("API URL is not defined. Set NEXT_PUBLIC_API_URL in your environment.");
  }

  // Add /api prefix for gateway if URL doesn't already contain it
  const baseURL = url.endsWith('/api') ? url : `${url}/api`;

  const instance = axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
    },
    withCredentials: true,
  });

  // Concurrent identical GETs share one request (FR-web-first-load-performance, requirement 14).
  instance.defaults.adapter = createDedupeInFlightGetAdapter(axios.getAdapter(instance.defaults.adapter));

  // Request interceptor - fetches token for each request
  instance.interceptors.request.use(
    async (config) => {
      // Wait for Keycloak to be initialized
      if (typeof window !== 'undefined' && !getKeycloakInstance()) {
        // Wait briefly for Keycloak to initialize
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Get token directly from Keycloak instance
      const token = getKeycloakInstance()?.token;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else if (typeof window !== 'undefined') {
        // If no token on client side, wait a bit more
        console.warn('⚠️ No token available yet, waiting for Keycloak initialization...');
        await new Promise(resolve => setTimeout(resolve, 500));

        const retryToken = getKeycloakInstance()?.token;
        if (retryToken) {
          config.headers.Authorization = `Bearer ${retryToken}`;
        }
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  // Response interceptor to handle 401 errors
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
      const keycloakInstance = getKeycloakInstance();

      if (error.response?.status === 401 && !originalRequest._retry && keycloakInstance) {
        originalRequest._retry = true;

        try {
          // Check if user is authenticated
          if (!keycloakInstance.authenticated) {
            redirectToLogin(keycloakInstance);
            return Promise.reject(error);
          }

          // Force token refresh
          const refreshed = await keycloakInstance.updateToken(-1); // -1 forces refresh

          if (refreshed || keycloakInstance.token) {
            // Update header with new token
            const newToken = keycloakInstance.token;

            if (newToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }

            // Retry request
            return instance(originalRequest);
          } else {
            redirectToLogin(keycloakInstance);
            return Promise.reject(error);
          }
        } catch (refreshError) {
          reportClientIssue("error", "Token refresh failed", "Keycloak", refreshError);
          redirectToLogin(keycloakInstance);
          return Promise.reject(error);
        }
      }

      return Promise.reject(error);
    },
  );

  return instance;
};

// Function to get instance (created once)
const apiClient = (contentType?: string): AxiosInstance => {
  if (!apiClientInstance) {
    apiClientInstance = createApiClient();
  }

  // If a specific content-type is requested, set it for this request
  if (contentType) {
    apiClientInstance.defaults.headers.common["Content-Type"] = contentType;
  }

  return apiClientInstance;
};

/**
 * Creates an axios instance targeting the payment service through the gateway
 * (/payment prefix instead of /api)
 */
export const createPaymentApiClient = (): AxiosInstance => {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error("API URL is not defined. Set NEXT_PUBLIC_API_URL in your environment.");
  }

  const baseURL = `${url}/payment`;

  const instance = axios.create({
    baseURL,
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });

  instance.interceptors.request.use(
    async (config) => {
      const token = getKeycloakInstance()?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  return instance;
};

export default apiClient;
