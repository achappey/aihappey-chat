import type { Provider } from "aihappey-types";

export const cortex: Provider = {
  name: "Cortex",
  description: "Claude 4.5, GPT-5, Grok and all next-gen models. Unlimited AI power with a single API integration.",
  icons: [{
    src: "https://cortexai.com.tr/favicon.ico"
  }],
  urls: {
    homepage: "https://cortexai.io",
    docs: "https://cortexai.com.tr",
    termsOfService: "https://cortexai.com.tr/#kullanim-sarti"
  },
  providerCountry: "TR",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

