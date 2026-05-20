import axios, { AxiosInstance } from "axios";
import Keycloak from "keycloak-js";

let keycloakInstance: Keycloak | null = null;

export const setKeycloakInstance = (instance: Keycloak) => {
    keycloakInstance = instance;
};

let apiClient: AxiosInstance | null = null;

const getApiClient = (): AxiosInstance => {
    if (apiClient) return apiClient;

    const baseURL = process.env.NEXT_PUBLIC_PAYMENT_API_URL ?? "http://localhost:8082/payment";

    apiClient = axios.create({
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

    return apiClient;
};

export default getApiClient;
