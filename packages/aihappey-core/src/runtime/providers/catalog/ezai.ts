import type { Provider } from "aihappey-types";

export const ezai: Provider = {
  name: "EzAI",
  description: "Access Claude, GPT & Gemini AI models at 50% less cost. One API endpoint for 20+ models. Works with Claude Code, Cursor & Cline. Free tier available",
  icons: [{
    src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://ezaiapi.com&size=128"
  }],
  urls: {
    homepage: "https://ezaiapi.com",
    docs: "https://ezaiapi.com/docs",
    pricing: "https://ezaiapi.com/pricing",
    privacyPolicy: "https://ezaiapi.com/#",
    termsOfService: "https://ezaiapi.com/#"
  },
  providerCountry: "VN",
  inferenceRegions: ["World"]

};

