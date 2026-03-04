import type { Provider } from "aihappey-types";

export const speechmatics: Provider = {
  name: "Speechmatics",
  description: "Speechmatics offer the most accurate AI speech technology for enterprise - with AI transcription, real-time translation and text-to-speech components.",
  icons: [
    {
      src: "https://upload.wikimedia.org/wikipedia/commons/1/1a/SM-Icon-Dark_Cyan1000.png"
    }
  ],
  urls: {
    homepage: "https://www.speechmatics.com",
    docs: "https://docs.speechmatics.com",
    pricing: "https://www.speechmatics.com/pricing",
    privacyPolicy: "https://www.speechmatics.com/legal/privacy-policy",
    termsOfService: "https://www.speechmatics.com/legal/terms-of-service",
    console: "https://portal.speechmatics.com"
  },
  providerCountry: "GB",
  inferenceRegions: ["World"]

};

