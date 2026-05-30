import type { Provider } from "aihappey-types";

export const token360: Provider = {
  name: "Token360",
  description: "Generate cinematic video clips with Token360's creator studio — one prompt, leading video models, the same infrastructure behind production APIs.",
  icons: [{
    src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJK67s95ikD_dVm-bCpn-7N9qxwWSLT10x0Q&s"
  }],
  urls: {
    homepage: "https://www.token360.ai",
    docs: "https://www.token360.ai/en-US/docs",
    privacyPolicy: "https://www.token360.ai/en-US/legal/privacy",
    termsOfService: "https://www.token360.ai/en-US/legal/terms"
  },
  providerCountry: "US",
  category: "media_voice",
  inferenceRegions: ["World"]

};

