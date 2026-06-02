import type { Provider } from "aihappey-types";

export const crofai: Provider = {
  name: "CrofAI",
  description: "CrofAI — powerful models, crazy cheap pricing. Access the best OSS LLMs through an OpenAI-compatible API.",
  icons: [{
    src: "https://files.nahcrof.com/file/crofaicolor.png"
  }],
  urls: {
    homepage: "https://crof.ai",
    docs: "https://crof.ai/docs",
    pricing: "https://crof.ai/pricing",
    privacyPolicy: "https://crof.ai/privacy",
    termsOfService: "https://crof.ai/tos"
  },
  providerCountry: "US",
  category: "inference_compute",
  inferenceRegions: ["World"]

};

