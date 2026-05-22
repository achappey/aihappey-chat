import React, { useMemo, useState } from "react";
import { useTranslation } from "aihappey-i18n";
import type { TagItem } from "aihappey-types";
import { useTheme } from "../../../theme/ThemeContext";

export type TemboChatConfig = {
  description?: string;
  repositories?: string[];
  targetBranch?: string;
  branchName?: string;
  queueRightAway?: boolean;
};

const normalizeOptionalString = (value: unknown): string | undefined => {
  const trimmed = String(value ?? "").trim();
  return trimmed ? trimmed : undefined;
};

const normalizeRepositoryUrl = (value: unknown): string =>
  String(value ?? "").trim();

const normalizeRepositories = (value: unknown): string[] => {
  const raw = Array.isArray(value) ? value : [];
  const seen = new Set<string>();
  const next: string[] = [];

  for (const item of raw) {
    const repository = normalizeRepositoryUrl(item);
    if (!repository) continue;

    const key = repository.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    next.push(repository);
  }

  return next;
};

export const TemboChatConfigForm = ({
  config,
  updateConfig,
}: {
  config: TemboChatConfig;
  updateConfig: (val: TemboChatConfig) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [newRepository, setNewRepository] = useState("");

  const repositories = useMemo(
    () => normalizeRepositories(config?.repositories),
    [config?.repositories]
  );
  const repositoryItems: TagItem[] = repositories.map((repository) => ({
    key: repository,
    label: repository,
  }));

  const updateField = <K extends keyof TemboChatConfig>(
    key: K,
    value: TemboChatConfig[K] | undefined
  ) => {
    const nextConfig: TemboChatConfig = {
      ...(config ?? {}),
      queueRightAway: config?.queueRightAway ?? true,
    };

    if (value === undefined) {
      delete nextConfig[key];
    } else {
      nextConfig[key] = value;
    }

    updateConfig(nextConfig);
  };

  const setRepositories = (nextRepositories: string[]) => {
    updateField(
      "repositories",
      nextRepositories.length ? nextRepositories : undefined
    );
  };

  const addRepository = () => {
    const repository = normalizeRepositoryUrl(newRepository);
    if (!repository) return;

    setRepositories(normalizeRepositories([...repositories, repository]));
    setNewRepository("");
  };

  const removeRepository = (repository: string) => {
    const key = normalizeRepositoryUrl(repository).toLowerCase();
    setRepositories(
      repositories.filter((item) => normalizeRepositoryUrl(item).toLowerCase() !== key)
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title={t("providers:tembo.session") ?? "Session"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.TextArea
            label={t("providers:tembo.description") ?? "Description"}
            placeholder={
              t("providers:tembo.descriptionPlaceholder") ??
              "Detailed description of the work Tembo should perform"
            }
            rows={4}
            value={config?.description ?? ""}
            onChange={(value: string) =>
              updateField("description", normalizeOptionalString(value))
            }
          />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            <theme.Input
              label={t("providers:tembo.targetBranch") ?? "Target branch"}
              placeholder="main"
              value={config?.targetBranch ?? ""}
              onChange={(e: any) =>
                updateField("targetBranch", normalizeOptionalString(e?.target?.value))
              }
            />
            <theme.Input
              label={t("providers:tembo.branchName") ?? "Work branch"}
              placeholder="feature/auth-fix"
              value={config?.branchName ?? ""}
              onChange={(e: any) =>
                updateField("branchName", normalizeOptionalString(e?.target?.value))
              }
            />
          </div>

          <theme.Switch
            id="tembo-queue-right-away"
            label={t("providers:tembo.queueRightAway") ?? "Queue right away"}
            checked={config?.queueRightAway ?? true}
            onChange={(enabled) => updateField("queueRightAway", !!enabled)}
          />
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={t("providers:tembo.repositories") ?? "Repositories"}
        description={
          t("providers:tembo.repositoriesHint") ??
          "Add the GitHub or Git repository URLs that Tembo should work on."
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div>
            <theme.Input
              value={newRepository}
              label={t("providers:tembo.addRepository") ?? "Add repository URL"}
              placeholder="https://github.com/org/repo"
              onChange={(e: any) => setNewRepository(e?.target?.value ?? "")}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addRepository();
                }
              }}
            />
            <theme.Button
              icon="add"
              size="small"
              title={t("add") ?? "Add"}
              variant="informative"
              disabled={!normalizeRepositoryUrl(newRepository)}
              onClick={addRepository}
            />
          </div>

          {repositoryItems.length > 0 ? (
            <theme.Tags size="small" items={repositoryItems} onRemove={removeRepository} />
          ) : (
            <div style={{ fontSize: 12, opacity: 0.72 }}>
              {t("providers:tembo.noRepositories") ?? "No repositories added yet."}
            </div>
          )}
        </div>
      </theme.Card>
    </div>
  );
};

