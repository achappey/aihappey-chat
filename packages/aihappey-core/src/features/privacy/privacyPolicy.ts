/** Policy content is supplied by the consuming app, never by the core package. */
export interface PrivacyPolicyConfig {
  /** Markdown text; apps may import a local file as text at build time. */
  markdown?: string;
  /** Absolute HTTP(S) URL of an external privacy policy. */
  url?: string;
}

export function normalizePrivacyPolicy(
  policy?: PrivacyPolicyConfig,
): PrivacyPolicyConfig | undefined {
  const markdown = policy?.markdown?.trim() || undefined;
  let url = policy?.url?.trim() || undefined;

  if (url) {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") url = undefined;
    } catch {
      url = undefined;
    }
  }

  return markdown || url ? { markdown, url } : undefined;
}
