import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

const DEFAULT_CODE_INTERPRETER = {
  container: {
    type: "auto",
  },
};

const MEMORY_LIMIT_OPTIONS = ["1g", "4g", "16g", "64g"];

const createAllowlistPolicy = () => ({
  type: "allowlist",
  allowed_domains: [] as string[],
  domain_secrets: [] as Array<{
    domain: string;
    name: string;
    value: string;
  }>,
});

const createDomainSecret = () => ({
  domain: "",
  name: "",
  value: "",
});

const parseCsv = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const withoutUndefined = (value: Record<string, any>) =>
  Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));

export const OpenAICodeInterpreterForm = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const codeInterpreterOn = !!config?.code_interpreter;
  const container = config?.code_interpreter?.container;
  const containerIsReference = typeof container === "string";
  const containerConfig =
    container && typeof container === "object" ? container : DEFAULT_CODE_INTERPRETER.container;
  const networkPolicy = containerConfig?.network_policy;

  const networkPolicyOptions = [
    { value: "disabled", label: t("providers:openai.shellNetworkPolicyDisabled") },
    { value: "allowlist", label: t("providers:openai.shellNetworkPolicyAllowlist") },
  ];

  const updateCodeInterpreterContainer = (nextContainer: any) => {
    updateConfig({
      ...config,
      code_interpreter: {
        ...(config?.code_interpreter ?? {}),
        container: typeof nextContainer === "string" ? nextContainer : withoutUndefined(nextContainer),
      },
    });
  };

  const updateAutoContainer = (patch: any) => {
    updateCodeInterpreterContainer({
      ...containerConfig,
      ...patch,
    });
  };

  const toggleInclude = (key: string, enabled: boolean) => {
    const current = Array.isArray(config?.include) ? config.include : [];
    const next = enabled
      ? Array.from(new Set([...current, key]))
      : current.filter((a: any) => a !== key);

    updateConfig({
      ...config,
      include: next.length ? next : undefined,
    });
  };

  return (
    <theme.Card
      size="small"
      title={t("code_execution")}
      headerActions={
        <theme.Switch
          id="codeInterpreter"
          checked={codeInterpreterOn}
          onChange={(val) =>
            updateConfig({
              ...config,
              code_interpreter: !val ? undefined : { ...DEFAULT_CODE_INTERPRETER },
            })
          }
        />
      }
    >
      <div>
        <theme.Input
          label={t("providers:openai.container")}
          placeholder="cntr_xxx or cntr_zzz"
          disabled={!codeInterpreterOn}
          value={
            config?.code_interpreter?.container &&
            typeof config?.code_interpreter?.container === "string"
              ? config?.code_interpreter?.container
              : ""
          }
          onChange={(e: any) =>
            updateCodeInterpreterContainer(
              e.target.value.trim() && e.target.value.trim().length > 0
                ? e.target.value.trim()
                : { ...DEFAULT_CODE_INTERPRETER.container }
            )
          }
        />

        {!containerIsReference && (
          <>
            <theme.Select
              label={t("providers:openai.shellMemoryLimit")}
              disabled={!codeInterpreterOn}
              values={[containerConfig?.memory_limit || ""]}
              valueTitle={
                MEMORY_LIMIT_OPTIONS.includes(containerConfig?.memory_limit)
                  ? containerConfig?.memory_limit
                  : t("providers:openai.shellNoMemoryLimit")
              }
              options={[
                { value: "", label: t("providers:openai.shellNoMemoryLimit") },
                ...MEMORY_LIMIT_OPTIONS.map((value) => ({ value, label: value })),
              ]}
              onChange={(value: string) =>
                updateAutoContainer({
                  memory_limit: value || undefined,
                })
              }
            >
              <option value="">{t("providers:openai.shellNoMemoryLimit")}</option>
              {MEMORY_LIMIT_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </theme.Select>

            <theme.Select
              label={t("providers:openai.shellNetworkPolicy")}
              disabled={!codeInterpreterOn}
              values={[networkPolicy?.type || "disabled"]}
              valueTitle={
                networkPolicyOptions.find(
                  (option) => option.value === (networkPolicy?.type || "disabled")
                )?.label
              }
              options={networkPolicyOptions}
              onChange={(value: string) =>
                updateAutoContainer({
                  network_policy:
                    value === "allowlist" ? createAllowlistPolicy() : { type: "disabled" },
                })
              }
            >
              {networkPolicyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </theme.Select>

            {networkPolicy?.type === "allowlist" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <theme.Input
                  label={t("providers:openai.shellAllowedDomains")}
                  placeholder="pypi.org, github.com"
                  disabled={!codeInterpreterOn}
                  value={
                    Array.isArray(networkPolicy?.allowed_domains)
                      ? networkPolicy.allowed_domains.join(", ")
                      : ""
                  }
                  onChange={(e: any) =>
                    updateAutoContainer({
                      network_policy: {
                        ...networkPolicy,
                        allowed_domains: parseCsv(e.target.value),
                      },
                    })
                  }
                />

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {Array.isArray(networkPolicy?.domain_secrets) &&
                    networkPolicy.domain_secrets.map((secret: any, index: number) => (
                      <div
                        key={`code-interpreter-domain-secret-${index}`}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                          padding: 8,
                          border: "1px solid rgba(0,0,0,0.08)",
                          borderRadius: 8,
                        }}
                      >
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <theme.Input
                            label={t("providers:openai.shellSecretDomain")}
                            value={secret?.domain || ""}
                            disabled={!codeInterpreterOn}
                            onChange={(e: any) => {
                              const nextSecrets = [...networkPolicy.domain_secrets];
                              nextSecrets[index] = {
                                ...nextSecrets[index],
                                domain: e.target.value,
                              };

                              updateAutoContainer({
                                network_policy: {
                                  ...networkPolicy,
                                  domain_secrets: nextSecrets,
                                },
                              });
                            }}
                          />
                          <theme.Input
                            label={t("providers:openai.shellSecretName")}
                            value={secret?.name || ""}
                            disabled={!codeInterpreterOn}
                            onChange={(e: any) => {
                              const nextSecrets = [...networkPolicy.domain_secrets];
                              nextSecrets[index] = {
                                ...nextSecrets[index],
                                name: e.target.value,
                              };

                              updateAutoContainer({
                                network_policy: {
                                  ...networkPolicy,
                                  domain_secrets: nextSecrets,
                                },
                              });
                            }}
                          />
                          <theme.Input
                            label={t("providers:openai.shellSecretValue")}
                            value={secret?.value || ""}
                            disabled={!codeInterpreterOn}
                            onChange={(e: any) => {
                              const nextSecrets = [...networkPolicy.domain_secrets];
                              nextSecrets[index] = {
                                ...nextSecrets[index],
                                value: e.target.value,
                              };

                              updateAutoContainer({
                                network_policy: {
                                  ...networkPolicy,
                                  domain_secrets: nextSecrets,
                                },
                              });
                            }}
                          />
                        </div>

                        <div>
                          <theme.Button
                            size="small"
                            variant="subtle"
                            icon="delete"
                            disabled={!codeInterpreterOn}
                            onClick={() => {
                              const nextSecrets = networkPolicy.domain_secrets.filter(
                                (_: any, i: number) => i !== index
                              );

                              updateAutoContainer({
                                network_policy: {
                                  ...networkPolicy,
                                  domain_secrets: nextSecrets,
                                },
                              });
                            }}
                          >
                            {t("delete")}
                          </theme.Button>
                        </div>
                      </div>
                    ))}

                  <div>
                    <theme.Button
                      size="small"
                      variant="subtle"
                      icon="add"
                      disabled={!codeInterpreterOn}
                      onClick={() =>
                        updateAutoContainer({
                          network_policy: {
                            ...networkPolicy,
                            domain_secrets: [
                              ...(Array.isArray(networkPolicy?.domain_secrets)
                                ? networkPolicy.domain_secrets
                                : []),
                              createDomainSecret(),
                            ],
                          },
                        })
                      }
                    >
                      {t("providers:openai.shellAddDomainSecret")}
                    </theme.Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <theme.Switch
          id="includeOutputs"
          disabled={!codeInterpreterOn}
          checked={config?.include?.includes("code_interpreter_call.outputs")}
          label={t("providers:openai.includeOutputs")}
          onChange={(value) =>
            toggleInclude("code_interpreter_call.outputs", !!value)
          }
        />
      </div>
    </theme.Card>
  );
};

