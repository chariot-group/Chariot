import axios, { AxiosInstance } from "axios";
import Keycloak from "keycloak-js";

let keycloakInstance: Keycloak | null = null;

export const setKeycloakInstance = (instance: Keycloak) => {
  keycloakInstance = instance;
};

const clients = new Map<string, AxiosInstance>();

function createClient(baseURL: string): AxiosInstance {
  const existing = clients.get(baseURL);
  if (existing) {
    return existing;
  }

  const apiClient = axios.create({
    baseURL,
    headers: { "Content-Type": "application/json" },
  });

  apiClient.interceptors.request.use(async (config) => {
    const token = keycloakInstance?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  clients.set(baseURL, apiClient);
  return apiClient;
}

export const getPaymentApiClient = (): AxiosInstance =>
  createClient(process.env.NEXT_PUBLIC_PAYMENT_API_URL ?? "http://localhost:8082/payment");

export const getSessionApiClient = (): AxiosInstance =>
  createClient(process.env.NEXT_PUBLIC_SESSION_API_URL ?? "http://localhost:8082/session");

export const getAdventureApiClient = (): AxiosInstance =>
  createClient(process.env.NEXT_PUBLIC_ADVENTURE_API_URL ?? "http://localhost:8082/api");

const getApiClient = (): AxiosInstance => getPaymentApiClient();

export default getApiClient;
