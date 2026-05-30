import type { Provider } from "aihappey-types";

export const jina: Provider = {
  name: "Jina",
  description:
    "Best-in-class embeddings, rerankers, web reader, deepsearch, small language models. Search AI for multilingual and multimodal data",
  icons: [
    {
      src: "https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/jina.png",
      theme: "dark",
    },
    {
      src: "https://registry.npmmirror.com/@lobehub/icons-static-png/1.74.0/files/light/jina.png",
      theme: "light",
    },
  ],
  urls: {
    homepage: "https://jina.ai",
    docs: "https://jina.ai/docs",
    privacyPolicy: "https://jina.ai/legal/#privacy-policy",
    termsOfService: "https://jina.ai/legal/#terms-and-conditions"
  },
  providerCountry: "DE",
  category: "search_data",
  inferenceRegions: ["World"]

};

