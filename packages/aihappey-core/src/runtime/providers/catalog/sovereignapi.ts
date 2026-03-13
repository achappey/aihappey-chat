import type { Provider } from "aihappey-types";

export const sovereignapi: Provider = {
  name: "SovereignAPI",
  description: "OpenAI-compatible inference API with prepaid API keys and pay-per-request crypto billing. 299+ models, drop-in OpenAI replacement.",
  icons: [{
    src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://sovereign-api.com&size=128"
  }],
  urls: {
    homepage: "https://sovereign-api.com",
    pricing: "https://sovereign-api.com/#pricing"
  },
  experimental: true,
  inferenceRegions: ["World"]

};

