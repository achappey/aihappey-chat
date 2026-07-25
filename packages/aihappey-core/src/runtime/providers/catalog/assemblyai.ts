import type { Provider } from "aihappey-types";

export const assemblyai: Provider = {
  name: "AssemblyAI",
  description:
    "With AssemblyAI's industry-leading Speech AI models, transcribe speech to text and extract insights from your voice data.",
  icons: [
    {
      src: "https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/light/assemblyai-color.png",
    },
  ],
  urls: {
    homepage: "https://www.assemblyai.com",
    docs: "https://www.assemblyai.com/docs",
    pricing: "https://www.assemblyai.com/pricing",
    privacyPolicy: "https://www.assemblyai.com/legal/privacy-policy",
    termsOfService: "https://www.assemblyai.com/legal/terms-of-service"
  },
  providerCountry: "US",
  category: "media_voice",
  inferenceRegions: ["World", "Europe"]


};

