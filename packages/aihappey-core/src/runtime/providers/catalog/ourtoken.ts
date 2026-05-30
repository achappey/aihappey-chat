import type { Provider } from "aihappey-types";

export const ourtoken: Provider = {
  name: "OurToken",
  description: "Use one unified API to access OpenAI, Claude, GLM, MiniMax and other LLMs. Compare models, prices, and capabilities to find the best fit for your prompts.",
  icons: [{
    src: "https://ourtoken.ai/favicon.ico"
  }],
  urls: {
    homepage: "https://ourtoken.ai",
    privacyPolicy: "https://ourtoken.ai/privacy",
    termsOfService: "https://ourtoken.ai/terms"
  },
  providerCountry: "US",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

