import type { Provider } from "aihappey-types";

export const freellmapikeys: Provider = {
  name: "FreeLLMAPIKeys",
  description: "The easiest way to access LLM APIs for free — no credit card, no registration. Copy a key, paste it into your app, and start building.",
  icons: [{
    src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDfC1lHYN3oYb9YGTDCqnPeOaaw2Pqlr96CA&s",
  }],
  urls: {
    homepage: "https://alistaitsacle.github.io/free-llm-api-keys",
    docs: "https://github.com/alistaitsacle/free-llm-api-keys"
  },
  category: "gateway_router",
  inferenceRegions: ["World"]

};

