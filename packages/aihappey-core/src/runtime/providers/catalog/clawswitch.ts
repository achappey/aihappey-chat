import type { Provider } from "aihappey-types";

export const clawswitch: Provider = {
  name: "ClawSwitch",
  description: "Intelligent LLM proxy that auto-routes AI agent requests to the cheapest capable model. Drop-in compatible with OpenClaw, LangChain, AutoGen. One URL change, instant savings.",
  icons: [{
    src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://www.clawswitch.com&size=128"
  }],
  urls: {
    homepage: "https://www.clawswitch.com",
    docs: "https://www.clawswitch.com/docs",
    console:"https://app.clawswitch.com",
    pricing: "https://www.clawswitch.com/#pricing"
  },
  inferenceRegions: ["World"]

};

