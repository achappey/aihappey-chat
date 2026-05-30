import type { Provider } from "aihappey-types";

export const libertai: Provider = {
  name: "LibertAI",
  description: "LibertAI is a decentralized, private AI platform powered by Aleph Cloud. Open-source models, confidential inference API, and AI agents — with privacy you can verify.",
  icons: [{
    src: "https://libertai.io/favicon.svg"
  }],
  urls: {
    homepage: "https://libertai.io",
    docs: "https://docs.libertai.io/apis",
    pricing: "https://docs.libertai.io/apis/text/#pricing"
  },
  category: "inference_compute",
  inferenceRegions: ["World"]

};

