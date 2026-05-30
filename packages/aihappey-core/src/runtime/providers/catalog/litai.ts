import type { Provider } from "aihappey-types";

export const litai: Provider = {
  name: "LitAI",
  description: "LitAI is an LLM router (OpenAI format) and minimal agent framework. Chat with any model (ChatGPT, Anthropic, etc) in one line with retries, fallbacks, unified billing, and logging. Build agents with tool use in clean, testable Python - no magic, no flaky APIs, no heavy frameworks.",
  icons: [{
    src: "https://avatars.githubusercontent.com/u/58386951?s=200&v=4"
  }],
  urls: {
    homepage: "https://lightning.ai/docs/litai/home",
    docs: "https://lightning.ai/docs/litai/api-reference/llm-api"
  },
  category: "gateway_router",
  inferenceRegions: ["World"]

};

