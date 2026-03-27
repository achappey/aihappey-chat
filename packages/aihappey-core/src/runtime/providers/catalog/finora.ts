import type { Provider } from "aihappey-types";

export const finora: Provider = {
  name: "Finora",
  description: "One OpenAI-compatible endpoint for every model your company uses. Route requests across providers, add retries and fallback, track cost and usage, and expose buyer-ready docs, pricing, and security paths.",
  icons: [{
    src: "https://finorahq.org/brand/icons/finora-logo-192.png"
  }],
  urls: {
    homepage: "https://finorahq.org",
    docs: "https://finorahq.org/docs",
    pricing: "https://finorahq.org/pricing",
    privacyPolicy: "https://finorahq.org/privacy",
    termsOfService: "https://finorahq.org/terms"
  },
  inferenceRegions: ["World"]

};

