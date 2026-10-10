import type { Provider } from "aihappey-types";
import { PROVIDER_CATALOG } from "./catalog.generated";
import { withProviderGatewayMetadata } from "./gatewayMetadata";
import { withProviderIconFallbacks } from "./providerIcons";

/**
 * UI-facing provider registry. Static metadata comes exclusively from catalog JSON.
 * Keys and ordering are defined by catalog/index.json and remain stable identifiers.
 */
export const PROVIDERS: Record<string, Provider> = withProviderIconFallbacks(
  withProviderGatewayMetadata(PROVIDER_CATALOG),
);
