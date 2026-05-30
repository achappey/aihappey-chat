import type { Provider } from "aihappey-types";

export const myrouter: Provider = {
  name: "MyRouter",
  description: "Unified API access to 200+ AI models from every provider. Including the ones they don't want you to use.",
  icons: [{
    src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://www.myrouter.ai&size=128"
  }],
  urls: {
    homepage: "https://www.myrouter.ai",
    docs: "https://docs.myrouter.ai/docs/model/overview"
  },
  category: "gateway_router",
  inferenceRegions: ["World"]

};

