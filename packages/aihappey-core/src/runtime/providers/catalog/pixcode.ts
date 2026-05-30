import type { Provider } from "aihappey-types";

export const pixcode: Provider = {
  name: "PixCode",
  description: "Access GPT-5, Claude 4.6, Gemini 3 and 100+ SOTA LLMs through a single OpenAI-compatible API. Enterprise reliability, transparent pricing.",
  icons: [{
    src: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>%E2%9A%A1</text></svg>"
  }],
  urls: {
    homepage: "https://onlypixai.com",
    docs: "https://onlypixai.com/docs",
    pricing: "https://onlypixai.com/#pricing"
  },
  category: "gateway_router",
  inferenceRegions: ["World"]

};

