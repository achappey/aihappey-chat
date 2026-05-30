import type { Provider } from "aihappey-types";

export const luminoai: Provider = {
  name: "LuminoAI",
  description: "Rent GPUs in India and call hosted AI models from one Lumino account. Pay in INR, use per-second GPU billing, and access chat, video, and speech APIs.",
  icons: [{
    src: "https://luminoai.co.in/logo.png"
  }],
  urls: {
    homepage: "https://luminoai.co.in",
    docs: "https://luminoai.co.in/openai-compatible-api-india",
    privacyPolicy: "https://luminoai.co.in/privacy",
    termsOfService: "https://luminoai.co.in/terms"
  },
  providerCountry: "IN",
  category: "media_voice",
  inferenceRegions: ["World"]

};

