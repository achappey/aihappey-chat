import type { Provider } from "aihappey-types";

export const freeinference: Provider = {
  name: "FreeInference",
  description: "Free LLM inference for research, built at Harvard SEAS.",
  icons: [{
    src: "https://www.seas.harvard.edu/sites/default/files/images/About%20SEAS/image_large.png"
  }],
  urls: {
    homepage: "https://freeinference.org",
    docs: "https://doc.freeinference.org",
    termsOfService: "https://freeinference.org/terms"
  },
  providerCountry: "US",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

