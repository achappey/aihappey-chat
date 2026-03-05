import type { Provider } from "aihappey-types";

export const routmy: Provider = {
  name: "Routmy",
  description:
    "An educational AI community with experimental tools for learning and practice. Explore models, share projects.",
  icons: [{
    src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://rout.my&size=128"
  }],
  urls: {
    homepage: "https://rout.my",
    docs: "https://rout.my/docs",
    console: "https://rout.my/dashboard",
    privacyPolicy: "https://rout.my/privacy",
    termsOfService: "https://rout.my/terms"
  },
  experimental: true,
  inferenceRegions: ["World"]

};

