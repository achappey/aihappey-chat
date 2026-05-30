import type { Provider } from "aihappey-types";

export const jassieai: Provider = {
  name: "JassieAI",
  description: "Access text, image, video, audio, and code generation models through a single, unified API.",
  icons: [{
    src: "https://jassie.ai/favicon.svg"
  }],
  urls: {
    homepage: "https://jassie.ai",
    docs: "https://jassie.ai/docs",
    privacyPolicy: "https://jassie.ai/privacy",
    termsOfService: "https://jassie.ai/terms"
  },
  category: "media_voice",
  inferenceRegions: ["World"]

};

