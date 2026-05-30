import type { Provider } from "aihappey-types";

export const clod: Provider = {
  name: "Clod",
  description:
    "Discover Clod.io, your go-to platform for a vast array of free LLMs, optimized for low costs through energy-smart routing.",
  icons: [
    {
      src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://clod.io&size=256",
    },
  ],
  urls: {
    homepage: "https://clod.io",
    docs: "https://clod.io/docs",
    console: "https://app.clod.io"
  },
  providerCountry: "CA",
  category: "gateway_router",
  inferenceRegions: ["World"]
};

