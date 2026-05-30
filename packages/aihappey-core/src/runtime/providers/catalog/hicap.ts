import type { Provider } from "aihappey-types";

export const hicap: Provider = {
  name: "Hicap",
  description: "Managed Capacity Infrastructure. Smarter. Cheaper. Faster.",
  icons: [{
    src: "https://hicap.ai/favicon-dark.svg"
  }],
  urls: {
    homepage: "https://hicap.ai",
    docs: "https://docs.hicap.ai",
    console: "https://platform.hicap.ai"
  },
  providerCountry: "US",
  category: "inference_compute",
  inferenceRegions: ["World"]

};

