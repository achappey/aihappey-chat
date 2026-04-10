import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

const DEFAULT_CONTAINER = {
    type: "container_auto",
} as const;

const DEFAULT_SHELL = {
    type: "shell",
    environment: { ...DEFAULT_CONTAINER },
} as const;

const MEMORY_LIMIT_OPTIONS = ["1g", "4g", "16g", "64g"];

const createSkillReference = () => ({
    type: "skill_reference",
    skill_id: "",
});

const createInlineSkill = () => ({
    type: "inline",
    name: "",
    description: "",
    source: {
        type: "content",
        media_type: "application/zip",
        data: "",
    },
});

const createDomainSecret = () => ({
    domain: "",
    name: "",
    value: "",
});

const createAllowlistPolicy = () => ({
    type: "allowlist",
    allowed_domains: [] as string[],
    domain_secrets: [] as Array<{
        domain: string;
        name: string;
        value: string;
    }>,
});

const parseCsv = (value: string) =>
    value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

const withoutUndefined = (value: Record<string, any>) =>
    Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));

export const OpenAIShellForm = ({
    config,
    updateConfig,
    openAISkillOptions = [],
}: {
    config: any;
    updateConfig: (val: any) => void;
    openAISkillOptions?: Array<{ value: string; label: string }>;
}) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const shellOn = !!config?.shell;
    const shell = config?.shell ?? DEFAULT_SHELL;
    const environment = shell?.environment ?? DEFAULT_CONTAINER;
    const environmentType = environment?.type ?? "container_auto";

    const setShell = (nextEnvironment: any) => {
        updateConfig({
            ...config,
            shell: {
                type: "shell",
                environment: nextEnvironment,
            },
        });
    };

    const updateShell = (patch: any) => {
        const nextEnvironment = {
            ...(config?.shell?.environment ?? DEFAULT_SHELL.environment),
            ...patch,
        };

        setShell(withoutUndefined(nextEnvironment));
    };

    const setEnvironmentType = (type: string) => {
        if (type === "container_reference") {
            setShell({
                type,
                container_id:
                    environmentType === "container_reference" ? environment?.container_id ?? "" : "",
            });
            return;
        }

        if (type === "local") {
            setShell({
                type,
                skills: Array.isArray(environment?.skills) ? environment.skills : [],
            });
            return;
        }

        setShell(
            withoutUndefined({
                type: "container_auto",
                memory_limit:
                    environmentType === "container_auto" ? environment?.memory_limit ?? undefined : undefined,
                network_policy:
                    environmentType === "container_auto" ? environment?.network_policy : undefined,
                skills: Array.isArray(environment?.skills) ? environment.skills : [],
            })
        );
    };

    const updateNetworkPolicy = (policy: any) => {
        updateShell({
            network_policy: policy,
        });
    };

    const skills = Array.isArray(environment?.skills) ? environment.skills : [];
    const networkPolicy = environment?.network_policy;

    const skillTypeOptions = [
        { value: "skill_reference", label: t("providers:openai.shellSkillReference") },
        { value: "inline", label: t("providers:openai.shellInlineSkill") },
    ];

    const readFileAsBase64 = (file: File) =>
        new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = typeof reader.result === "string" ? reader.result : "";
                resolve(result.includes(",") ? result.split(",").pop() ?? "" : result);
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });

    const updateInlineSkillArchive = async (index: number, file?: File | null) => {
        const nextSkills = [...skills];

        if (!file) {
            nextSkills[index] = {
                ...nextSkills[index],
                source: {
                    type: "content",
                    media_type: "application/zip",
                    data: "",
                },
                file_name: undefined,
            };
            updateShell({ skills: nextSkills });
            return;
        }

        const data = await readFileAsBase64(file);
        nextSkills[index] = {
            ...nextSkills[index],
            source: {
                type: "content",
                media_type: "application/zip",
                data,
            },
            file_name: file.name,
        };
        updateShell({ skills: nextSkills });
    };

    const environmentOptions = [
        { value: "container_auto", label: t("providers:openai.shellEnvironmentContainerAuto") },
        {
            value: "container_reference",
            label: t("providers:openai.shellEnvironmentContainerReference"),
        },
        { value: "local", label: t("providers:openai.shellEnvironmentLocal") },
    ];

    const networkPolicyOptions = [
        { value: "disabled", label: t("providers:openai.shellNetworkPolicyDisabled") },
        { value: "allowlist", label: t("providers:openai.shellNetworkPolicyAllowlist") },
    ];

    return (
        <theme.Card
            size="small"
            title={t("providers:openai.shell")}
            headerActions={
                <theme.Switch
                    id="shell"
                    checked={shellOn}
                    onChange={(val) =>
                        updateConfig({
                            ...config,
                            shell: !val ? undefined : { ...DEFAULT_SHELL },
                        })
                    }
                />
            }
        >
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <theme.Select
                    label={t("providers:openai.shellEnvironment")}
                    disabled={!shellOn}
                    values={[environmentType]}
                    valueTitle={
                        environmentOptions.find((option) => option.value === environmentType)?.label
                    }
                    options={environmentOptions}
                    onChange={(value: string) => setEnvironmentType(value)}
                >
                    {environmentOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </theme.Select>

                {environmentType === "container_auto" && (
                    <>
                        <theme.Select
                            label={t("providers:openai.shellMemoryLimit")}
                            disabled={!shellOn}
                            values={[environment?.memory_limit || ""]}
                            valueTitle={
                                MEMORY_LIMIT_OPTIONS.includes(environment?.memory_limit)
                                    ? environment?.memory_limit
                                    : t("providers:openai.shellNoMemoryLimit")
                            }
                            options={[
                                { value: "", label: t("providers:openai.shellNoMemoryLimit") },
                                ...MEMORY_LIMIT_OPTIONS.map((value) => ({ value, label: value })),
                            ]}
                            onChange={(value: string) =>
                                updateShell({
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
                            disabled={!shellOn}
                            values={[networkPolicy?.type || "disabled"]}
                            valueTitle={
                                networkPolicyOptions.find(
                                    (option) => option.value === (networkPolicy?.type || "disabled")
                                )?.label
                            }
                            options={networkPolicyOptions}
                            onChange={(value: string) =>
                                updateNetworkPolicy(
                                    value === "allowlist" ? createAllowlistPolicy() : { type: "disabled" }
                                )
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
                                    disabled={!shellOn}
                                    value={
                                        Array.isArray(networkPolicy?.allowed_domains)
                                            ? networkPolicy.allowed_domains.join(", ")
                                            : ""
                                    }
                                    onChange={(e: any) =>
                                        updateNetworkPolicy({
                                            ...networkPolicy,
                                            allowed_domains: parseCsv(e.target.value),
                                        })
                                    }
                                />

                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {Array.isArray(networkPolicy?.domain_secrets) &&
                                        networkPolicy.domain_secrets.map((secret: any, index: number) => (
                                            <div
                                                key={`domain-secret-${index}`}
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
                                                        disabled={!shellOn}
                                                        onChange={(e: any) => {
                                                            const nextSecrets = [...networkPolicy.domain_secrets];
                                                            nextSecrets[index] = {
                                                                ...nextSecrets[index],
                                                                domain: e.target.value,
                                                            };
                                                            updateNetworkPolicy({
                                                                ...networkPolicy,
                                                                domain_secrets: nextSecrets,
                                                            });
                                                        }}
                                                    />
                                                    <theme.Input
                                                        label={t("providers:openai.shellSecretName")}
                                                        value={secret?.name || ""}
                                                        disabled={!shellOn}
                                                        onChange={(e: any) => {
                                                            const nextSecrets = [...networkPolicy.domain_secrets];
                                                            nextSecrets[index] = {
                                                                ...nextSecrets[index],
                                                                name: e.target.value,
                                                            };
                                                            updateNetworkPolicy({
                                                                ...networkPolicy,
                                                                domain_secrets: nextSecrets,
                                                            });
                                                        }}
                                                    />
                                                    <theme.Input
                                                        label={t("providers:openai.shellSecretValue")}
                                                        value={secret?.value || ""}
                                                        disabled={!shellOn}
                                                        onChange={(e: any) => {
                                                            const nextSecrets = [...networkPolicy.domain_secrets];
                                                            nextSecrets[index] = {
                                                                ...nextSecrets[index],
                                                                value: e.target.value,
                                                            };
                                                            updateNetworkPolicy({
                                                                ...networkPolicy,
                                                                domain_secrets: nextSecrets,
                                                            });
                                                        }}
                                                    />
                                                </div>

                                                <div>
                                                    <theme.Button
                                                        size="small"
                                                        variant="subtle"
                                                        icon="delete"
                                                        onClick={() => {
                                                            const nextSecrets = networkPolicy.domain_secrets.filter(
                                                                (_: any, i: number) => i !== index
                                                            );
                                                            updateNetworkPolicy({
                                                                ...networkPolicy,
                                                                domain_secrets: nextSecrets,
                                                            });
                                                        }}
                                                        disabled={!shellOn}
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
                                            disabled={!shellOn}
                                            onClick={() =>
                                                updateNetworkPolicy({
                                                    ...networkPolicy,
                                                    domain_secrets: [
                                                        ...(Array.isArray(networkPolicy?.domain_secrets)
                                                            ? networkPolicy.domain_secrets
                                                            : []),
                                                        createDomainSecret(),
                                                    ],
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

                {environmentType === "container_reference" && (
                        <theme.Input
                            label={t("providers:openai.container")}
                            placeholder="cntr_xxx"
                            disabled={!shellOn}
                            value={environment?.container_id || ""}
                            onChange={(e: any) =>
                                updateShell({
                                    container_id: e.target.value,
                                })
                            }
                        />
                )}

                {(environmentType === "container_auto" || environmentType === "local") && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {skills.map((skill: any, index: number) => {
                            const skillType = skill?.type || "skill_reference";
                            return (
                                <div
                                    key={`skill-${index}`}
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 8,
                                        padding: 8,
                                        border: "1px solid rgba(0,0,0,0.08)",
                                        borderRadius: 8,
                                    }}
                                >
                                    <theme.Select
                                        label={t("providers:openai.shellSkillType")}
                                        disabled={!shellOn}
                                        values={[skillType]}
                                        valueTitle={
                                            skillTypeOptions.find((option) => option.value === skillType)?.label
                                        }
                                        options={skillTypeOptions}
                                        onChange={(value: string) => {
                                            const nextSkills = [...skills];
                                            nextSkills[index] =
                                                value === "inline" ? createInlineSkill() : createSkillReference();
                                            updateShell({ skills: nextSkills });
                                        }}
                                    >
                                        {skillTypeOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </theme.Select>

                                    {skillType === "skill_reference" ? (
                                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flexDirection: "column" }}>
                                            <theme.Select
                                                label={t("providers:openai.shellSkillId")}
                                                disabled={!shellOn}
                                                values={[skill?.skill_id || ""]}
                                                valueTitle={
                                                    openAISkillOptions.find(
                                                        (option) => option.value === (skill?.skill_id || "")
                                                    )?.label || t("providers:openai.shellSelectSkill")
                                                }
                                                options={openAISkillOptions}
                                                onChange={(value: string) => {
                                                    const nextSkills = [...skills];
                                                    nextSkills[index] = {
                                                        ...nextSkills[index],
                                                        skill_id: value,
                                                        version: undefined,
                                                    };
                                                    updateShell({ skills: nextSkills });
                                                }}
                                            >
                                                <option value="">{t("providers:openai.shellSelectSkill")}</option>
                                                {openAISkillOptions.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </theme.Select>
                                            {!openAISkillOptions.length ? (
                                                <theme.Text>
                                                    {t("providers:openai.shellNoSkillsAvailable")}
                                                </theme.Text>
                                            ) : null}
                                        </div>
                                    ) : (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                                <theme.Input
                                                    label={t("name")}
                                                    value={skill?.name || ""}
                                                    disabled={!shellOn}
                                                    onChange={(e: any) => {
                                                        const nextSkills = [...skills];
                                                        nextSkills[index] = {
                                                            ...nextSkills[index],
                                                            name: e.target.value,
                                                        };
                                                        updateShell({ skills: nextSkills });
                                                    }}
                                                />
                                                <theme.Input
                                                    label={t("description")}
                                                    value={skill?.description || ""}
                                                    disabled={!shellOn}
                                                    onChange={(e: any) => {
                                                        const nextSkills = [...skills];
                                                        nextSkills[index] = {
                                                            ...nextSkills[index],
                                                            description: e.target.value,
                                                        };
                                                        updateShell({ skills: nextSkills });
                                                    }}
                                                />
                                            </div>

                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: 8,
                                                    padding: 12,
                                                    border: "1px dashed rgba(0,0,0,0.2)",
                                                    borderRadius: 8,
                                                }}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    if (!shellOn) return;
                                                    const file = e.dataTransfer.files?.[0];
                                                    if (!file) return;
                                                    void updateInlineSkillArchive(index, file);
                                                }}
                                            >
                                                <theme.Text>
                                                    {t("providers:openai.shellInlineUploadHelp")}
                                                </theme.Text>
                                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                                    <label>
                                                        <input
                                                            type="file"
                                                            accept=".zip,application/zip"
                                                            style={{ display: "none" }}
                                                            disabled={!shellOn}
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (!file) return;
                                                                void updateInlineSkillArchive(index, file);
                                                                e.target.value = "";
                                                            }}
                                                        />
                                                        <theme.Button
                                                            size="small"
                                                            variant="subtle"
                                                            icon="attachment"
                                                            disabled={!shellOn}
                                                        >
                                                            {skill?.source?.data
                                                                ? t("providers:openai.shellReplaceArchive")
                                                                : t("providers:openai.shellUploadArchive")}
                                                        </theme.Button>
                                                    </label>
                                                    {skill?.source?.data ? (
                                                        <theme.Button
                                                            size="small"
                                                            variant="subtle"
                                                            icon="delete"
                                                            disabled={!shellOn}
                                                            onClick={() => {
                                                                void updateInlineSkillArchive(index, null);
                                                            }}
                                                        >
                                                            {t("providers:openai.shellRemoveArchive")}
                                                        </theme.Button>
                                                    ) : null}
                                                </div>
                                                <theme.Text>
                                                    {skill?.file_name
                                                        ? t("providers:openai.shellArchiveSelected", {
                                                            fileName: skill.file_name,
                                                        })
                                                        : t("providers:openai.shellNoArchiveSelected")}
                                                </theme.Text>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <theme.Button
                                            size="small"
                                            variant="subtle"
                                            icon="delete"
                                            disabled={!shellOn}
                                            onClick={() => {
                                                const nextSkills = skills.filter((_: any, i: number) => i !== index);
                                                updateShell({ skills: nextSkills });
                                            }}
                                        >
                                            {t("delete")}
                                        </theme.Button>
                                    </div>
                                </div>
                            );
                        })}

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <theme.Button
                                size="small"
                                variant="subtle"
                                icon="add"
                                disabled={!shellOn}
                                onClick={() =>
                                    updateShell({
                                        skills: [...skills, createSkillReference()],
                                    })
                                }
                            >
                                {t("providers:openai.shellAddSkillReference")}
                            </theme.Button>

                            <theme.Button
                                size="small"
                                variant="subtle"
                                icon="add"
                                disabled={!shellOn}
                                onClick={() =>
                                    updateShell({
                                        skills: [...skills, createInlineSkill()],
                                    })
                                }
                            >
                                {t("providers:openai.shellAddInlineSkill")}
                            </theme.Button>
                        </div>
                    </div>
                )}
          
            </div>
        </theme.Card>
    );
};
