import type { Provider } from "aihappey-types";

export const apifree: Provider = {
  name: "APIFree",
  description: "Access multiple AI models through one free API with APIFree — a one-stop platform for free AI APIs, multimodal models, and simplified integration without managing multiple vendor accounts.",
  icons: [{
    src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://apifree.ai&size=128"
  }],
  urls: {
    homepage: "https://www.apifree.ai",
    docs: "https://docs.apifree.ai",
    privacyPolicy: "https://docs.apifree.ai/terms-privacy/privacy-policy",
    termsOfService: "https://docs.apifree.ai/terms-privacy/service-agreement"
  },
  providerCountry: "SG",
  inferenceRegions: ["World"]

};

