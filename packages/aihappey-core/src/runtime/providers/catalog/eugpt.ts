import type { Provider } from "aihappey-types";

export const eugpt: Provider = {
  name: "EuGPT",
  description: "EuGPT: Die europäische KI-Plattform. DSGVO-konformer KI-Chat, API-Zugang und Beratung für KI-Transformation — gehostet in Deutschland.",
  icons: [{
    src: "https://eugpt.eu/favicon.svg"
  }],
  urls: {
    homepage: "https://eugpt.eu",
    docs: "https://eugpt.eu/en/developers",
    privacyPolicy: "https://eugpt.eu/en/privacy",
    termsOfService: "https://eugpt.eu/en/agb"
  },
  providerCountry: "DE",
  category: "gateway_router",
  inferenceRegions: ["Europe"]

};

