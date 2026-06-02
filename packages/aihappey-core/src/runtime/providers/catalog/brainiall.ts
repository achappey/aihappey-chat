import type { Provider } from "aihappey-types";

export const brainiall: Provider = {
  name: "Brainiall",
  description: "Specialist AI APIs for regulated industries — 19 specialty APIs plus 5 bundles under one OpenAI-compatible Bearer key. Single endpoint, SOC 2 Type II ready.",
  icons: [{
    src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://app.brainiall.com&size=128"
  }],
  urls: {
    homepage: "https://app.brainiall.com",
    docs: "https://app.brainiall.com/docs-page",
    pricing: "https://app.brainiall.com/pricing"
  },
  providerCountry: "US",
  category: "app_tools",
  inferenceRegions: ["World"]
};

