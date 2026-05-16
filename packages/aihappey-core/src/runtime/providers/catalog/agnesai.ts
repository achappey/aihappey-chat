import type { Provider } from "aihappey-types";

export const agnesai: Provider = {
  name: "AgnesAI",
  description: "Agnes AI by Sapiens AI is a production-ready generative AI platform that provides fast, scalable, and customizable large language model APIs. Build AI chatbots, agents, content tools, and intelligent workflows with ease. Optimized for enterprise-grade performance, low latency, and seamless integration across applications.",
  icons: [{
    src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuheblxluq8FD1ZBnUScYOY_yZgV8hQpQzmg&s",
    theme: "dark"
  }, {
    src: "https://agnes-ai.com/images/biglogo.png",
    theme: "light"
  }],
  urls: {
    homepage: "https://agnes-ai.com",
    docs: "https://agnes-ai.com/doc",
    privacyPolicy: "https://agnes-ai.com/doc/privacy-policy",
    termsOfService: "https://agnes-ai.com/doc/terms-of-service"
  },
  providerCountry: "SG",
  inferenceRegions: ["World"]

};

