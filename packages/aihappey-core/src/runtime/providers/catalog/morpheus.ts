import type { Provider } from "aihappey-types";

export const morpheus: Provider = {
  name: "Morpheus",
  description: "Decentralized AI. The first peer-to-peer network for general purpose AI, powered by MOR.",
  icons: [
    {
      src: "https://s2.coinmarketcap.com/static/img/coins/200x200/31656.png"
    }
  ],
  urls: {
    homepage: "https://mor.org",
    console: "https://app.mor.org",
    pricing: "https://mor.org/inference-api/models",
    docs: "https://apidocs.mor.org",
    privacyPolicy: "https://mor.org/privacy"
  },
  providerCountry: "US",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

