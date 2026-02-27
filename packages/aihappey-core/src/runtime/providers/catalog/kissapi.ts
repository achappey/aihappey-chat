import type { Provider } from "aihappey-types";

export const kissapi: Provider = {
  name: "KissAPI",
  description:
    "One API. Every Model. Zero Hassle. Access Claude, GPT, Gemini and more through a single OpenAI-compatible endpoint. No VPN needed. Pay only for what you use.",
  icons: [{
    src: "https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://kissapi.ai&size=256"
  }],
  urls: {
    homepage: "https://api.kissapi.ai",
    docs: "https://kissapi.ai/tutorial/?mode=global",
    privacyPolicy: "https://kissapi.ai/privacy.html",
    termsOfService: "https://kissapi.ai/terms.html"
  },
  providerCountry: "CN",
  inferenceRegions: ["World"]

};

