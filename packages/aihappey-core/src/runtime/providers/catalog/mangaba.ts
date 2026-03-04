import type { Provider } from "aihappey-types";

export const mangaba: Provider = {
  name: "Mangaba",
  description: "A plataforma de IA mais completa do Brasil. Acesse GPT-4, Claude, Gemini e +50 modelos com uma única API. SDK MangabaAI oficial.",
  icons: [{
    src: "https://mangaba-ai.vercel.app/images/mangaba-logo.png"
  }],
  urls: {
    homepage: "https://mangaba-api.up.railway.app",
    docs: "https://mangaba-api.up.railway.app/docs",
    pricing: "https://mangaba-api.up.railway.app/#pricing",
    privacyPolicy: "https://mangaba-api.up.railway.app/privacidade",
    termsOfService: "https://mangaba-api.up.railway.app/termos"
  },
  providerCountry: "BR",
  inferenceRegions: ["World"]

};

