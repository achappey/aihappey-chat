import type { Provider } from "aihappey-types";

export const skypooltoken: Provider = {
  name: "SkypoolToken",
  description: "Skypool Token provides low-cost OpenAI-compatible model access and a provider network for supplying local compute.",
  icons: [{
    src: "https://skypool.xyz/favicon.svg"
  }],
  urls: {
    homepage: "https://skypool.xyz",
    docs: "https://skypool.xyz/docs"
  },
  providerCountry: "CN",
  inferenceRegions: ["World"]

};

