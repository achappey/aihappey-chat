import type { Provider } from "aihappey-types";

export const tokenlab: Provider = {
  name: "TokenLab",
  description: "Use native provider routes and OpenAI-compatible endpoints to access hundreds of AI models, compare options in real time, and run production AI workflows with clear pricing and usage controls.",
  icons: [{
    src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://tokenlab.sh&size=128"
  }],
  urls: {
    homepage: "https://tokenlab.sh",
    docs: "https://docs.tokenlab.sh",
    privacyPolicy: "https://tokenlab.sh/privacy-policy",
    termsOfService: "https://tokenlab.sh/tos"
  },
  providerCountry: "CN",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

