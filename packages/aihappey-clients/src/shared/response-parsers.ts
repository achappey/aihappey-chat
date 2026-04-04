export const extractResponsesText = (response: any): string => {
  if (typeof response?.output_text === "string" && response.output_text.trim()) {
    return response.output_text;
  }

  const pieces = (response?.output ?? [])
    .flatMap((item: any) => item?.content ?? [])
    .map((item: any) => item?.text ?? item?.output_text ?? "")
    .filter(Boolean);

  return pieces.join("\n\n").trim();
};

export const extractChatCompletionsText = (response: any): string => {
  const choice = response?.choices?.[0];
  const content = choice?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((item: any) => item?.text ?? item?.content ?? "")
      .filter(Boolean)
      .join("\n\n")
      .trim();
  }
  return "";
};

export const extractAnthropicMessagesText = (response: any): string => {
  const content = response?.content;
  if (!Array.isArray(content)) return "";
  return content
    .map((item: any) => item?.text ?? "")
    .filter(Boolean)
    .join("\n\n")
    .trim();
};

export const extractSamplingText = (response: any): string => {
  const content = response?.content;
  if (Array.isArray(content)) {
    return content
      .map((item: any) => item?.text ?? "")
      .filter(Boolean)
      .join("\n\n")
      .trim();
  }

  if (content?.type === "text") {
    return content.text ?? "";
  }

  return "";
};

