import type { Provider } from "aihappey-types";

export const corriente: Provider = {
  name: "Corriente",
  description: "One API key. 368 models. 7 bare-metal nodes. OpenAI-compatible. No rate surprises. Your data never leaves our hardware.",
  icons: [{
    src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://corriente.ai&size=128"
  }],
  urls: {
    homepage: "https://corriente.ai",
    docs: "https://corriente.ai/#pricing"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]

};

