import type { Provider } from "aihappey-types";

export const modelrouter: Provider = {
  name: "ModelRouter",
  description: "ModelRouter: unified AI and LLM API. One API for GPT, Claude, embeddings and more. Superfast routing, reliability and speed.",
  icons: [{
    src: "https://modelrouter.app/fav.png"
  }],
  urls: {
    homepage: "https://modelrouter.app",
    docs: "https://modelrouter.app/docs",
    termsOfService: "https://modelrouter.app/terms",
    privacyPolicy: "https://modelrouter.app/privacy",
    pricing: "https://modelrouter.app/pricing"
  },
  category: "gateway_router",
  inferenceRegions: ["World"]

};

