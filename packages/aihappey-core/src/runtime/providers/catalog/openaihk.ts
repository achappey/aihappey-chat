import type { Provider } from "aihappey-types";

export const openaihk: Provider = {
  name: "OpenAIHK",
  description: "OPENAI HK one-stop AI model relay and aggregation, low-cost access to models such as GPT-5, Suno, Flux, Midjourney, Claude, Gemini, Grok, DeepSeek, Riffusion, Veo3, Pixverse, etc.; stable and highly available, updated in a timely manner, easily build applications for chat, image generation, music, and video.",
  icons: [{
    src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTOATHfO0yr0Dnrpx-czKTdirN_0wLIkoM28Q&s"
  }],
  urls: {
    homepage: "https://www.openai-hk.com",
    docs: "https://www.openai-hk.com/docs",
    console: "https://www.openai-hk.com/v3/ai"
  },
  providerCountry: "CN",
  inferenceRegions: ["World"]

};

