import {
    BrandVariants,
    Theme,
    createDarkTheme,
    createLightTheme,
    webDarkTheme,
    teamsDarkTheme,
    teamsLightTheme,
    teamsDarkV21Theme,
    teamsLightV21Theme,
    webLightTheme,
    createTeamsDarkTheme,
} from "@fluentui/react-components";
import { FluentThemePresetId } from "./ThemeProvider";

//export type FluentThemePresetId = "web" | "teams" | "teamsv21" | `brand:${string}` | `teams:brand:${string}` | string;

export type FluentThemePreset = {
    id: FluentThemePresetId;
    title: string;
    getTheme: (opts: { mode: "light" | "dark" }) => Theme;
};

export const baseFluentThemePresets: Record<"web" | "teams" | "teamsv21", FluentThemePreset> = {
    web: {
        id: "web",
        title: "Web",
        getTheme: ({ mode }) => (mode === "dark" ? webDarkTheme : webLightTheme),
    },
    teams: {
        id: "teams",
        title: "Teams",
        getTheme: ({ mode }) => (mode === "dark" ? teamsDarkTheme : teamsLightTheme),
    },
    teamsv21: {
        id: "teamsv21",
        title: "Teams v2.1",
        getTheme: ({ mode }) => (mode === "dark" ? teamsDarkV21Theme : teamsLightV21Theme),
    },
};

export function buildFluentThemePresets(
    brands?: Record<string, BrandVariants>
): Record<FluentThemePresetId, FluentThemePreset> {
    const presets: Record<string, FluentThemePreset> = { ...baseFluentThemePresets };

    for (const [brandName, variants] of Object.entries(brands ?? {})) {
        const id: FluentThemePresetId = `brand:${brandName}` as const;

        presets[id] = {
            id,
            title: brandName,
            getTheme: ({ mode }) => (mode === "dark" ?
                createDarkTheme(variants) : createLightTheme(variants)),
        };

        const teamsId = `teams:brand:${brandName}` as const;

        presets[teamsId] = {
            id: teamsId,
            title: brandName + " Teams",
            getTheme: ({ mode }) => (mode === "dark" ?
                createTeamsDarkTheme(variants) : createLightTheme(variants)),
        };

    }

    return presets as Record<FluentThemePresetId, FluentThemePreset>;
}

