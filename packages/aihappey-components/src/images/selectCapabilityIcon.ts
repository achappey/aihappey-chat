/** Keep logo identity checks aligned with the theme-aware image actually displayed. */
export const selectCapabilityIcon = <T extends { src: string; theme?: string }>(
  icons: T[] | undefined,
  isDarkMode: boolean,
): T | undefined =>
  icons?.find(icon => icon.theme === (isDarkMode ? "dark" : "light")) ?? icons?.[0];
