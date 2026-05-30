import type { Provider } from "aihappey-types";

export const aiduet: Provider = {
  name: "AIDuet",
  description: "Hybrid model API compatible with Anthropic and OpenAI. Opus thinks and reviews, GPT codes and executes. Swap the endpoint, save 20% on every token.",
  icons: [{
    src: "https://aiduet.app/favicon.svg"
  }],
  urls: {
    homepage: "https://aiduet.app",
    docs: "https://aiduet.app/en/docs",
    pricing: "https://aiduet.app/en/#pricing",
    privacyPolicy: "https://aiduet.app/en/privacy",
    termsOfService: "https://aiduet.app/en/terms"
  },
  category: "gateway_router",
  inferenceRegions: ["World"]
};

