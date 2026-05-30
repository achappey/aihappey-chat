import type { Provider } from "aihappey-types";

export const poe: Provider = {
  name: "Poe",
  description:
    "Chat with the best AI, privately or in a group chat. Explore GPT-5, Claude-Sonnet-4.5, DeepSeek-R1, Veo-3.1, Sora-2, and thousands of others, all on Poe.",
  icons: [{
    src: "https://poe.com/favicon.ico"
  }],
  urls: {
    homepage: "https://poe.com",
    docs: "https://poe.com/api",
    privacyPolicy: "https://poe.com/privacy",
    termsOfService: "https://poe.com/tos"
  },
  providerCountry: "US",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

