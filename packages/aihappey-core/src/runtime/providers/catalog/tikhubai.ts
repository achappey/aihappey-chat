import type { Provider } from "aihappey-types";

export const tikhubai: Provider = {
  name: "TikHubAI",
  description: "Access OpenAI, Claude, Gemini, Sora, Kling & Veo APIs at 13–71% off official pricing. One endpoint, no SDK required, no vendor lock-in.",
  icons: [{
    src: "https://ai.tikhub.io/logo.png"
  }],
  urls: {
    homepage: "https://ai.tikhub.io",
    docs: "https://ai-docs.tikhub.io",
    console:"https://ai.tikhub.io/console"
  },
  providerCountry: "CN",
  inferenceRegions: ["World"]

};

