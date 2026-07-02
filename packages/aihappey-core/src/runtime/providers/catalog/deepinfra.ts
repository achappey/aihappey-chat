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

export const deepinfra: Provider = {
  name: "DeepInfra",
  description:
    "Deep Infra offers cost-effective, scalable, easy-to-deploy, and production-ready machine-learning models and infrastructures for deep-learning models.",
  icons: [{
    src: "https://avatars.githubusercontent.com/u/116928265?s=280&v=4"
  }],
  urls: {
    homepage: "https://deepinfra.com",
    docs: "https://deepinfra.com/docs",
    pricing: "https://deepinfra.com/pricing",
    privacyPolicy: "https://deepinfra.com/privacy",
    termsOfService: "https://deepinfra.com/terms"
  },
  providerCountry: "US",
  category: "gateway_router",
  inferenceRegions: ["World"],
  apiBaseUrl: "https://api.deepinfra.com",
  chatEndpoints: ["/v1/openai/chat/completions"],
  createGatewayMetadata: createDeepInfraGatewayMetadata

};
