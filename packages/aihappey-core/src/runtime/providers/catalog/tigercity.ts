//import type { Provider } from "aihappey-types";

import type { Provider } from "aihappey-types";

export const tigercity: Provider = {
  name: "TigerCity",
  description: "Norwegian AI platform for continuous agent learning. Build adaptive AI agents through simplified LLM fine-tuning—no ML expertise required.",
  icons: [
    {
      src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://tigercity.ai&size=128"
    }
  ],
  urls: {
    homepage: "https://tigercity.ai/",
    docs: "https://tigercity.ai/apiref",
    console: "https://tigercity.ai/playground"
  },
  providerCountry: "NO",
  experimental: true,
  inferenceRegions: ["World"]

};

