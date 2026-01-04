import type {
    TranscriptionModelV3
} from "@ai-sdk/provider"

export function createTranscriptionProvider(config: {
    baseUrl: string;
    headers?: any;
}) {
    return {
        transcriptionModel(modelId: string): TranscriptionModelV3 {
            return {
                specificationVersion: 'v3',
                provider: modelId.split("/")?.[0],
                modelId,

                async doGenerate(options) {
                    const {
                        audio,
                        mediaType,
                        providerOptions
                    } = options;

                    const result = await fetch(`${config.baseUrl}/v1/audio/transcriptions`, {
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






