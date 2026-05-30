import type { Provider } from "aihappey-types";

export const elevenlabs: Provider = {
  name: "ElevenLabs",
  description:
    "Create lifelike speech with our AI voice generator and voice agents platform. Access 5,000+ voices in 70+ languages.",
  icons: [{
    src: "https://help.elevenlabs.io/hc/theming_assets/01HZQ08B6SDY5X53YN9ABG4B99"
  }],
  urls: {
    homepage: "https://elevenlabs.io",
    pricing: "https://elevenlabs.io/pricing",
    docs: "https://elevenlabs.io/docs",
    privacyPolicy: "https://elevenlabs.io/privacy",
    termsOfService: "https://elevenlabs.io/terms"
  },
  providerCountry: "US",
  category: "media_voice",
  inferenceRegions: ["World"]

};

