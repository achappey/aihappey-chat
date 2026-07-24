import type { Provider } from "aihappey-types";

export const addisai: Provider = {
  name: "AddisAI",
  description: "Text-to-speech, speech-to-text, and a fine-tuned language model for Amharic and Afan Oromo.",
  icons: [{ src: "https://platform.addisassistant.com/logo/addis_ai_main_icon.png" }],
  urls: {
    homepage: "https://addisassistant.com",
    docs: "https://docs.addisassistant.com",
    pricing: "https://addisassistant.com/pricing",
    termsOfService: "https://addisassistant.com/terms",
    privacyPolicy: "https://addisassistant.com/privacy"
  },
  providerCountry: "CH",
  category: "model_provider",
  inferenceRegions: ["World"]
};

