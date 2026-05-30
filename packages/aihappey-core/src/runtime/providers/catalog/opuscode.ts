import type { Provider } from "aihappey-types";

export const opuscode: Provider = {
  name: "OpusCode",
  description: "High-performance Claude API gateway with full control over keys, usage, and routing.",
  icons: [{
    src: "https://www.opuscode.pro/favicon.ico?favicon.2b7001c7.ico"
  }],
  urls: {
    homepage: "https://www.opuscode.pro",
    docs: "https://www.opuscode.pro/docs",
    privacyPolicy: "https://www.opuscode.pro/privacy",
    termsOfService: "https://www.opuscode.pro/terms"
  },
  category: "gateway_router",
  inferenceRegions: ["World"]

};

