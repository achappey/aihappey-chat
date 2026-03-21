import type {
    SpeechModelV4
} from "@ai-sdk/provider"

export function createSpeechProvider(config: {
    baseUrl: string;
    headers?: any;
}) {
    return {
        speechModel(modelId: string): SpeechModelV4 {
            return {
                specificationVersion: 'v4',
                provider: modelId.split("/")?.[0],
                modelId,

                async doGenerate(options) {
                    const {
                        text,
                        voice,
                        outputFormat,
                        instructions,
                        speed,
                        language,
                        providerOptions
                    } = options;

                    const result = await fetch(config.baseUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(config.headers ?? {})
                        },
                        body: JSON.stringify({
                            model: modelId,
                            text,
                            voice,
                            outputFormat,
                            instructions,
                            speed,
                            language,
                            providerOptions,
                        })
                    })

                    if (!result.ok) {
                        throw new Error(`Speech failed (${await result.text()})`);
                    }

                    const resultJson = await result.json();

                    return {
                        ...resultJson,
                        audio: `data:${resultJson.audio.mimeType};base64,${resultJson.audio.base64}`
                    }
                }
            };
        }
    };
}






