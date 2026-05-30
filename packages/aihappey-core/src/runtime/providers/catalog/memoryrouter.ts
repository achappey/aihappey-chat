import type { Provider } from "aihappey-types";

export const memoryrouter: Provider = {
  name: "MemoryRouter",
  description: "Your AI forgets what you told it yesterday. We fixed that. Two commands.",
  icons: [{
    src: "https://memoryrouter.ai/logo.png"
  }],
  urls: {
    homepage: "https://memoryrouter.ai",
    docs: "https://docs.memoryrouter.ai",
    pricing: "https://memoryrouter.ai/#pricing",
    privacyPolicy: "https://memoryrouter.ai/privacy",
    termsOfService: "https://memoryrouter.ai/terms"
  },
  providerCountry: "US",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

