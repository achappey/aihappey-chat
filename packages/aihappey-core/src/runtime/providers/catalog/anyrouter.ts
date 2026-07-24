import type { Provider } from "aihappey-types";

export const anyrouter: Provider = {
  name: "AnyRouter",
  description: "Access AI models from multiple providers through a single unified API. Compare pricing, latency, and capabilities in real-time.",
  icons: [{
    src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3epToGyxYvyeFDy9h7FEM2ErT2rbCLnWcq7vCxlIJ3g&s"
  }],
  urls: {
    homepage: "https://anyrouter.dev",
    termsOfService: "https://anyrouter.dev/terms",
    privacyPolicy: "https://anyrouter.dev/privacy",
    pricing: "https://anyrouter.dev/pricing",
    docs: "https://anyrouter.dev/docs"
  },
  category: "gateway_router",
  providerCountry:"CN",
  inferenceRegions: ["World"]

};

