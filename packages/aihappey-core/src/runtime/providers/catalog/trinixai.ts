import type { Provider } from "aihappey-types";

export const trinixai: Provider = {
  name: "TrinixAI",
  description: "Run AI in production without the headaches. Drop-in AI that works like OpenAI—often cheaper—with the same clients you already use. One key routes free local models and paid cloud tiers: chat, generate, embed, and web search, plus limits your team (and finance) can live with.",
  icons: [{
    src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://api.trinix.gg&size=128"
  }],
  urls: {
    homepage: "https://api.trinix.gg",
    docs: "https://api.trinix.gg/docs",
    pricing: "https://api.trinix.gg/#pricing"
  },
  inferenceRegions: ["World"]
};

