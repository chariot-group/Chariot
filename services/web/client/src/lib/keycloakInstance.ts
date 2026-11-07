import type Keycloak from "keycloak-js";

/**
 * Shared Keycloak instance, read by the API client for bearer tokens.
 * Kept out of `ApiService` so the auth gate does not pull axios into the initial JS.
 * @see FR-web-first-load-performance (Slow-network authentication round trip)
 */
let keycloakInstance: Keycloak | null = null;

export function setKeycloakInstance(instance: Keycloak): void {
  keycloakInstance = instance;
}

export function getKeycloakInstance(): Keycloak | null {
  return keycloakInstance;
}
