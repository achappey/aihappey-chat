import type { Provider } from "aihappey-types";

export const scaleway: Provider = {
  name: "Scaleway",
  description:
    "Build, train, deploy and scale AI models and intelligent applications on a resilient and sustainable cloud ecosystem.",
  icons: [{
    src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUm31jglhBhnZtoN2OG8LMZqYrIH7KdIyOzctVchkGXZOeDHyXylbP4ABi&s=10"
  }],
  urls: {
    homepage: "https://www.scaleway.com",
    pricing: "https://www.scaleway.com/en/pricing/model-as-a-service",
    docs: "https://www.scaleway.com/en/docs",
    privacyPolicy: "https://www.scaleway.com/en/privacy-policy",
    termsOfService: "https://www.scaleway.com/en/legal-notice",
    console: "https://console.scaleway.com"
  },
  providerCountry: "FR",
  category: "inference_compute",
  inferenceRegions: ["Europe"],
  apiBaseUrl: "https://api.scaleway.ai",
  chatEndpoints: ["/v1/chat/completions"]

};

