import type { Provider } from "aihappey-types";
import { createGatewayMetadata as anthropic } from "./gatewayMetadata/anthropic";
import { createGatewayMetadata as deepinfra } from "./gatewayMetadata/deepinfra";
import { createGatewayMetadata as minimax } from "./gatewayMetadata/minimax";
import { createGatewayMetadata as moonshot } from "./gatewayMetadata/moonshot";
import { createGatewayMetadata as openrouter } from "./gatewayMetadata/openrouter";
import { createGatewayMetadata as requesty } from "./gatewayMetadata/requesty";
import { createGatewayMetadata as spacexai } from "./gatewayMetadata/spacexai";
import { createGatewayMetadata as zai } from "./gatewayMetadata/zai";

// Runtime behavior only. All provider metadata lives in catalog/*.json.
export const PROVIDER_GATEWAY_METADATA: Record<string, Provider["createGatewayMetadata"]> = {
  anthropic,
  deepinfra,
  minimax,
  moonshot,
  openrouter,
  requesty,
  spacexai,
  zai,
};

export const withProviderGatewayMetadata = (
  providers: Record<string, Omit<Provider, "createGatewayMetadata">>,
): Record<string, Provider> => Object.fromEntries(
  Object.entries(providers).map(([id, provider]) => {
    const createGatewayMetadata = Object.hasOwn(PROVIDER_GATEWAY_METADATA, id)
      ? PROVIDER_GATEWAY_METADATA[id]
      : undefined;
    return [id, createGatewayMetadata ? { ...provider, createGatewayMetadata } : provider];
  }),
);
