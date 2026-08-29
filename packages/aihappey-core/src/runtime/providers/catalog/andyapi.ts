import type { Provider } from "aihappey-types";

export const andyapi: Provider = {
  name: "AndyAPI",
  description: "Andy API — a small, production-minded OpenAI-compatible gateway.",
  urls: {
    homepage: "https://andy.mindcraft-ce.com",
    termsOfService: "https://andy.mindcraft-ce.com/terms",
    privacyPolicy: "https://andy.mindcraft-ce.com/privacy",
    docs: "https://andy.mindcraft-ce.com/docs"
  },
  experimental: true,
  category: "inference_compute",
  inferenceRegions: ["World"]

};

