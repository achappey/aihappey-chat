import type { Provider } from "aihappey-types";

export const ollama: Provider = {
  name: "Ollama",
  description: "Ollama is the easiest way to automate your work using open models, while keeping your data safe.",
  icons: [{
    src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRFVZ9JJ3PrF8m-lYW-rPzJpZJVMzq3CwpdsQ&s"
  }],
  urls: {
    homepage: "https://ollama.com",
    docs: "https://docs.ollama.com",
    pricing: "https://ollama.com/pricing"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]

};

