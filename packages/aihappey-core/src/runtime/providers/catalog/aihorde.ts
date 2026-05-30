import type { Provider } from "aihappey-types";

export const aihorde: Provider = {
  name: "AIHorde",
  description: "A free, community-powered generation service: volunteers share spare computer power so anyone can generate images and text.",
  icons: [{
    src: "https://nlnet.nl/project/AI-Horde/haidra.logo.svg"
  }],
  urls: {
    homepage: "https://aihorde.net",
    docs: "https://aihorde.net/api",
    privacyPolicy: "https://aihorde.net/privacy",
    termsOfService: "https://aihorde.net/terms"
  },
  providerCountry: "LU",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

