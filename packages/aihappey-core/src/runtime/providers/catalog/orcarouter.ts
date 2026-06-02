import type { Provider } from "aihappey-types";

export const orcarouter: Provider = {
  name: "OrcaRouter",
  description: "OrcaRouter routes each prompt to the right model across OpenAI, Anthropic, Gemini and 200+ models — frontier quality, open-source prices, zero token markup.",
  icons: [{
    src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://www.orcarouter.ai&size=128"
  }],
  urls: {
    homepage: "https://www.orcarouter.ai",
    docs: "https://docs.orcarouter.ai",
    pricing: "https://www.orcarouter.ai/pricing",
    privacyPolicy: "https://www.orcarouter.ai/privacy.html",
    termsOfService: "https://www.orcarouter.ai/terms.html"
  },
  providerCountry: "SG",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

