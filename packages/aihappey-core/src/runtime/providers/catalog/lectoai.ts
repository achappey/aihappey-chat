import type { Provider } from "aihappey-types";

export const lectoai: Provider = {
  name: "LectoAI",
  description: "Fast Machine Translation API at reasonable prices.",
  icons: [
    {
      src: "https://lecto.ai/favicon.svg"
    }
  ],
  urls: {
    homepage: "https://lecto.ai",
    pricing: "https://lecto.ai/pricing",
    docs: "https://dashboard.lecto.ai/docs",
    console: "https://dashboard.lecto.ai",
    termsOfService: "https://dashboard.lecto.ai/terms"
  },
  providerCountry: "HK",
  category: "media_voice",
  inferenceRegions: ["World"]
};

