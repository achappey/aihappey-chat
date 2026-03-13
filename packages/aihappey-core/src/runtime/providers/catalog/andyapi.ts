import type { Provider } from "aihappey-types";

export const andyapi: Provider = {
  name: "AndyAPI",
  description: "Distributed AI compute pool with OpenAI-compatible endpoints, automatic load balancing, and failover support.",
  icons: [{
    src: "https://andy.mindcraft-ce.com/static/favicon.ico"
  }],
  urls: {
    homepage: "https://andy.mindcraft-ce.com",
    docs: "https://andy.mindcraft-ce.com/andy-docs"
  },
  experimental: true,
  inferenceRegions: ["World"]

};

