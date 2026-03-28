import type { Provider } from "aihappey-types";

export const ocrskill: Provider = {
  name: "OCRSkill",
  description: "Give your AI agents super-fast vision. SOTA OCR on Nvidia hardware with zero-friction OpenAI-compatible REST API. Extract text in milliseconds.",
  icons: [{
    src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://ocrskill.com&size=128"
  }],
  urls: {
    homepage: "https://www.ocrskill.com",
    docs: "https://www.ocrskill.com/#docs",
    pricing: "https://www.ocrskill.com/#pricing"
  },
  inferenceRegions: ["World"]

};

