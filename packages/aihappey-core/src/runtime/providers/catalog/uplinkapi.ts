import type { Provider } from "aihappey-types";

export const uplinkapi: Provider = {
  name: "UplinkAPI",
  description: "Access Llama, Qwen, Mistral, and 170+ open-source AI models through a single OpenAI-compatible API. Intelligent routing, 40% lower costs, deployed globally on Cloudflare.",
  icons: [{
    src: "https://uplink.fimbriata.dev/logos/header-logo-uplink.png"
  }],
  urls: {
    homepage: "https://uplink.fimbriata.dev",
    docs: "https://uplink.fimbriata.dev/docs.html",
    pricing: "https://uplink.fimbriata.dev/#pricing",
    privacyPolicy: "https://uplink.fimbriata.dev/privacy.html",
    termsOfService: "https://uplink.fimbriata.dev/terms.html"
  },
  providerCountry: "IN",
  inferenceRegions: ["World"]

};

