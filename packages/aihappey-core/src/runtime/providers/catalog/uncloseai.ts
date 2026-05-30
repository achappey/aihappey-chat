import type { Provider } from "aihappey-types";

export const uncloseai: Provider = {
  name: "UncloseAI",
  description: "At uncloseai., we offer free AI services powered by multiple AI models and a TTS (Text-to-Speech) endpoint. Our mission is to provide accessible AI tools for everyone, embodying the principles of both free as in beer & free as in freedom.",
  icons: [{
    src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://uncloseai.com&size=128"
  }],
  urls: {
    homepage: "https://uncloseai.com",
    docs: "https://uncloseai.com/uncloseai-js.html",
    privacyPolicy: "https://uncloseai.com/privacy-policy.html",
    termsOfService: "https://uncloseai.com/terms-of-use.html"
  },
  providerCountry: "US",
  category: "media_voice",
  inferenceRegions: ["World"]

};

