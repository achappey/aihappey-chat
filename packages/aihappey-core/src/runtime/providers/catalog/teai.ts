import type { Provider } from "aihappey-types";

export const teai: Provider = {
  name: "TEAI",
  description: "日本の開発者のためのLLM API Gateway。OpenAI互換APIでGPT-4o、Claude、Gemini、DeepSeek等45+モデルを統一利用。東京サーバーで低レイテンシ、円建て請求、インボイス制度対応。Nemotron 9B無料・無制限。",
  icons: [{
    src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%2310b981'/%3E%3Cstop offset='1' stop-color='%2334d399'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='32' height='32' rx='8' fill='url(%23g)'/%3E%3Ctext x='16' y='22' text-anchor='middle' font-size='18' font-weight='900' font-family='system-ui,sans-serif' fill='white'%3Ete%3C/text%3E%3C/svg%3E",
  }],
  urls: {
    homepage: "https://teai.io",
    docs: "https://teai.io/docs",
    pricing: "https://teai.io/pricing",
    privacyPolicy: "https://teai.io/privacy",
    termsOfService: "https://teai.io/terms"
  },
  providerCountry: "CN",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

