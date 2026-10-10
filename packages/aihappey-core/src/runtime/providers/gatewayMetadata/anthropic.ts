import type { Provider } from "aihappey-types";
import { createProviderPricingGatewayMetadata } from "../catalog/providerPricing";

export const createGatewayMetadata: Provider["createGatewayMetadata"] = createProviderPricingGatewayMetadata("anthropic");
