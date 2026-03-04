import type { Provider } from "aihappey-types";

export const gooseai: Provider = {
  name: "GooseAI",
  description:
    "Fully managed NLP-as-a-Service delivered via API, at 30% the cost. It's time to migrate.",
  icons: [
    {
      src: "https://cdn-1.webcatalog.io/catalog/gooseai/gooseai-icon-filled-256.png?v=1714783054795"
    }
  ],
  urls: {
    homepage: "https://goose.ai",
    docs: "https://goose.ai/docs",
    privacyPolicy: "https://goose.ai/docs/privacy",
    termsOfService: "https://goose.ai/docs/tos",
    pricing: "https://goose.ai/pricing",
    console: "https://goose.ai/dashboard"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]
};