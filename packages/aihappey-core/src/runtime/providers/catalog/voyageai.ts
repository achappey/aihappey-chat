import type { Provider } from "aihappey-types";

export const voyageai: Provider = {
  name: "VoyageAI",
  description: "Voyage AI provides cutting-edge embedding models and rerankers for search and retrieval.",
  icons: [{
    src: "https://blog.voyageai.com/wp-content/uploads/2023/10/logo.png"
  }],
  urls: {
    homepage: "https://www.voyageai.com",
    docs: "https://docs.voyageai.com",
    pricing: "https://docs.voyageai.com/docs/pricing",
    privacyPolicy: "https://www.voyageai.com/privacy",
    termsOfService: "https://www.voyageai.com/tos"
  },
  providerCountry: "US",
  category: "search_data",
  inferenceRegions: ["World"]

};

