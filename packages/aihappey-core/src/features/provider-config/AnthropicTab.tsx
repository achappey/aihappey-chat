import { useTranslation } from "aihappey-i18n";
import { useTheme } from "aihappey-components";

// --- Defaults ---
const DEFAULT_THINKING = {
  budget_tokens: 16768,
};

//const DEFAULT_CODE_EXECUTION = undefined;

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
    enabled: true
  },
};

export const AnthropicTab = ({
  anthropic,
  updateAnthropic,
}: {
  anthropic: any;
  updateAnthropic: (val: any) => void;
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const thinkingOn = !!anthropic.thinking;
  const codeExecutionOn = !!anthropic.code_execution;
  const nativeMcpOn = !!anthropic.native_mcp;
  const webSearchOn = !!anthropic.web_search;
  const webFetchOn = !!anthropic.web_fetch;

  const userLocation = anthropic.web_search?.user_location || {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card
        size="small"
        title={t("reasoning")}
        headerActions={
          <theme.Switch
            id="thinking"
            checked={thinkingOn}
            onChange={() =>
              updateAnthropic({
                ...anthropic,
                thinking: thinkingOn ? undefined : { ...DEFAULT_THINKING },
              })
            }
          />
        }
      >
        <div>
          <theme.Input
            type="number"
            label={t("budget")}
            disabled={!thinkingOn}
            value={anthropic.thinking?.budget_tokens ?? ""}
            onChange={(e: any) =>
              updateAnthropic({
                ...anthropic,
                thinking: {
                  ...anthropic.thinking,
                  budget_tokens: parseInt(e.target.value, 10),
                },
              })
            }
          />
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={t("webSearch")}
        headerActions={
          <theme.Switch
            id="webSearch"
            checked={webSearchOn}
            onChange={() =>
              updateAnthropic({
                ...anthropic,
                web_search: webSearchOn ? undefined : { ...DEFAULT_WEB_SEARCH },
              })
            }
          />
        }
      >
        <div>
          <theme.Input
            type="number"
            label={t("anthropic.maxUses")}
            disabled={!webSearchOn}
            value={anthropic.web_search?.max_uses ?? ""}
            onChange={(e: any) =>
              updateAnthropic({
                ...anthropic,
                web_search: {
                  ...anthropic.web_search,
                  max_uses: parseInt(e.target.value, 10),
                },
              })
            }
          />
          {/* Allowed domains */}
          <theme.Input
            label={t("anthropic.allowedDomains")}
            placeholder="domain1.com, domain2.com"
            disabled={!webSearchOn}
            value={(anthropic.web_search?.allowed_domains || []).join(", ")}
            onChange={(e: any) =>
              updateAnthropic({
                ...anthropic,
                web_search: {
                  ...anthropic.web_search,
                  allowed_domains: e.target.value
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter(Boolean),
                },
              })
            }
          />
          {/* Blocked domains */}
          <theme.Input
            label={t("anthropic.blockedDomains")}
            placeholder="domain1.com, domain2.com"
            disabled={!webSearchOn}
            value={(anthropic.web_search?.blocked_domains || []).join(", ")}
            onChange={(e: any) =>
              updateAnthropic({
                ...anthropic,
                web_search: {
                  ...anthropic.web_search,
                  blocked_domains: e.target.value
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter(Boolean),
                },
              })
            }
          />
          {/* User location */}
          <div style={{ display: "flex", gap: 12 }}>
            <theme.Input
              label={t("country")}
              disabled={!webSearchOn}
              value={userLocation.country ?? ""}
              style={{ minWidth: 70 }}
              onChange={(e: any) =>
                updateAnthropic({
                  ...anthropic,
                  web_search: {
                    ...anthropic.web_search,
                    user_location: {
                      ...userLocation,
                      country: e.target.value,
                    },
                  },
                })
              }
            />
            <theme.Input
              label={t("region")}
              disabled={!webSearchOn}
              value={userLocation.region ?? ""}
              style={{ minWidth: 110 }}
              onChange={(e: any) =>
                updateAnthropic({
                  ...anthropic,
                  web_search: {
                    ...anthropic.web_search,
                    user_location: {
                      ...userLocation,
                      region: e.target.value,
                    },
                  },
                })
              }
            />
            <theme.Input
              label={t("city")}
              disabled={!webSearchOn}
              value={userLocation.city ?? ""}
              style={{ minWidth: 110 }}
              onChange={(e: any) =>
                updateAnthropic({
                  ...anthropic,
                  web_search: {
                    ...anthropic.web_search,
                    user_location: {
                      ...userLocation,
                      city: e.target.value,
                    },
                  },
                })
              }
            />
            <theme.Input
              label={t("timezone")}
              disabled={!webSearchOn}
              value={userLocation.timezone ?? ""}
              style={{ minWidth: 140 }}
              onChange={(e: any) =>
                updateAnthropic({
                  ...anthropic,
                  web_search: {
                    ...anthropic.web_search,
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
        title={t("webFetch")}
        headerActions={
          <theme.Switch
            id="webFetch"
            checked={webFetchOn}
            onChange={(checked) =>
              updateAnthropic({
                ...anthropic,
                web_fetch: !checked ? undefined : { ...DEFAULT_WEB_FETCH },
              })
            }
          />
        }
      >
        <div>
          <theme.Input
            type="number"
            label={t("anthropic.maxUses")}
            disabled={!webFetchOn}
            value={anthropic.web_fetch?.max_uses ?? ""}
            onChange={(e: any) =>
              updateAnthropic({
                ...anthropic,
                web_fetch: {
                  ...anthropic.web_fetch,
                  max_uses: parseInt(e.target.value, 10),
                },
              })
            }
          />
          {/* Allowed domains */}
          <theme.Input
            label={t("anthropic.allowedDomains")}
            placeholder="domain1.com, domain2.com"
            disabled={!webFetchOn}
            value={(anthropic.web_fetch?.allowed_domains || []).join(", ")}
            onChange={(e: any) =>
              updateAnthropic({
                ...anthropic,
                web_fetch: {
                  ...anthropic.web_fetch,
                  allowed_domains: e.target.value
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter(Boolean),
                },
              })
            }
          />
          {/* Blocked domains */}
          <theme.Input
            label={t("anthropic.blockedDomains")}
            placeholder="domain1.com, domain2.com"
            disabled={!webFetchOn}
            value={(anthropic.web_fetch?.blocked_domains || []).join(", ")}
            onChange={(e: any) =>
              updateAnthropic({
                ...anthropic,
                web_fetch: {
                  ...anthropic.web_fetch,
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
            label={t('citations')}
            disabled={!webFetchOn}
            checked={anthropic.web_fetch?.citations?.enabled}
            onChange={(checked) =>
              updateAnthropic({
                ...anthropic,
                web_fetch: {
                  ...anthropic.web_fetch,
                  citations: checked ? { enabled: true } : undefined
                }
              })
            }
          />
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={t("code_execution")}
        headerActions={
          <theme.Switch
            id="codeExecution"
            checked={codeExecutionOn}
            onChange={(val) =>
              updateAnthropic({
                ...anthropic,
                code_execution: !val ? undefined : {},
                container: !val ? undefined : {
                  ...anthropic?.container
                }
              })
            }
          />
        }
      >
        <div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gridTemplateRows: "repeat(2, auto)",
          }}>
            {["xlsx", "pptx", "docx", "pdf"].map((skillId) => {
              const enabled =
                anthropic?.container?.skills?.some((s: any) => s.skill_id === skillId);

              return (
                <div
                  key={skillId}
                >
                  <theme.Switch
                    id={skillId}
                    label={t(skillId)}
                    disabled={anthropic.container == undefined}
                    checked={enabled}
                    // make sure the internal Field doesn’t grab full grid span
                    onChange={(val: boolean) => {
                      const currentSkills = anthropic?.container?.skills ?? [];
                      const newSkills = val
                        ? [
                          ...currentSkills,
                          { skill_id: skillId, version: "latest", type: "anthropic" },
                        ]
                        : currentSkills.filter((s: any) => s.skill_id !== skillId);

                      updateAnthropic({
                        ...anthropic,
                        container: { ...anthropic.container, skills: newSkills },
                      });
                    }}
                  />
                </div>
              );
            })}


          </div>
          <theme.Input
            label={t("anthropic.customSkills")}
            placeholder="skill_xxx, skill_zzz"
            disabled={anthropic.container == undefined}
            value={(anthropic.container?.skills
              ?.filter((a: any) => a.skill_id.startsWith("skill_"))
              ?.map((a: any) => a.skill_id) || [])
              .join(", ")}
            onChange={(e: any) => {
              const raw = e.target.value;
              const list = raw
                .split(",")
                .map((s: string) => s.trim())
                .filter(Boolean);

              const baseSkills = anthropic?.container?.skills ?? [];

              // keep only the 4 toggles that exist already
              const toggledSkills = baseSkills.filter((s: any) =>
                ["xlsx", "pptx", "docx", "pdf"].includes(s.skill_id)
              );

              // add custom ones
              const customSkills = list.map((id: string) => ({
                skill_id: id,
                version: "latest",
                type: "custom"
              }));

              updateAnthropic({
                ...anthropic,
                container: {
                  ...anthropic.container,
                  skills: [...toggledSkills, ...customSkills]
                }
              });
            }}
          />
        </div>

      </theme.Card >

      <theme.Card
        size="small"
        title={t("memory")}
        headerActions={
          <theme.Switch
            id="memory"
            checked={anthropic?.memory !== undefined}
            onChange={(val) =>
              updateAnthropic({
                ...anthropic,
                memory: val ? {} : undefined,
              })
            }
          />
        }
      ></theme.Card>

      <theme.Card
        size="small"
        title={t("nativeMcp")}
        headerActions={
          <theme.Switch
            id="nativeMcp"
            checked={nativeMcpOn}
            onChange={(val) =>
              updateAnthropic({
                ...anthropic,
                native_mcp: val,
              })
            }
          />
        }
      ></theme.Card>
    </div >
  );
};
