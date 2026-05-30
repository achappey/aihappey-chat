import type { Provider } from "aihappey-types";

export const apekey: Provider = {
  name: "Apekey",
  description: "Stop Overpaying for AI APIs. Access Groq, Together AI, and Fireworks AI via one endpoint. Smart routing + caching: Save up to 90% on AI inference costs.",
  icons: [{
    src: "https://apekey.ai/logo.png"
  }],
  urls: {
    homepage: "https://apekey.ai",
    pricing: "https://apekey.ai/#pricing",
    docs: "https://apekey.ai/docs",
    console: "https://apekey.ai/dashboard",
    privacyPolicy: "https://apekey.ai/privacy",
    termsOfService: "https://apekey.ai/terms"
  },
  providerCountry: "DE",
  category: "inference_compute",
  inferenceRegions: ["World"]

};

