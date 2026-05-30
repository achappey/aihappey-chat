import type { Provider } from "aihappey-types";

export const atlascloud: Provider = {
  name: "AtlasCloud",
  description: "World's first full-modal inference platform. Chat, image, video, audio—all through one unified API. 300+ models, OpenAI-compatible.",
  icons: [
    {
      src: "https://www.google.com/s2/favicons?sz=128&domain=atlascloud.ai"
    }
  ],
  urls: {
    homepage: "https://www.atlascloud.ai",
    docs: "https://www.atlascloud.ai/docs",
    pricing: "https://www.atlascloud.ai/pricing/models",
    termsOfService: "https://www.atlascloud.ai/services-agreement",
    privacyPolicy: "https://www.atlascloud.ai/privacy",
    console: "https://www.atlascloud.ai/console/dashboard"
  },
  providerCountry: "US",
  category: "media_voice",
  inferenceRegions: ["World"]
};

