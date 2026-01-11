import type { Icon } from "@modelcontextprotocol/sdk/types";

export type Provider = {
    name: string;
    url: string;
    description?: string
    icons: Icon[];
    hosting?: "us" | "europe" | "asia" | "unknown";
};

export const PROVIDERS: Record<string, Provider> = {
    openai: {
        name: "OpenAI",
        description: "We believe that our research will ultimately lead to artificial general intelligence, a system capable of solving problems at a human level. Our mission is to build safe and valuable AGI.",
        icons: [
            {
                src: "https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/openai.png",
                theme: "dark"
            },
            {
                src: "https://registry.npmmirror.com/@lobehub/icons-static-png/1.74.0/files/light/openai.png",
                theme: "light"
            }
        ],
        url: "https://openai.com"
    },
    runway: {
        name: "Runway",
        description: "We are building foundational General World Models that will be capable of simulating all possible worlds and experiences. The next frontier of intelligence will come from models that can understand, perceive, generate and act in the world.",
        icons: [
            {
                src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQQE01cLcJx7cJONWLVmk5tRBhGB0LIJ8SqSQ&s"
            }
        ],
        url: "https://runwayml.com"
    },
    aiml: {
        name: "AIML",
        description: "Access over 400 AI models with low latency and high scalability AI APIs.",
        icons: [
            {
                src: "https://media.licdn.com/dms/image/v2/D560BAQFF5cVF9c_cOw/company-logo_200_200/company-logo_200_200/0/1709201452469/aimlapi_logo?e=2147483647&v=beta&t=l2fmaW9qdhOZ9wR3sukZpFYETyNGEA5jatU66ECxdFQ",
                theme: "dark"
            },
            {
                src: "https://cdn.prod.website-files.com/65b8f36fa600366bc7cf9a67/67600ef9b7e887578cc772f0_aimlapi_logo_square_vector.png",
                theme: "light"
            }
        ],
        url: "https://aimlapi.com"
    },
    anthropic: {
        name: "Anthropic",
        description: "Anthropic is an AI safety and research company that's working to build reliable, interpretable, and steerable AI systems.",
        icons: [
            {
                src: "https://upload.wikimedia.org/wikipedia/commons/1/14/Anthropic.png"
            }
        ],
        url: "https://www.anthropic.com"
    },

    google: {
        name: "Google",
        description: "Discover how Google AI is committed to enriching knowledge, solving complex challenges and helping people grow by building useful AI tools and technologies.",
        icons: [
            {
                src: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Google-gemini-icon.svg/2048px-Google-gemini-icon.svg.png"
            }
        ],
        url: "https://ai.google"
    },

    mistral: {
        name: "Mistral",
        description: "The most powerful AI platform for enterprises. Customize, fine-tune, and deploy AI assistants, autonomous agents, and multimodal AI with open models.",
        icons: [
            {
                src: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Mistral_AI_logo_%282025%E2%80%93%29.svg/1200px-Mistral_AI_logo_%282025%E2%80%93%29.svg.png"
            }
        ],
        url: "https://mistral.ai"
    },

    cohere: {
        name: "Cohere",
        description: "Cohere builds powerful models and AI solutions enabling enterprises to automate processes, empower employees, and turn fragmented data into actionable insights.",
        icons: [
            {
                src: "https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/cohere-color.png",
                theme: "dark"
            },
            {
                src: "https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/light/cohere-color.png",
                theme: "light"
            }
        ],
        url: "https://cohere.com"
    },

    groq: {
        name: "Groq",
        description: "The Groq LPU delivers inference with the speed and cost developers need.",
        icons: [
            {
                src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTnze6t-thGVKlIKNKF9zeiTfaoxLdYdVzX0g&s"
            }
        ],
        url: "https://groq.com"
    },

    xai: {
        name: "xAI",
        description: "xAI is an AI company with the mission of advancing scientific discovery and gaining a deeper understanding of our universe.",
        icons: [
            {
                src: "https://registry.npmmirror.com/@lobehub/icons-static-png/1.74.0/files/dark/xai.png",
                theme: "dark"
            },
            {
                src: "https://registry.npmmirror.com/@lobehub/icons-static-png/1.74.0/files/light/xai.png",
                theme: "light"
            }
        ],
        url: "https://x.ai"
    },

    together: {
        name: "Together",
        description: "Reliably build, deploy, and scale AI native apps — benefit from cutting-edge research, complete developer experience, and unmatched price-performance.",
        icons: [
            {
                src: "https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/light/together-color.png"
            }
        ],
        url: "https://www.together.ai"
    },

    pollinations: {
        name: "Pollinations",
        description: "AI creation playground - Generate images, text & audio with open source models.",
        icons: [
            {
                src: "https://avatars.githubusercontent.com/u/86964862?v=4",
                theme: "dark"
            },
            {
                src: "https://images.seeklogo.com/logo-png/61/2/pollinations-icon-logo-png_seeklogo-611686.png",
                theme: "light"
            }
        ],
        url: "https://pollinations.ai"
    },

    perplexity: {
        name: "Perplexity",
        description: "Build with the best AI answer engine API, created by Perplexity. Power your products with the fastest, cheapest offering out there. Delivering unparalleled real-time, web-wide research and Q&A capabilities.",
        icons: [
            {
                src: "https://brandlogos.net/wp-content/uploads/2025/05/perplexity_icon-logo_brandlogos.net_a9d3e-512x591.png"
            }
        ],
        url: "https://www.perplexity.ai"
    },

    jina: {
        name: "Jina",
        description: "Best-in-class embeddings, rerankers, web reader, deepsearch, small language models. Search AI for multilingual and multimodal data",
        icons: [
            {
                src: "https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/jina.png",
                theme: "dark"
            },
            {
                src: "https://registry.npmmirror.com/@lobehub/icons-static-png/1.74.0/files/light/jina.png",
                theme: "light"
            }
        ],
        url: "https://jina.ai"
    },

    nscale: {
        name: "Nscale",
        description: "Nscale provides cost-effective, high-performance infrastructure for AI. Access thousands of GPUs tailored to your requirements using our AI cloud platform.",
        icons: [
            {
                src: "https://startuprise.co.uk/wp-content/uploads/2025/04/nscale_cloud_logo.jpg",
            }
        ],
        url: "https://www.nscale.com"
    },
    voyageai: {
        name: "VoyageAI",
        description: "Voyage AI provides cutting-edge embedding models and rerankers for search and retrieval.",
        icons: [
            {
                src: "https://blog.voyageai.com/wp-content/uploads/2023/10/logo.png",
            }
        ],
        url: "https://www.voyageai.com"
    },
    contextualai: {
        name: "ContextualAI",
        description: "Replace DIY complexity with the context engineering platform built for accuracy. Ship production-grade AI that is secure, scalable, and specialized.",
        icons: [
            {
                src: "https://media.licdn.com/dms/image/v2/D560BAQEUQLTc-jpQAQ/company-logo_200_200/B56ZnCdNsrIYAI-/0/1759904062535/contextualai_logo?e=2147483647&v=beta&t=Nfk2U-IagqdIr1crFoT4nS9MkEeA2_BYNGsGiFl6rJM",
            }
        ],
        url: "https://contextual.ai"
    },
    replicate: {
        name: "Replicate",
        description: "Run open-source machine learning models with a cloud API.",
        icons: [
            {
                src: "https://media.licdn.com/dms/image/v2/D560BAQGbWdPmxf-NMA/company-logo_200_200/company-logo_200_200/0/1701798584156/replicate_logo?e=2147483647&v=beta&t=_xwx0D-qYlw-CzeBbHT7DDFoaxHp9WPen28-FTvoZak",
            }
        ],
        url: "https://replicate.com"
    },
    asyncai: {
        name: "AsyncAI",
        description: "Open source tools to easily build and maintain your event-driven architecture. All powered by the AsyncAPI specification, the industry standard for defining asynchronous APIs.",
        icons: [
            {
                src: "https://media.licdn.com/dms/image/v2/D4E0BAQH8IAPHkrLBIA/company-logo_200_200/company-logo_200_200/0/1738686836840/async_ai_logo?e=2147483647&v=beta&t=xzU-nIDFl9Fvyye-7Ki46HPuZyq1ZKxbnFjexRjFbK4",
            }
        ],
        url: "https://www.asyncapi.com"
    },
    azure: {
        name: "Azure",
        description: "Invent with purpose, realize cost savings, and make your organization more efficient with Microsoft Azure’s open and flexible cloud computing platform.",
        icons: [
            {
                src: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Microsoft_Azure.svg/1024px-Microsoft_Azure.svg.png",
            }
        ],
        url: "https://azure.microsoft.com"
    },
    deepseek: {
        name: "DeepSeek",
        description: "DeepSeek, unravel the mystery of AGI with curiosity. Answer the essential question with long-termism.",
        icons: [
            {
                src: "https://images.seeklogo.com/logo-png/61/1/deepseek-ai-icon-logo-png_seeklogo-611473.png",
            }
        ],
        url: "https://www.deepseek.com"
    },
    cloudrift: {
        name: "CloudRift",
        description: "Rent powerful GPUs like RTX 4090, RTX 5090, and RTX Pro 6000 for AI and ML. Fast, affordable hourly compute across cloud, on-prem, and edge infrastructure.",
        icons: [
            {
                src: "https://pbs.twimg.com/profile_images/1956487392204111872/IJ0Xu1b3_400x400.jpg",
            }
        ],
        url: "https://www.cloudrift.ai"
    },
    baseten: {
        name: "Baseten",
        description: "Serve and scale open-source and custom AI models on the fastest, most reliable inference platform.",
        icons: [
            {
                src: "https://media.licdn.com/dms/image/v2/D4E0BAQErc_txZeY4KQ/company-logo_200_200/B4EZbpF.n_HAAI-/0/1747667381016/baseten_logo?e=2147483647&v=beta&t=0GAeyVAJ8A3jjAnI7JBzLCYiFHQrq3EicZwidL9AALo",
            }
        ],
        url: "https://www.baseten.co"
    },
    echo: {
        name: "Echo",
        description: "The server sends back an identical copy of the data it received.",
        icons: [
            {
                src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=",
                theme: "dark"
            },
            {
                src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=",
                theme: "light"
            }
        ],
        url: "https://en.wikipedia.org/wiki/Echo_Protocol"
    },
    tinfoil: {
        name: "Tinfoil",
        description: "AI that keeps your data private at all times. Fast, powerful, and verifiable, thanks to secure hardware enclaves.",
        icons: [
            {
                src: "https://mintcdn.com/tinfoil/0ViQTbwRCR_TUpT7/logo/dark.png?fit=max&auto=format&n=0ViQTbwRCR_TUpT7&q=85&s=4286f60f42762cf23a4354c8e52f888b",
                theme: "dark"
            },
            {
                src: "https://tinfoil.sh/icon.png",
                theme: "light"
            }
        ],
        url: "https://tinfoil.sh"
    },
    nebius: {
        name: "Nebius",
        description: "Discover the most efficient way to build, tune and run your AI models and applications on top-notch NVIDIA® GPUs.",
        icons: [
            {
                src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKRoO9XCNhc_7_DVpQm8BsTL_oVF6q57IZPA&s",
                theme: "dark"
            },
            {
                src: "https://tinfoil.sh/icon.png",
                theme: "light"
            }
        ],
        url: "https://nebius.com"
    },
    deepinfra: {
        name: "DeepInfra",
        description: "Deep Infra offers cost-effective, scalable, easy-to-deploy, and production-ready machine-learning models and infrastructures for deep-learning models.",
        icons: [
            {
                src: "https://avatars.githubusercontent.com/u/116928265?s=280&v=4",
            }
        ],
        url: "https://deepinfra.com"
    },
    nvidia: {
        name: "NVIDIA",
        description: "NVIDIA invents GPUs and drives advances in AI, high-performance computing, gaming, and autonomous systems.",
        icons: [
            {
                src: "https://www.citypng.com/public/uploads/preview/hd-nvidia-eye-logo-icon-png-701751694965655t2lbe7yugk.png",
            }
        ],
        url: "https://www.nvidia.com"
    },
    runware: {
        name: "Runware",
        description: "Run AI models with the lowest-cost API for developers. Fast, flexible access to generative models for image, video, audio and more.",
        icons: [
            {
                src: "https://media.licdn.com/dms/image/v2/D4E0BAQFzsJTSfpkCbQ/company-logo_200_200/B4EZfR3QUwGcAQ-/0/1751572612962/runware_logo?e=2147483647&v=beta&t=HvfRm7Kk85KGMPVDzoiTBWuFN9v5bnyFSRvPuie2BBQ",
            }
        ],
        url: "https://runware.ai"
    },
    canopywave: {
        name: "CanopyWave",
        description: "As a trusted LLM API Provider and AI service company, we offer high-performance and secure solutions tailored to your data science and AI needs.",
        icons: [
            {
                src: "https://canopywave.com/canopy.png",
            }
        ],
        url: "https://canopywave.com"
    },
    alibaba: {
        name: "Alibaba",
        description: "Discover Alibaba Cloud's reliable cloud computing services for businesses of all sizes. Improve security and performance with our advanced cloud technologies.",
        icons: [
            {
                src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcREXxWppPgNoDOukU_2RHGUnoU-_i664iBN5w&s",
            }
        ],
        url: "https://www.alibaba.com"
    },
    inferencenet: {
        name: "Inferencenet",
        description: "AI inference for 90% lower cost.",
        icons: [
            {
                src: "https://media.licdn.com/dms/image/v2/D560BAQGxl6yWZL2F7w/company-logo_200_200/B56ZT34NF3GQAM-/0/1739325493857/kuzco_xyz_logo?e=2147483647&v=beta&t=80Ojsf4X0HWDwKBt9Hfz4q0mRkD7BaNP34GaazC3nQQ",
            }
        ],
        url: "https://inference.net"
    },
    telnyx: {
        name: "Telnyx",
        description: "Your AI agents deserve carrier-grade voice. Telnyx delivers global reach, low latency, and crystal-clear calls.",
        icons: [
            {
                src: "https://media.glassdoor.com/sqll/841349/telnyx-squareLogo-1692104355572.png",
            }
        ],
        url: "https://telnyx.com"
    },
    stabilityai: {
        name: "StabilityAI",
        description: "Multimodal media generation and editing tools designed for the best in the business. No creative challenge too big, no timeline too tight. Get to production with Stability AI, your enterprise-ready creative partner.",
        icons: [
            {
                src: "https://media.licdn.com/dms/image/v2/D560BAQGCth_DU2z1Fg/company-logo_200_200/B56Zh18sPOHMAU-/0/1754325501246/stability_ai_logo?e=2147483647&v=beta&t=K2vnKQAZRmg2Nqe0fJY7sYHDbLA752NOG1E45JbZC5s",
            }
        ],
        url: "https://stability.ai"
    },

    novita: {
        name: "Novita",
        description: "Novita AI provides 200+ Model APIs, custom deployment, GPU Instances, and Serverless GPUs. Scale AI, optimize performance, and innovate with ease and efficiency.",
        icons: [
            {
                src: "https://media.licdn.com/dms/image/v2/D560BAQG04_X3qbYWrg/company-logo_200_200/company-logo_200_200/0/1737460982063/novita_ai_labs_logo?e=2147483647&v=beta&t=PP0ulFsya1NvYiEtpQDIdmmnEfbrQ03kl6XA7TT1pJ0",
            }
        ],
        url: "https://novita.ai"
    },

    scaleway: {
        name: "Scaleway",
        description: "Build, train, deploy and scale AI models and intelligent applications on a resilient and sustainable cloud ecosystem.",
        icons: [
            {
                src: "https://www-uploads.scaleway.com/Scaleway_3_D_Logo_57e7fb833f.png",
            }
        ],
        url: "https://www.scaleway.com"
    },
    sambanova: {
        name: "SambaNova",
        description: "Discover SambaNova - the complete AI platform delivering the fastest AI inference, fine-tuning, and scalable solutions with a GPU alternative built for enterprise and agentic AI.",
        icons: [
            {
                src: "https://sambanova.ai/hubfs/logotype_sambanova_orange.png",
            }
        ],
        url: "https://sambanova.ai"
    },
    fireworks: {
        name: "Fireworks",
        description: "Use state-of-the-art, open-source LLMs and image models at blazing fast speed, or fine-tune and deploy your own at no additional cost with Fireworks AI!",
        icons: [
            {
                src: "https://images.crunchbase.com/image/upload/c_pad,f_auto,q_auto:eco,dpr_1/xgb8cpbz7pcvovoowrmk?ik-sanitizeSvg=true",
            }
        ],
        url: "https://fireworks.ai"
    },
    cerebras: {
        name: "Cerebras",
        description: "Cerebras is the go-to platform for fast and effortless AI training.",
        icons: [
            {
                src: "https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/cerebras-color.png",
            }
        ],
        url: "https://www.cerebras.ai"
    },
    zai: {
        name: "Zai",
        icons: [
            {
                src: "https://avatars.githubusercontent.com/u/223098841?s=200&v=4",
            }
        ],
        url: "https://z.ai"
    },
    hyperbolic: {
        name: "Hyperbolic",
        description: "Access open-source inference and compute at a fraction of the cost. Build with us.",
        icons: [
            {
                src: "https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/hyperbolic-color.png",
            }
        ],
        url: "https://www.hyperbolic.ai"
    },
    elevenlabs: {
        name: "ElevenLabs",
        description: "Create lifelike speech with our AI voice generator and voice agents platform. Access 5,000+ voices in 70+ languages.",
        icons: [
            {
                src: "https://help.elevenlabs.io/hc/theming_assets/01HZQ08B6SDY5X53YN9ABG4B99",
            }
        ],
        url: "https://elevenlabs.io"
    },
} as const;
