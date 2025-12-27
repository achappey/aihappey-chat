import { useTheme } from "../../../theme/ThemeContext";

// --- Defaults ---
const DEFAULT_THINKING = {
  budget_tokens: 16768,
};

const DEFAULT_WEB_SEARCH = {
  max_uses: 5,
  allowed_domains: [],
  blocked_domains: [],
  user_location: {
    timezone: "",
    country: "",
    region: "",
    city: "",
  },
};

const DEFAULT_WEB_FETCH = {
  max_uses: 5,
  allowed_domains: [],
  blocked_domains: [],
  citations: {
    enabled: true,
  },
};

export type AnthropicChatConfigFormTranslations = {
  reasoning?: string;
  budget?: string;

  webSearch?: string;
  webFetch?: string;

  maxUses?: string;
  allowedDomains?: string;
  blockedDomains?: string;

  country?: string;
  region?: string;
  city?: string;
  timezone?: string;

  citations?: string;

  code_execution?: string;

  xlsx?: string;
  pptx?: string;
  docx?: string;
  pdf?: string;

  customSkills?: string;

  memory?: string;
  nativeMcp?: string;
};

export const AnthropicChatConfigForm = ({
  config,
  updateConfig,
  translations,
}: {
  config: any;
  updateConfig: (val: any) => void;
  translations?: AnthropicChatConfigFormTranslations;
}) => {
  const theme = useTheme();

  const thinkingOn = !!config?.thinking;
  const codeExecutionOn = !!config?.code_execution;
  const nativeMcpOn = !!config?.native_mcp;
  const webSearchOn = !!config?.web_search;
  const webFetchOn = !!config?.web_fetch;

  const userLocation = config?.web_search?.user_location || {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card
        size="small"
        title={translations?.reasoning ?? "reasoning"}
        headerActions={
          <theme.Switch
            id="thinking"
            checked={thinkingOn}
            onChange={() =>
              updateConfig({
                ...config,
                thinking: thinkingOn ? undefined : { ...DEFAULT_THINKING },
              })
            }
          />
        }
      >
        <div>
          <theme.Input
            type="number"
            label={translations?.budget ?? "budget"}
            disabled={!thinkingOn}
            value={config?.thinking?.budget_tokens ?? ""}
            onChange={(e: any) =>
              updateConfig({
                ...config,
                thinking: {
                  ...config.thinking,
                  budget_tokens: parseInt(e.target.value, 10),
                },
              })
            }
          />
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={translations?.webSearch ?? "webSearch"}
        headerActions={
          <theme.Switch
            id="webSearch"
            checked={webSearchOn}
            onChange={() =>
              updateConfig({
                ...config,
                web_search: webSearchOn ? undefined : { ...DEFAULT_WEB_SEARCH },
              })
            }
          />
        }
      >
        <div>
          <theme.Input
            type="number"
            label={translations?.maxUses ?? "maxUses"}
            disabled={!webSearchOn}
            value={config?.web_search?.max_uses ?? ""}
            onChange={(e: any) =>
              updateConfig({
                ...config,
                web_search: {
                  ...config.web_search,
                  max_uses: parseInt(e.target.value, 10),
                },
              })
            }
          />

          <theme.Input
            label={translations?.allowedDomains ?? "allowedDomains"}
            placeholder="domain1.com, domain2.com"
            disabled={!webSearchOn}
            value={(config?.web_search?.allowed_domains || []).join(", ")}
            onChange={(e: any) =>
              updateConfig({
                ...config,
                web_search: {
                  ...config.web_search,
                  allowed_domains: e.target.value
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter(Boolean),
                },
              })
            }
          />

          <theme.Input
            label={translations?.blockedDomains ?? "blockedDomains"}
            placeholder="domain1.com, domain2.com"
            disabled={!webSearchOn}
            value={(config?.web_search?.blocked_domains || []).join(", ")}
            onChange={(e: any) =>
              updateConfig({
                ...config,
                web_search: {
                  ...config.web_search,
                  blocked_domains: e.target.value
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter(Boolean),
                },
              })
            }
          />

          <div style={{ display: "flex", gap: 12 }}>
            <theme.Input
              label={translations?.country ?? "country"}
              disabled={!webSearchOn}
              value={userLocation.country ?? ""}
              style={{ minWidth: 70 }}
              onChange={(e: any) =>
                updateConfig({
                  ...config,
                  web_search: {
                    ...config.web_search,
                    user_location: {
                      ...userLocation,
                      country: e.target.value,
                    },
                  },
                })
              }
            />
            <theme.Input
              label={translations?.region ?? "region"}
              disabled={!webSearchOn}
              value={userLocation.region ?? ""}
              style={{ minWidth: 110 }}
              onChange={(e: any) =>
                updateConfig({
                  ...config,
                  web_search: {
                    ...config.web_search,
                    user_location: {
                      ...userLocation,
                      region: e.target.value,
                    },
                  },
                })
              }
            />
            <theme.Input
              label={translations?.city ?? "city"}
              disabled={!webSearchOn}
              value={userLocation.city ?? ""}
              style={{ minWidth: 110 }}
              onChange={(e: any) =>
                updateConfig({
                  ...config,
                  web_search: {
                    ...config.web_search,
                    user_location: {
                      ...userLocation,
                      city: e.target.value,
                    },
                  },
                })
              }
            />
            <theme.Input
              label={translations?.timezone ?? "timezone"}
              disabled={!webSearchOn}
              value={userLocation.timezone ?? ""}
              style={{ minWidth: 140 }}
              onChange={(e: any) =>
                updateConfig({
                  ...config,
                  web_search: {
                    ...config.web_search,
                    user_location: {
                      ...userLocation,
                      timezone: e.target.value,
                    },
                  },
                })
              }
            />
          </div>
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={translations?.webFetch ?? "webFetch"}
        headerActions={
          <theme.Switch
            id="webFetch"
            checked={webFetchOn}
            onChange={(checked) =>
              updateConfig({
                ...config,
                web_fetch: !checked ? undefined : { ...DEFAULT_WEB_FETCH },
              })
            }
          />
        }
      >
        <div>
          <theme.Input
            type="number"
            label={translations?.maxUses ?? "maxUses"}
            disabled={!webFetchOn}
            value={config?.web_fetch?.max_uses ?? ""}
            onChange={(e: any) =>
              updateConfig({
                ...config,
                web_fetch: {
                  ...config.web_fetch,
                  max_uses: parseInt(e.target.value, 10),
                },
              })
            }
          />

          <theme.Input
            label={translations?.allowedDomains ?? "allowedDomains"}
            placeholder="domain1.com, domain2.com"
            disabled={!webFetchOn}
            value={(config?.web_fetch?.allowed_domains || []).join(", ")}
            onChange={(e: any) =>
              updateConfig({
                ...config,
                web_fetch: {
                  ...config.web_fetch,
                  allowed_domains: e.target.value
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter(Boolean),
                },
              })
            }
          />

          <theme.Input
            label={translations?.blockedDomains ?? "blockedDomains"}
            placeholder="domain1.com, domain2.com"
            disabled={!webFetchOn}
            value={(config?.web_fetch?.blocked_domains || []).join(", ")}
            onChange={(e: any) =>
              updateConfig({
                ...config,
                web_fetch: {
                  ...config.web_fetch,
                  blocked_domains: e.target.value
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter(Boolean),
                },
              })
            }
          />

          <theme.Switch
            id="citations"
            label={translations?.citations ?? "citations"}
            disabled={!webFetchOn}
            checked={config?.web_fetch?.citations?.enabled}
            onChange={(checked) =>
              updateConfig({
                ...config,
                web_fetch: {
                  ...config.web_fetch,
                  citations: checked ? { enabled: true } : undefined,
                },
              })
            }
          />
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={translations?.code_execution ?? "code_execution"}
        headerActions={
          <theme.Switch
            id="codeExecution"
            checked={codeExecutionOn}
            onChange={(val) =>
              updateConfig({
                ...config,
                code_execution: !val ? undefined : {},
                container: !val
                  ? undefined
                  : {
                      ...config?.container,
                    },
              })
            }
          />
        }
      >
        <div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gridTemplateRows: "repeat(2, auto)",
            }}
          >
            {["xlsx", "pptx", "docx", "pdf"].map((skillId) => {
              const enabled = config?.container?.skills?.some(
                (s: any) => s.skill_id === skillId
              );

              return (
                <div key={skillId}>
                  <theme.Switch
                    id={skillId}
                    label={(translations as any)?.[skillId] ?? skillId}
                    disabled={config.container == undefined}
                    checked={enabled}
                    onChange={(val: boolean) => {
                      const currentSkills = config?.container?.skills ?? [];
                      const newSkills = val
                        ? [
                            ...currentSkills,
                            { skill_id: skillId, version: "latest", type: "anthropic" },
                          ]
                        : currentSkills.filter((s: any) => s.skill_id !== skillId);

                      updateConfig({
                        ...config,
                        container: { ...config.container, skills: newSkills },
                      });
                    }}
                  />
                </div>
              );
            })}
          </div>

          <theme.Input
            label={translations?.customSkills ?? "customSkills"}
            placeholder="skill_xxx, skill_zzz"
            disabled={config.container == undefined}
            value={
              (config.container?.skills
                ?.filter((a: any) => a.skill_id.startsWith("skill_"))
                ?.map((a: any) => a.skill_id) || []
              ).join(", ")
            }
            onChange={(e: any) => {
              const raw = e.target.value;
              const list = raw
                .split(",")
                .map((s: string) => s.trim())
                .filter(Boolean);

              const baseSkills = config?.container?.skills ?? [];

              const toggledSkills = baseSkills.filter((s: any) =>
                ["xlsx", "pptx", "docx", "pdf"].includes(s.skill_id)
              );

              const customSkills = list.map((id: string) => ({
                skill_id: id,
                version: "latest",
                type: "custom",
              }));

              updateConfig({
                ...config,
                container: {
                  ...config.container,
                  skills: [...toggledSkills, ...customSkills],
                },
              });
            }}
          />
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={translations?.memory ?? "memory"}
        headerActions={
          <theme.Switch
            id="memory"
            checked={config?.memory !== undefined}
            onChange={(val) =>
              updateConfig({
                ...config,
                memory: val ? {} : undefined,
              })
            }
          />
        }
      />

      <theme.Card
        size="small"
        title={translations?.nativeMcp ?? "nativeMcp"}
        headerActions={
          <theme.Switch
            id="nativeMcp"
            checked={nativeMcpOn}
            onChange={(val) =>
              updateConfig({
                ...config,
                native_mcp: val,
              })
            }
          />
        }
      />
    </div>
  );
};
