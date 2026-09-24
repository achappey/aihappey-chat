const DEFAULT_TOKEN_LIFETIME_MS = 30 * 60 * 1000;
const DEFAULT_NEW_SESSION_LIFETIME_MS = 60 * 1000;

const GENERATION_CONFIG_FIELDS = [
  "responseModalities",
  "temperature",
  "topP",
  "topK",
  "maxOutputTokens",
  "mediaResolution",
  "seed",
  "speechConfig",
  "thinkingConfig",
  "enableAffectiveDialog",
  "translationConfig",
] as const;

export type GoogleLiveClientConfig = {
  uses?: number;
  expireTime?: string;
  newSessionExpireTime?: string;
  lockAdditionalFields?: string[];
  liveConnectConstraints?: {
    model?: string;
    config?: Record<string, any>;
  };
  cameraFrameRate?: number;
  jpegQuality?: number;
};

export const normalizeGoogleLiveModel = (modelId: string): string => {
  const providerSeparator = modelId.indexOf("/");
  const withoutProvider = providerSeparator >= 0 ? modelId.slice(providerSeparator + 1) : modelId;
  return withoutProvider.startsWith("models/") ? withoutProvider : `models/${withoutProvider}`;
};

/** Decodes browser WebSocket text frames regardless of the configured binary type. */
export const parseGoogleLiveMessageData = async (data: unknown): Promise<any> => {
  let text: string;
  if (typeof data === "string") {
    text = data;
  } else if (data instanceof Blob) {
    text = await data.text();
  } else if (data instanceof ArrayBuffer) {
    text = new TextDecoder().decode(data);
  } else if (ArrayBuffer.isView(data)) {
    text = new TextDecoder().decode(data);
  } else {
    throw new Error(`Unsupported Google Live WebSocket frame type: ${Object.prototype.toString.call(data)}`);
  }
  return JSON.parse(text);
};

const parseRelativeDurationMs = (value: string): number | undefined => {
  const match = value.trim().match(/^(\d+(?:\.\d+)?)\s*(ms|s|m|h)$/i);
  if (!match) return undefined;
  const amount = Number(match[1]);
  const multiplier = { ms: 1, s: 1000, m: 60_000, h: 3_600_000 }[match[2].toLowerCase() as "ms" | "s" | "m" | "h"];
  return Number.isFinite(amount) ? amount * multiplier : undefined;
};

const toRfc3339Expiry = (value: string | undefined, now: Date, defaultLifetimeMs: number): string => {
  const configured = String(value ?? "").trim();
  const relativeMs = configured ? parseRelativeDurationMs(configured) : undefined;
  if (relativeMs !== undefined) return new Date(now.getTime() + relativeMs).toISOString();
  if (configured && Number.isFinite(Date.parse(configured))) return new Date(configured).toISOString();
  if (configured) throw new Error(`Invalid Google Live expiry '${configured}'. Use RFC3339 or a duration such as '10m'.`);
  return new Date(now.getTime() + defaultLifetimeMs).toISOString();
};

/**
 * Converts the public Google Gen AI SDK LiveConnectConfig shape into the wire
 * BidiGenerateContentSetup shape used by both the constrained WebSocket and
 * the v1alpha auth-token provisioning API.
 */
export const buildGoogleLiveSetup = (
  modelId: string,
  config: Record<string, any>,
): Record<string, any> => {
  const setup: Record<string, any> = {
    model: normalizeGoogleLiveModel(modelId),
  };
  const generationConfig = { ...(config.generationConfig ?? {}) };

  for (const field of GENERATION_CONFIG_FIELDS) {
    if (config[field] !== undefined) generationConfig[field] = config[field];
  }
  if (Object.keys(generationConfig).length) setup.generationConfig = generationConfig;

  for (const [field, value] of Object.entries(config)) {
    if (field === "generationConfig" || GENERATION_CONFIG_FIELDS.includes(field as any) || value === undefined) continue;
    setup[field] = value;
  }

  return setup;
};

/** Builds the exact Google auth-token wire payload; browser-only metadata is excluded. */
export const buildGoogleLiveTokenPayload = (args: {
  modelId: string;
  config: Record<string, any>;
  tokenConfig?: GoogleLiveClientConfig;
  now?: Date;
}): Record<string, any> => {
  const now = args.now ?? new Date();
  const tokenConfig = args.tokenConfig ?? {};
  const payload: Record<string, any> = {
    uses: tokenConfig.uses ?? 1,
    expireTime: toRfc3339Expiry(tokenConfig.expireTime, now, DEFAULT_TOKEN_LIFETIME_MS),
    newSessionExpireTime: toRfc3339Expiry(
      tokenConfig.newSessionExpireTime,
      now,
      DEFAULT_NEW_SESSION_LIFETIME_MS,
    ),
    bidiGenerateContentSetup: buildGoogleLiveSetup(args.modelId, args.config),
  };

  if (tokenConfig.lockAdditionalFields !== undefined) {
    payload.fieldMask = tokenConfig.lockAdditionalFields;
  }
  return payload;
};
