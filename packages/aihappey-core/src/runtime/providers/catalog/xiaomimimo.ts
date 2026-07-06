import type { Provider } from "aihappey-types";

export const xiaomimimo: Provider = {
  name: "XiaomiMIMO",
  description: "Experience the powerful capabilities of Xiaomi MiMo's large-scale model now and explore the infinite possibilities of AI.",
  icons: [{
    src: "https://avatars.githubusercontent.com/u/1309360?s=280&v=4"
  }],
  urls: {
    homepage: "https://mimo.xiaomi.com/",
    docs: "https://platform.xiaomimimo.com/#/docs",
    console: "https://platform.xiaomimimo.com/#/console",
    privacyPolicy: "https://platform.xiaomimimo.com/#/docs/terms/privacy-policy",
    termsOfService: "https://platform.xiaomimimo.com/#/docs/terms/user-agreement"
  },
  providerCountry: "SG",
  category: "gateway_router",
  inferenceRegions: ["World"],
  apiBaseUrl: "https://api.xiaomimimo.com",
  chatEndpoints: ["/v1/chat/completions", "/v1/messages"],

};

