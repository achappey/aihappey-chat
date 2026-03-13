import type { Provider } from "aihappey-types";

export const pixia: Provider = {
  name: "PixIA",
  description: "PixIA Cloud é uma alternativa brasileira ao modelo de API de IA da OpenAI: AI as a Service em nuvem para criar sites, apps e sistemas com chat, vision, embeddings, streaming e billing por uso.",
  icons: [{
    src: "https://pixia.cloud/static/icons/icon.svg"
  }],
  urls: {
    homepage: "https://pixia.cloud",
    docs: "https://pixia.cloud/apidoc",
    pricing: "https://pixia.cloud/#pricing"
  },
  providerCountry: "BR",
  inferenceRegions: ["World"]

};

