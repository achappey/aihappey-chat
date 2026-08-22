import type {
    TranscriptionModelV4,
    Experimental_TranscriptionModelV4StreamPart
} from "@ai-sdk/provider"

function parseSseStream(
    body: ReadableStream<Uint8Array>
): ReadableStream<Experimental_TranscriptionModelV4StreamPart> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    return new ReadableStream({
        async pull(controller) {
            while (true) {
                const { done, value } = await reader.read();
                buffer += decoder.decode(value, { stream: !done });
                const boundary = buffer.indexOf('\n\n');

                if (boundary >= 0) {
                    const event = buffer.slice(0, boundary);
                    buffer = buffer.slice(boundary + 2);
                    const data = event.split('\n')
                        .filter(line => line.startsWith('data:'))
                        .map(line => line.slice(5).trimStart())
                        .join('\n');

                    if (data && data !== '[DONE]') {
                        controller.enqueue(JSON.parse(data));
                        return;
                    }
                }

                if (done) {
                    controller.close();
                    return;
                }
            }
        },
        cancel(reason) {
            return reader.cancel(reason);
        }
    });
}

async function readAudio(audio: ReadableStream<Uint8Array | string>): Promise<string> {
    const reader = audio.getReader();
    const chunks: Uint8Array[] = [];
    let byteLength = 0;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = typeof value === 'string'
            ? Uint8Array.from(atob(value), character => character.charCodeAt(0))
            : value;
        chunks.push(chunk);
        byteLength += chunk.byteLength;
    }

    const bytes = new Uint8Array(byteLength);
    let offset = 0;
    for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
    }

    let binary = '';
    for (let index = 0; index < bytes.length; index += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
    }
    return btoa(binary);
}

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
                },

                async doStream(options) {
                    const headers = new Headers(config.headers ?? {});
                    headers.set('Content-Type', 'application/json');
                    headers.set('Accept', 'text/event-stream');
                    for (const [key, value] of Object.entries(options.headers ?? {})) {
                        if (value !== undefined) headers.set(key, value);
                    }

                    const audio = await readAudio(options.audio);

                    const result = await fetch(`${config.baseUrl}/stream`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                            model: modelId,
                            audio,
                            inputAudioFormat: options.inputAudioFormat,
                            providerOptions: options.providerOptions,
                            includeRawChunks: options.includeRawChunks
                        }),
                        signal: options.abortSignal
                    });

                    if (!result.ok || !result.body) {
                        throw new Error(`Streaming transcription failed (${await result.text()})`);
                    }

                    return {
                        stream: parseSseStream(result.body),
                        response: {
                            headers: Object.fromEntries(result.headers.entries())
                        }
                    };
                }
            };
        }
    };
}






