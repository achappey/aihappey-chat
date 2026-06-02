import type { Provider } from "aihappey-types";

export const lilac: Provider = {
  name: "Lilac",
  description: "OpenAI-compatible API for Kimi K2.6, GLM 5.1, Gemma 4 (31B) and more. Industry-leading speed, lower cost — because we route to idle enterprise GPUs that are already powered on.",
  icons: [{
    src: "https://getlilac.com/favicon.png"
  }],
  urls: {
    homepage: "https://getlilac.com",
    docs: "https://docs.getlilac.com",
    console: "https://console.getlilac.com",
    pricing: "https://getlilac.com/#pricing",
    privacyPolicy: "https://getlilac.com/privacy",
    termsOfService: "https://trust.getlilac.com"
  },
  providerCountry: "US",
  category: "inference_compute",
  inferenceRegions: ["World"]

};

