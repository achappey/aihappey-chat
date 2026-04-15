import { useMemo, useState } from "react";
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

export type OpenAISkillOption = {
    value: string;
    label: string;
    skillId?: string;
    name?: string;
    description?: string;
    providerId?: string;
    backendType?: "reference" | "inline";
    referenceSkillId?: string;
};

export type ResolveOpenAIShellSkill = (skillValue: string) => Promise<any | undefined>;

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

const normalizeInlineSkill = (skill: any) => ({
    type: "inline",
    name: String(skill?.name ?? ""),
    description: String(skill?.description ?? ""),
    source: {
        type: "base64",
        media_type: "application/zip",
        data: String(skill?.source?.data ?? ""),
    },
});

const normalizeSkillReference = (skill: any) =>
    withoutUndefined({
        type: "skill_reference",
        skill_id: String(skill?.skill_id ?? ""),
        version: skill?.version ? String(skill.version) : undefined,
    });

const normalizeSkill = (skill: any) =>
    skill?.type === "inline" ? normalizeInlineSkill(skill) : normalizeSkillReference(skill);

const normalizeSkills = (items: any[]) => items.map((skill) => normalizeSkill(skill));

const getOptionSelectionKey = (option: OpenAISkillOption) =>
    option.backendType === "inline"
        ? `inline:${String(option.name ?? "")}::${String(option.description ?? "")}`
        : `reference:${String(option.referenceSkillId ?? option.skillId ?? option.value)}`;

const getSkillSelectionKey = (skill: any) =>
    skill?.type === "inline"
        ? `inline:${String(skill?.name ?? "")}::${String(skill?.description ?? "")}`
        : `reference:${String(skill?.skill_id ?? "")}`;

export const OpenAIShellForm = ({
    config,
    updateConfig,
    openAISkillOptions = [],
    resolveOpenAIShellSkill,
}: {
    config: any;
    updateConfig: (val: any) => void;
    openAISkillOptions?: OpenAISkillOption[];
    resolveOpenAIShellSkill?: ResolveOpenAIShellSkill;
}) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const [selectedSkillValue, setSelectedSkillValue] = useState("");
    const [addingSkillValue, setAddingSkillValue] = useState<string | null>(null);
    const [skillError, setSkillError] = useState<string | null>(null);

    const shellOn = !!config?.shell;
    const shell = config?.shell ?? DEFAULT_SHELL;
    const environment = shell?.environment ?? DEFAULT_CONTAINER;
    const environmentType = environment?.type ?? "container_auto";

    const setShell = (nextEnvironment: any) => {
        const normalizedEnvironment = {
            ...nextEnvironment,
            skills: Array.isArray(nextEnvironment?.skills)
                ? normalizeSkills(nextEnvironment.skills)
                : nextEnvironment?.skills,
        };

        updateConfig({
            ...config,
            shell: {
                type: "shell",
                environment: withoutUndefined(normalizedEnvironment),
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

    const skills = useMemo(
        () => normalizeSkills(Array.isArray(environment?.skills) ? environment.skills : []),
        [environment?.skills]
    );
    const networkPolicy = environment?.network_policy;

    const selectedSkillKeys = useMemo(
        () => new Set(skills.map((skill) => getSkillSelectionKey(skill))),
        [skills]
    );

    const availableSkillOptions = useMemo(
        () => openAISkillOptions.filter((option) => !selectedSkillKeys.has(getOptionSelectionKey(option))),
        [openAISkillOptions, selectedSkillKeys]
    );

    const findOptionForSkill = (skill: any) =>
        openAISkillOptions.find((option) => getOptionSelectionKey(option) === getSkillSelectionKey(skill));

    const addSkillFromCatalog = async (value: string) => {
        setSelectedSkillValue("");
        if (!value) return;

        const option = openAISkillOptions.find((item) => item.value === value);
        if (!option) return;
        if (selectedSkillKeys.has(getOptionSelectionKey(option))) return;

        setSkillError(null);
        setAddingSkillValue(value);

        try {
            const nextSkill = resolveOpenAIShellSkill
                ? await resolveOpenAIShellSkill(value)
                : option.backendType === "reference"
                    ? {
                        type: "skill_reference",
                        skill_id: option.referenceSkillId ?? option.skillId ?? option.value,
                    }
                    : undefined;

            if (!nextSkill) {
                throw new Error("Could not prepare the selected skill.");
            }

            updateShell({ skills: [...skills, nextSkill] });
        } catch (error: any) {
            setSkillError(error?.message ?? "Could not prepare the selected skill.");
        } finally {
            setAddingSkillValue(null);
        }
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
                        <theme.Select
                            label={t("providers:openai.shellSkillId")}
                            disabled={!shellOn || !!addingSkillValue || availableSkillOptions.length === 0}
                            values={[selectedSkillValue]}
                            valueTitle={
                                addingSkillValue
                                    ? "Adding skill…"
                                    : availableSkillOptions.find((option) => option.value === selectedSkillValue)?.label ||
                                    t("providers:openai.shellSelectSkill")
                            }
                            options={availableSkillOptions}
                            onChange={(value: string) => {
                                setSelectedSkillValue(value);
                                void addSkillFromCatalog(value);
                            }}
                        >
                            <option value="">{t("providers:openai.shellSelectSkill")}</option>
                            {availableSkillOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </theme.Select>

                        {!openAISkillOptions.length ? (
                            <theme.Text>{t("providers:openai.shellNoSkillsAvailable")}</theme.Text>
                        ) : null}

                        {skillError ? <theme.Text>{skillError}</theme.Text> : null}

                        {skills.map((skill: any, index: number) => {
                            const skillOption = findOptionForSkill(skill);
                            const skillLabel =
                                skillOption?.label ||
                                skill?.name ||
                                skill?.skill_id ||
                                t("providers:openai.shellSelectSkill");
                            const skillSubtitle =
                                skillOption?.skillId ||
                                (skill?.type === "skill_reference" ? skill?.skill_id : undefined);

                            return (
                                <div
                                    key={`skill-${index}`}
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        justifyContent: "space-between",
                                        gap: 8,
                                        padding: 8,
                                        border: "1px solid rgba(0,0,0,0.08)",
                                        borderRadius: 8,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                                        <theme.Text>{skillLabel}</theme.Text>
                                        {skillSubtitle ? (
                                            <theme.Text style={{ opacity: 0.7 }}>{skillSubtitle}</theme.Text>
                                        ) : null}
                                    </div>

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
                    </div>
                )}
          
            </div>
        </theme.Card>
    );
};
