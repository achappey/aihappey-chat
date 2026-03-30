import type { Provider } from "aihappey-types";

export const sawtia: Provider = {
  name: "SawtIA",
  description: "Rejoignez les entreprises qui font confiance à Sawtia pour leurs solutions vocales en Darija.",
  icons: [{
    src: "https://sawtia.ma/assets/img/icon%20sawtia.png"
  }],
  urls: {
    homepage: "https://sawtia.ma",
    docs: "https://sawtia.ma/api-docs",
    pricing: "https://sawtia.ma/pricing",
    termsOfService: "https://castingvoixoff.ma/condition-of-sale"
  },
  providerCountry: "MA",
  inferenceRegions: ["World"]

};

