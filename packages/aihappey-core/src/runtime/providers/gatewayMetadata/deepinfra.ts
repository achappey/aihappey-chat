import type { Provider } from "aihappey-types";

const toFiniteNumber = (value: unknown): number | undefined => {
  const numeric = typeof value === "number" ? value : typeof value === "string" ? Number(value) : undefined;
  return typeof numeric === "number" && Number.isFinite(numeric) ? numeric : undefined;
};

const createDeepInfraGatewayMetadata: Provider["createGatewayMetadata"] = ({ event, currentGateway }) => {
  const cost = toFiniteNumber(event?.usage?.estimated_cost ?? event?.response?.usage?.estimated_cost);
  if (cost === undefined) return undefined;

  return {
    ...(currentGateway ?? {}),
    cost,
  };
};

export const createGatewayMetadata: Provider["createGatewayMetadata"] = createDeepInfraGatewayMetadata;
