import type { Provider } from "aihappey-types";

const XAI_USD_TICKS_PER_USD = 10_000_000_000;

const toFiniteNumber = (value: unknown): number | undefined => {
  const numeric = typeof value === "number" ? value : typeof value === "string" ? Number(value) : undefined;
  return typeof numeric === "number" && Number.isFinite(numeric) ? numeric : undefined;
};

const createXaiGatewayMetadata: Provider["createGatewayMetadata"] = ({ event, currentGateway }) => {
  const ticks = toFiniteNumber(event?.usage?.cost_in_usd_ticks ?? event?.response?.usage?.cost_in_usd_ticks);
  if (ticks === undefined) return undefined;

  return {
    ...(currentGateway ?? {}),
    cost: ticks / XAI_USD_TICKS_PER_USD,
  };
};

export const createGatewayMetadata: Provider["createGatewayMetadata"] = createXaiGatewayMetadata;
