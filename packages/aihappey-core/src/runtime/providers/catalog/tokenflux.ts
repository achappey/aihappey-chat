import type { Provider } from "aihappey-types";

export const tokenflux: Provider = {
  name: "TokenFlux",
  description: "TokenFlux provides developers a single, unified API to access all leading Large Language Models and a powerful network of ~600 MCP servers to seamlessly distribute and manage AI Agents. Streamline your AI development and deploy intelligent agents at scale with unprecedented ease.",
  icons: [{
    src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQQhVHsVpjnHiM-cNcSHkVIXvmYJsYPjaF5aA&s"
  }],
  urls: {
    homepage: "https://tokenflux.ai",
    docs: "https://tokenflux.ai/docs",
    pricing: "https://tokenflux.ai/models",
    privacyPolicy: "https://tokenflux.ai/docs/legal/privacy-policy",
    termsOfService: "https://tokenflux.ai/docs/legal/terms-of-use"
  },
  providerCountry: "US",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

