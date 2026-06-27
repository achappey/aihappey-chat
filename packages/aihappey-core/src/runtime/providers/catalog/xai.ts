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

export const xai: Provider = {
  name: "xAI",
  description:
    "xAI is an AI company with the mission of advancing scientific discovery and gaining a deeper understanding of our universe.",
  icons: [
    {
      src: "https://registry.npmmirror.com/@lobehub/icons-static-png/1.74.0/files/dark/xai.png",
      theme: "dark",
    },
    {
      src: "https://registry.npmmirror.com/@lobehub/icons-static-png/1.74.0/files/light/xai.png",
      theme: "light",
    },
  ],
  urls: {
    homepage: "https://x.ai",
    docs: "https://docs.x.ai",
    pricing: "https://docs.x.ai/developers/models",
    privacyPolicy: "https://x.ai/privacy-policy",
    termsOfService: "https://x.ai/legal",
    console: "https://console.x.ai"
  },
  providerCountry: "US",
  category: "model_provider",
  inferenceRegions: ["World"],
  apiBaseUrl: "https://api.x.ai",
  chatEndpoints: ["/v1/chat/completions", "/v1/responses"],
  createGatewayMetadata: createXaiGatewayMetadata

};
