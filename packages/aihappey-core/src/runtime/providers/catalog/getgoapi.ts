import type { Provider } from "aihappey-types";

export const getgoapi: Provider = {
  name: "GetGoAPI",
  description: "Access multiple AI models through one unified API. Get GPT-4, Claude, Gemini, DeepSeek at 50% lower cost. Simple integration, pay-as-you-go pricing.",
  icons: [{
    src: "https://getgoapi.com/logo.png"
  }],
  urls: {
    homepage: "https://getgoapi.com",
    docs: "https://getgoapi.com/en/docs",
    pricing: "https://getgoapi.com/en/pricing",
    privacyPolicy: "https://getgoapi.com/en/privacy",
    termsOfService: "https://getgoapi.com/en/terms"
  },
  providerCountry: "CN",
  inferenceRegions: ["World"]

};

