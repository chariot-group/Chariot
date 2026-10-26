import { gatewayUrl } from "./env.mjs";

const INTEG_GATEWAY_HOST = "integ-api.chariot.tools";

export function assertIntegTarget(action) {
  const target = (process.env.LOAD_TEST_TARGET || "").trim().toLowerCase();
  const gw = gatewayUrl();

  if (target === "integ" && gw.includes(INTEG_GATEWAY_HOST)) {
    return;
  }

  if (!target && gw.includes(INTEG_GATEWAY_HOST)) {
    return;
  }

  throw new Error(
    `${action} refusé : cible non integ. Définir LOAD_TEST_TARGET=integ et GATEWAY_URL=https://${INTEG_GATEWAY_HOST}/… dans tools/load-test/.env`,
  );
}
