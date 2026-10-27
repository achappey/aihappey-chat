/** Native Live fields share the existing OpenAI options object; no UI-specific wire model. */
export function buildLiveSessionConfig(options: Record<string, any>, instructions?: string) {
  const source = options.session ?? {};
  const session: Record<string, any> = { store: false };
  for (const key of ['instructions', 'client', 'delegation', 'input', 'triggers']) {
    if (Object.hasOwn(source, key)) session[key] = structuredClone(source[key]);
  }
  if (instructions !== undefined && session.instructions === undefined) session.instructions = instructions;
  if (source.audio?.output?.voice !== undefined) session.audio = { output: { voice: structuredClone(source.audio.output.voice) } };
  if (session.delegation?.type === 'responses' && !session.delegation.responses?.model?.trim())
    throw new Error('Live Responses delegation requires a backend model.');
  if (session.delegation?.responses?.max_output_tokens != null && session.delegation.responses.max_output_tokens < 16)
    throw new Error('Live Responses maximum output tokens must be at least 16.');
  if (session.delegation?.acknowledgement_delay_ms != null && (!Number.isFinite(session.delegation.acknowledgement_delay_ms) || session.delegation.acknowledgement_delay_ms < 0))
    throw new Error('Live acknowledgement delay must be nonnegative.');
  return { providerOptions: { openai: { session } } };
}

export const usesOpenAiLiveProtocol = (tags: readonly string[] = []) => tags.includes('realtime-session') && !tags.includes('realtime-token');
