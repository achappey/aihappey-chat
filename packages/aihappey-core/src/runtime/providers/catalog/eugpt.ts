import type { Provider } from "aihappey-types";

export const eugpt: Provider = {
  name: "EuGPT",
  description: "AI for organizations built on European values. Compliance with legislation is our starting point, not an afterthought.",
  icons: [{
    src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://eugpt.ai&size=128"
  }],
  urls: {
    homepage: "https://www.eugpt.ai",
    docs: "https://www.eugpt.ai/en/api",
    pricing:"https://eugpt.ai/pricing",
    privacyPolicy: "https://www.eugpt.ai/en/privacy",
    termsOfService: "https://www.eugpt.ai/en/terms"
  },
  providerCountry: "NL",
  category: "gateway_router",
  inferenceRegions: ["Europe"]

};

