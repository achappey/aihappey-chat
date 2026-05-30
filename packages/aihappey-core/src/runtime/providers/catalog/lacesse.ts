import type { Provider } from "aihappey-types";

export const lacesse: Provider = {
  name: "Lacesse",
  description: "Build smarter and faster. Fikra API gives you OpenAI-compatible, high-speed AI access for just $3 per 1 Million tokens.",
  icons: [{
    src: "https://lacesse.co.ke/static/logo.svg"
  }],
  urls: {
    homepage: "https://lacesse.co.ke/api/home",
    docs: "https://lacesse.co.ke/api/docs",
    pricing: "https://lacesse.co.ke/api/home/#pricing"
  },
  providerCountry: "KE",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

