import type { Provider } from "aihappey-types";

export const aigateway: Provider = {
  name: "AIgateway",
  description: "OpenAI-compatible endpoints to every frontier and open-weight model — text, image, video, voice, audio, embeddings. 1000+ models across 85+ labs, one schema.",
  icons: [{
    src: "https://aigateway.sh/favicon.ico"
  }],
  urls: {
    homepage: "https://aigateway.sh",
    docs: "https://aigateway.sh/docs",
    pricing: "https://aigateway.sh/pricing",
    privacyPolicy: "https://aigateway.sh/privacy",
    termsOfService: "https://aigateway.sh/terms"
  },
  providerCountry: "US",
  category: "media_voice",
  inferenceRegions: ["World"]

};

