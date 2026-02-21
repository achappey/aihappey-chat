import type { Provider } from "aihappey-types";

export const eurouter: Provider = {
  name: "EUrouter",
  description:
    "Integrate 60+ AI models via one unified API with guaranteed EU data residency. Zero data retention, and full GDPR compliance.",
  icons: [
    {
      src: "https://www.eurouter.ai/favicon.ico",
    },
  ],
  urls: {
    homepage: "https://www.eurouter.ai",
    docs: "https://docs.eurouter.ai",
    privacyPolicy: "https://www.eurouter.ai/privacy",
    termsOfService: "https://www.eurouter.ai/terms"
  },
  providerCountry: "NL",
  inferenceRegions: ["Europe"]
};

