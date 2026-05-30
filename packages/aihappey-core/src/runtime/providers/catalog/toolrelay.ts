import type { Provider } from "aihappey-types";

export const toolrelay: Provider = {
  name: "ToolRelay",
  description: "Install once into Claude Code, Codex, Cursor or Windsurf. Your agent gains search, web reads, image generation and document parsing, billed in credits.",
  icons: [{
    src: "https://toolrelay.dev/logo.svg"
  }],
  urls: {
    homepage: "https://toolrelay.dev",
    docs: "https://toolrelay.dev/docs",
    pricing: "https://toolrelay.dev/pricing",
    privacyPolicy: "https://toolrelay.dev/privacy-policy",
    termsOfService: "https://toolrelay.dev/terms-of-service"
  },
  category: "search_data",
  inferenceRegions: ["World"]

};

