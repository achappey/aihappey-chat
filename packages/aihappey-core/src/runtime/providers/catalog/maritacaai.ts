import type { Provider } from "aihappey-types";

export const maritacaai: Provider = {
  name: "MaritacaAI",
  description:
    "Maritaca AI: IA Brasileira é pioneira no desenvolvimento de LLM para o português. Nossa missão é trazer IA de ponta para o Brasil com soluções inovadoras como Maritalk e LLM Sabiá.",
  icons: [
    {
      src: "https://static.wixstatic.com/media/ebd79d_3601105d0b1c46198da7ad9b6e80e56b~mv2.png"
    }
  ],
  urls: {
    homepage: "https://www.maritaca.ai",
    docs: "https://docs.maritaca.ai",
    privacyPolicy: "https://www.maritaca.ai/privacidade",
    termsOfService: "https://www.maritaca.ai/termos",
    console: "https://plataforma.maritaca.ai"
  },
  providerCountry: "BR",
  category: "model_provider",
  inferenceRegions: ["World"]

};

