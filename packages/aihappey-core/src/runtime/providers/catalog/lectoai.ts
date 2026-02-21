import type { Provider } from "aihappey-types";

export const lectoai: Provider = {
  name: "LectoAI",
  description: "Fast Machine Translation API at reasonable prices.",
  icons: [
    {
      src: "https://lecto.ai/assets/images/image02.jpg?v=7b019a46"
    }
  ],
  urls: {
    homepage: "https://lecto.ai",
    docs: "https://dashboard.lecto.ai/docs",
    console: "https://dashboard.lecto.ai",
    termsOfService: "https://dashboard.lecto.ai/terms"
  },
  providerCountry: "HK",
  inferenceRegions: ["World"]
};

