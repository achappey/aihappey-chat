import type { Provider } from "aihappey-types";

export const sovinfra: Provider = {
  name: "Sovinfra",
  description: "Inférence IA souveraine hébergée en Europe. Un endpoint compatible OpenAI, dimensionné pour la production.",
  urls: {
    homepage: "https://sovinfra.ai",
    docs: "https://api.sovinfra.cloud/docs",
    pricing: "https://sovinfra.ai/pricing",
    privacyPolicy: "https://sovinfra.ai/privacy",
    termsOfService: "https://sovinfra.ai/terms",
    console: "https://app.sovinfra.ai"
  },
  providerCountry: "FR",
  category: "gateway_router",
  inferenceRegions: ["Europe"]

};

