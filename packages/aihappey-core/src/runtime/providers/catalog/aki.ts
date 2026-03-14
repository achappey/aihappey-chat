import type { Provider } from "aihappey-types";

export const aki: Provider = {
  name: "AKI",
  description: "Token-based access to leading open-source AI models on EU infrastructure. Evaluate, build and scale your AI product without self-hosting or vendor lock-in.",
  icons: [{
    src: "https://aki.io/static/favicon/apple-touch-icon.png"
  }],
  urls: {
    homepage: "https://aki.io",
    docs: "https://aki.io/docs",
    pricing: "https://aki.io/#pricing",
    privacyPolicy: "https://aki.io/terms-of-use",
    termsOfService: "https://aki.io/privacy-policy"
  },
  providerCountry: "DE",
  inferenceRegions: ["Europe"]

};

