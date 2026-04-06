import type { Provider } from "aihappey-types";

export const holysheepai: Provider = {
  name: "HolySheepAI",
  description: "HolySheep AI 提供 Claude Code 国内 API、OpenClaw 国内使用、Anthropic API 中国直连、OpenAI API 国内直连、GPT-5 API 国内、Gemini API 中转等服务。无需翻墙，¥1=$1，稳定低延迟，注册即用。",
  icons: [{
    src: "https://holysheep.ai/favicon.svg"
  }],
  urls: {
    homepage: "https://holysheep.ai",
    docs: "https://holysheep.ai/app/tutorial",
    pricing: "https://holysheep.ai/app/pricing"
  },
  providerCountry: "CN",
  inferenceRegions: ["World"]

};

