import type { Provider } from "aihappey-types";

export const cloister: Provider = {
  name: "Cloister",
  description: "Sealed-room LLM inference. Your prompt enters a hardware-sealed enclave, the model runs, the answer leaves. The host can't read it. The model operator can't read it. We can't read it. Private by physics, not by policy.",
  icons: [{
    src: "https://cloister.space/img/og-cloister.png"
  }],
  urls: {
    homepage: "https://cloister.space",
    docs: "https://cloister.space/docs",
    pricing: "https://cloister.space/#pricing",
    termsOfService: "https://cloister.space/disclaimer"
  },
  inferenceRegions: ["World"]

};

