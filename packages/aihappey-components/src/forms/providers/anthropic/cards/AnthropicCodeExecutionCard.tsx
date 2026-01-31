import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";

export const AnthropicCodeExecutionCard = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const codeExecutionOn = !!config?.code_execution;

  return (
    <theme.Card
      size="small"
      title={t("code_execution")}
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
                  label={t(skillId)}
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
          label={t("providers:anthropic.customSkills")}
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
  );
};
