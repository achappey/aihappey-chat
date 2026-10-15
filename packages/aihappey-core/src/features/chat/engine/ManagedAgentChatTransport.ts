import { DefaultChatTransport } from "aihappey-ai";

export class ManagedAgentChatTransport extends DefaultChatTransport<any> {
  protected processResponseStream(stream: ReadableStream<Uint8Array>) {
    return super.processResponseStream(stream).pipeThrough(new TransformStream({
      transform(chunk, controller) {
        // The SDK retains existing output on approval, but ignores output on the request itself.
        if (chunk.type === "tool-approval-request" && Object.hasOwn(chunk, "output")) {
          controller.enqueue({
            ...chunk,
            type: "tool-output-available",
          });
        }
        controller.enqueue(chunk);
      },
    }));
  }
}
