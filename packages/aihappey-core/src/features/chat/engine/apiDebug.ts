export function setApiDebugHeader(
  headers: Headers,
  input: RequestInfo | URL,
  enabled: boolean,
) {
  const url = typeof Request !== "undefined" && input instanceof Request
    ? input.url
    : String(input);
  const path = url.split(/[?#]/, 1)[0].replace(/\/$/, "");

  headers.delete("X-AIHappey-Debug");
  if (enabled && path.endsWith("/api/chat")) {
    headers.set("X-AIHappey-Debug", "true");
  }
}
