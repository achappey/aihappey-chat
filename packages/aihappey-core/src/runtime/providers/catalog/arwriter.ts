import type { Provider } from "aihappey-types";

export const arwriter: Provider = {
  name: "ARWriter",
  description: "ARWriter منصة كتابة عربية بالذكاء الاصطناعي: مكتبة أوامر (Prompt Library)، قوالب كتابة جاهزة، مشاريع لتنظيم العمل، ودعم كامل للهجات.",
  icons: [
    {
      src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://arwriter.ai&size=128"
    }
  ],
  urls: {
    homepage: "https://arwriter.ai",
    docs: "https://api.arwriter.ai/docs",
    console: "https://api.arwriter.ai",
    pricing: "https://app.arwriter.ai/billing",
    privacyPolicy: "https://arwriter.ai/privacy",
    termsOfService: "https://arwriter.ai/terms"
  },
  providerCountry: "EG",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

