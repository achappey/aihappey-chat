import type { Provider } from "aihappey-types";

export const textsynth: Provider = {
  name: "TextSynth",
  description: "TextSynth provides access to large language, text-to-image, text-to-speech or speech-to-text models such as Mistral, Llama, Stable Diffusion, Whisper thru a REST API and a playground.",
  icons: [{
    src: "https://cdn-1.webcatalog.io/catalog/textsynth/textsynth-icon-filled-256.png?v=1719828380535"
  }],
  urls: {
    homepage: "https://textsynth.com",
    docs: "https://textsynth.com/documentation.html",
    pricing: "https://textsynth.com/pricing.html",
    privacyPolicy: "https://textsynth.com/privacy.html",
    termsOfService: "https://textsynth.com/tos.html"
  },
  providerCountry: "FR",
  inferenceRegions: ["Europe"]

};

