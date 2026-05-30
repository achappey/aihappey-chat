import type { Provider } from "aihappey-types";

export const opeai: Provider = {
  name: "OPEAI",
  description: "Collect top AI tools and conversation experiences, and make intelligence touchable. Whether it's creativity, travel, or learning, it's easy to achieve every target.",
  icons: [
    {
      src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://ope.ai&size=128"
    }
  ],
  urls: {
    homepage: "https://ope.ai",
    docs: "https://docs.ope.ai",
    console: "https://platform.ope.ai"
  },
  providerCountry: "JP",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

