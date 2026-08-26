import type { Provider } from "aihappey-types";

export const leaperone: Provider = {
  name: "LEAPERone",
  description:
    "Use one OpenAI-compatible API key for chat, reasoning, images, audio, video, and embeddings with usage-based billing.",
  urls: {
    homepage: "https://www.leaper.one",
    docs: "https://www.leaper.one/en/docs",
    pricing:"https://www.leaper.one/en/pricing",
    privacyPolicy: "https://www.leaper.one/en/legal/privacy",
    termsOfService: "https://www.leaper.one/en/legal/terms"
  },
  providerCountry: "CN",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

