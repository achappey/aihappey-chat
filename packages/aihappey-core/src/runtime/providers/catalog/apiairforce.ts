import type { Provider } from "aihappey-types";

export const apiairforce: Provider = {
  name: "ApiAirforce",
  description: "Free Claude API, cheap GPT-4, and Midjourney access. 65+ AI models with pay-as-you-go from $0. Best affordable AI API for developers.",
  icons: [{
    src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://api.airforce&size=128"
  }],
  urls: {
    homepage: "https://api.airforce",
    pricing: "https://api.airforce/pricing",
    docs: "https://api.airforce/docs",
    privacyPolicy: "https://api.airforce/privacy",
    termsOfService: "https://api.airforce/terms"
  },
  providerCountry: "US",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

