import type { Provider } from "aihappey-types";

export const gradium: Provider = {
  name: "Gradium",
  description: "Text-to-Speech, Speech-to-Text, and Speech-to-Speech AI models.",
  icons: [{
    src: "https://avatars.githubusercontent.com/u/229105977?s=200&v=4"
  }],
  urls: {
    homepage: "https://gradium.ai",
    docs: "https://gradium.ai/api_docs.html",
    pricing: "https://gradium.ai/pricing",
    privacyPolicy: "https://gradium.ai/privacy",
    termsOfService: "https://gradium.ai/terms-of-service"
  },
  providerCountry: "FR",
  category: "media_voice",
  inferenceRegions: ["Europe", "Americas"]

};

