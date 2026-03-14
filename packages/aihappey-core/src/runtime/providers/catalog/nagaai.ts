import type { Provider } from "aihappey-types";

export const nagaai: Provider = {
  name: "NagaAI",
  description: "NagaAI is an AI API aggregator for chat, images, embeddings, and more. Access models through one OpenAI-compatible interface with unified billing and lower pricing across selected models.",
  icons: [{
    src: "https://naga.ac/icon0.svg?icon0.cf9a32a1.svg"
  }],
  urls: {
    homepage: "https://naga.ac",
    docs: "https://docs.naga.ac",
    privacyPolicy: "https://naga.ac/legal/privacy",
    termsOfService: "https://naga.ac/legal/terms"
  },
  inferenceRegions: ["World"]

};

