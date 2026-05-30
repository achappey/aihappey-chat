import type { Provider } from "aihappey-types";

export const dedaluslabs: Provider = {
  name: "DedalusLabs",
  description: "The MCP gateway that connects any LLM to any tool. One API, an agent SDK, cloud hosting, and a marketplace for MCP servers.",
  icons: [{
    src: "https://dedaluslabs.ai/images/logos/logo.png"
  }],
  urls: {
    homepage: "https://www.dedaluslabs.ai",
    console: "https://www.dedaluslabs.ai/dashboard",
    docs: "https://docs.dedaluslabs.ai",
    pricing: "https://www.dedaluslabs.ai/pricing",
    privacyPolicy: "https://www.dedaluslabs.ai/privacy",
    termsOfService: "https://www.dedaluslabs.ai/terms"
  },
  providerCountry: "US",
  category: "inference_compute",
  inferenceRegions: ["World"]

};

