import type { Provider } from "aihappey-types";

export const wesenai: Provider = {
  name: "WesenAI",
  description: "WesenAI is a cutting-edge AI platform specializing in Amharic language processing, offering speech recognition, natural language processing, and more.",
  icons: [{
    src: "https://app.wesen.ai/images/favicon/apple-touch-icon.png"
  }],
  urls: {
    homepage: "https://app.wesen.ai",
    docs: "https://app.wesen.ai/docs",
    privacyPolicy: "https://app.wesen.ai/privacy-policy",
    termsOfService: "https://app.wesen.ai/terms-of-service"
  },
  providerCountry: "US",
  category: "media_voice",
  inferenceRegions: ["World"]

};

