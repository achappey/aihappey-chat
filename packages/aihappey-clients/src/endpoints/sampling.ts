import type { CreateMessageResult } from "aihappey-mcp";
import type { EndpointAdapter, InvokePlaygroundResult } from "../shared/types";
import { toSamplingCreateMessageRequest } from "../shared/messages";
import { extractSamplingText } from "../shared/response-parsers";

const parseSamplingResponse = (raw: unknown): InvokePlaygroundResult => ({
  text: extractSamplingText(raw as CreateMessageResult),
  raw,
});

export const samplingEndpoint: EndpointAdapter = {
  id: "/sampling",
  label: "/sampling",
  buildRequest: (request) => ({
    endpointId: "/sampling",
    method: "POST",
    path: "/sampling",
    body: toSamplingCreateMessageRequest(request),
    parseResponse: parseSamplingResponse,
  }),
};
