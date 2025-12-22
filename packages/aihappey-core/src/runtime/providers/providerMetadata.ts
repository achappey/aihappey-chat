export const PROVIDERS: Record<string, any> = {
    openai: {
        name: "OpenAI",
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

    anthropic: {
        name: "Anthropic",
        icons: [
            {
                src: "https://upload.wikimedia.org/wikipedia/commons/1/14/Anthropic.png"
            }
        ],
        url: "https://www.anthropic.com"
    },

    google: {
        name: "Google",
        icons: [
            {
                src: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Google-gemini-icon.svg/2048px-Google-gemini-icon.svg.png"
            }
        ],
        url: "https://ai.google"
    },

    mistral: {
        name: "Mistral",
        icons: [
            {
                src: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Mistral_AI_logo_%282025%E2%80%93%29.svg/1200px-Mistral_AI_logo_%282025%E2%80%93%29.svg.png"
            }
        ],
        url: "https://mistral.ai"
    },

    cohere: {
        name: "Cohere",
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
        icons: [
            {
                src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTnze6t-thGVKlIKNKF9zeiTfaoxLdYdVzX0g&s"
            }
        ],
        url: "https://groq.com"
    },

    xai: {
        name: "xAI",
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
        icons: [
            {
                src: "https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/light/together-color.png"
            }
        ],
        url: "https://www.together.ai"
    },

    pollinations: {
        name: "Pollinations",
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
        icons: [
            {
                src: "https://brandlogos.net/wp-content/uploads/2025/05/perplexity_icon-logo_brandlogos.net_a9d3e-512x591.png"
            }
        ],
        url: "https://www.perplexity.ai"
    },

    jina: {
        name: "Jina",
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
    }
} as const;
