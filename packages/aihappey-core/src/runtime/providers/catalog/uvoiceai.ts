import type { Provider } from "aihappey-types";

export const uvoiceai: Provider = {
  name: "UVoiceAI",
  description: "UVoice AI offers professional Text to Speech service for various uses, from product reviews and podcasts to viral clips, with the Voice Cloning feature that helps you convert system voices into your own voice in minutes. : English, Filipino, हिन्दी, Bahasa Indonesia, 日本語, ភាសាខ្មែរ, 한국어, ພາສາລາວ, Bahasa Melayu, မြန်မာစာ, ภาษาไทย, Tiếng Việt, 中文.",
  icons: [
    {
      src: "https://uvoice.app/images/icons/icon-192x192.png"
    }
  ],
  urls: {
    homepage: "https://uvoice.app",
    docs: "https://uvoice.app/api-docs",
    pricing: "https://uvoice.app/#pricing",
    termsOfService: "https://uvoice.app/terms-of-service",
    privacyPolicy: "https://uvoice.app/privacy-policy"
  },
  providerCountry: "TH",
  category: "media_voice",
  inferenceRegions: ["World"]
};

