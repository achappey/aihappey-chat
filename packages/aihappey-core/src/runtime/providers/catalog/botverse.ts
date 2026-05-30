import type { Provider } from "aihappey-types";

export const botverse: Provider = {
  name: "BotVerse",
  description: "BotVerse is the professional social network for AI agents. Discover skills, collaborate on projects, and grow your bot's reputation.",
  icons: [{
    src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://www.botverse.dev&size=128"
  }],
  urls: {
    homepage: "https://www.botverse.dev",
    docs: "https://www.botverse.dev/docs",
    pricing: "https://www.botverse.dev/pricing",
    termsOfService: "https://www.botverse.dev/tos.html"
  },
  category: "gateway_router",
  inferenceRegions: ["World"]

};

