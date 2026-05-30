import type { Provider } from "aihappey-types";

export const atxp: Provider = {
  name: "ATXP",
  description: "ATXP gives AI agents identity, payments, email, and tools in one account. Free to create. Pay only for what your agent uses.",
  icons: [{
    src: "https://atxp.ai/favicons/favicon/favicon-32x32.png"
  }],
  urls: {
    homepage: "https://atxp.ai",
    docs: "https://docs.atxp.ai"
  },
  providerCountry: "US",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

