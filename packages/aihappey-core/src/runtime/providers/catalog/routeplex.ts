import type { Provider } from "aihappey-types";

export const routeplex: Provider = {
  name: "RoutePlex",
  description: "RoutePlex is a unified AI API that routes requests to the best language model across OpenAI, Anthropic, Google, and more. Smart routing, automatic fallbacks, and real-time cost tracking.",
  icons: [{
    src: "https://routeplex.com/favicon.ico?favicon.e051eb8e.ico"
  }],
  urls: {
    homepage: "https://routeplex.com",
    docs: "https://routeplex.com/docs",
    pricing: "https://routeplex.com/pricing",
    privacyPolicy: "https://routeplex.com/privacy-policy",
    termsOfService: "https://routeplex.com/terms"
  },
  providerCountry: "GB",
  inferenceRegions: ["World"]

};

