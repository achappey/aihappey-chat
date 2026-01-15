import type {
    SpeechModelV3
} from "@ai-sdk/provider"

export function createSpeechProvider(config: {
    baseUrl: string;
    headers?: any;
}) {
    return {
        speechModel(modelId: string): SpeechModelV3 {
            return {
                specificationVersion: 'v3',
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
                    console.log(resultJson)
                    return {
                        ...resultJson,
                        audio: `data:${resultJson.audio.mimeType};base64,${resultJson.audio.base64}`
                    }
                }
            };
        }
    };
}






