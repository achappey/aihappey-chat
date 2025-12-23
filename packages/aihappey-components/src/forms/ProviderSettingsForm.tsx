import { useMemo } from "react";
import { useTheme } from "../theme/ThemeContext";
import { ProviderToggleField } from "../fields/ProviderToggleField";

export type ProviderSettingsFormProps = {
    providers: string[];
    enabledProviders: string[];
    onChange: (enabledProviders: string[]) => void;

    formTitle?: string;

    columns?: number;
    sort?: boolean;
    headerActions?: React.ReactElement;

    getProviderLabel?: (provider: string) => string;
};

export const ProviderSettingsForm = ({
    providers,
    enabledProviders,
    onChange,
    formTitle,
    columns = 2,
    sort = true,
    headerActions,
    getProviderLabel,
}: ProviderSettingsFormProps) => {
    const { Card } = useTheme();

    const list = useMemo(() => {
        const arr = [...(providers ?? [])].filter(Boolean);
        return sort ? arr.sort((a, b) => a.localeCompare(b)) : arr;
    }, [providers, sort]);

    const toggle = (provider: string) => {
        const isOn = enabledProviders?.includes(provider) ?? false;
        const next = isOn
            ? (enabledProviders ?? []).filter((p) => p !== provider)
            : [...(enabledProviders ?? []), provider];

        onChange(next);
    };

    return (
        <Card size={"small"}
            title={formTitle}
            headerActions={headerActions}>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                    alignItems: "center",
                }}
            >
                {list.map((provider) => (
                    <ProviderToggleField
                        key={provider}
                        provider={provider}
                        checked={enabledProviders?.includes(provider) ?? false}
                        label={getProviderLabel?.(provider)}
                        onChange={() => toggle(provider)}
                    />
                ))}
            </div>
        </Card>
    );
};
