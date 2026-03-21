import type {
    TranscriptionModelV4
} from "@ai-sdk/provider"

export function createTranscriptionProvider(config: {
    baseUrl: string;
    headers?: any;
}) {
    return {
        transcriptionModel(modelId: string): TranscriptionModelV4 {
            return {
                specificationVersion: 'v4',
                provider: modelId.split("/")?.[0],
                modelId,

                async doGenerate(options) {
                    const {
                        audio,
                        mediaType,
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
                            audio,
                            mediaType,
                            providerOptions,
                        })
                    })

                    if (!result.ok) {
                        throw new Error(`Transcription failed (${await result.text()})`);
                    }

                    return result.json();
                }
            };
        }
    };
}






