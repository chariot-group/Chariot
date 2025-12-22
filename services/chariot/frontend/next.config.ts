import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Variables runtime (côté serveur uniquement)
  serverRuntimeConfig: {
    nodeEnv: process.env.NODE_ENV,
  },

  // Variables publiques (exposées au client)
  publicRuntimeConfig: {
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
    keycloakUrl: process.env.NEXT_PUBLIC_KEYCLOAK_URL,
    keycloakRealm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM,
    keycloakClientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID,
  },
};

export default withNextIntl(nextConfig);
