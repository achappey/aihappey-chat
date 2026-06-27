import type { Provider } from "aihappey-types";

const toFiniteNumber = (value: unknown): number | undefined => {
  const numeric = typeof value === "number" ? value : typeof value === "string" ? Number(value) : undefined;
  return typeof numeric === "number" && Number.isFinite(numeric) ? numeric : undefined;
};

const createOpenRouterGatewayMetadata: Provider["createGatewayMetadata"] = ({ event, currentGateway }) => {
  const cost = toFiniteNumber(event?.usage?.cost ?? event?.response?.usage?.cost);
  if (cost === undefined) return undefined;

  return {
    ...(currentGateway ?? {}),
    cost,
  };
};

export const openrouter: Provider = {
  name: "OpenRouter",
  description: "The unified interface for LLMs. Find the best models & prices for your prompts.",
  icons: [
    {
      src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTtUJ7sIo-IoQEx5qCcqYFmJE47fYgbnKe80A&s"
    }
  ],
  urls: {
    homepage: "https://openrouter.ai",
    docs: "https://openrouter.ai/docs",
    pricing: "https://openrouter.ai/pricing",
    privacyPolicy: "https://openrouter.ai/privacy",
    termsOfService: "https://openrouter.ai/terms"
  },
  providerCountry: "US",
  category: "gateway_router",
  inferenceRegions: ["World"],
  apiBaseUrl: "https://openrouter.ai/api",
  chatEndpoints: ["/v1/chat/completions", "/v1/responses", "/v1/messages"],
  createGatewayMetadata: createOpenRouterGatewayMetadata

};
