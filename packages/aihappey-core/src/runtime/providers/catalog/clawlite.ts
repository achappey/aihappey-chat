import type { Provider } from "aihappey-types";

export const clawlite: Provider = {
  name: "ClawLite",
  description: "Install OpenClaw in minutes with a friendly, guided wizard.",
  icons: [{
    src: "https://www.clawlite.ai/clawlitelogo.png"
  }],
  urls: {
    homepage: "https://www.clawlite.ai",
    docs: "https://www.clawlite.ai/clawrouter/api",
    pricing: "https://www.clawlite.ai/pricing"
  },
  inferenceRegions: ["World"]

};

