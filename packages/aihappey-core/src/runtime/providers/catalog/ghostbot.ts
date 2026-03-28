import type { Provider } from "aihappey-types";

export const ghostbot: Provider = {
  name: "Ghostbot",
  description:
    "Generate stunning AI images with state-of-the-art models.",
  icons: [{
    src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://infip.pro&size=128"
  }],
  urls: {
    homepage: "https://infip.pro",
    docs: "https://infip.pro/api-keys",
    pricing: "https://infip.pro/plans",
    privacyPolicy: "https://infip.pro/privacy",
    termsOfService: "https://infip.pro/terms"
  },
  inferenceRegions: ["World"]

};

