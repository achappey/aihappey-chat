import React, { useState } from "react";
import { useDarkMode } from "usehooks-ts";
import { useTheme } from "../theme/ThemeContext";

export interface CapabilityIconProps {
  icons?: any[]
}

export const CapabilityIcon: React.FC<CapabilityIconProps> = ({
  icons,
}) => {
  const { Image } = useTheme();
  const { isDarkMode } = useDarkMode();
  const icon = icons?.find((i: any) => i.theme === (isDarkMode ? "dark" : "light"))?.src
    ?? icons?.[0]?.src;

  return icon ? <Image src={icon} height={32} shape="square"></Image> : undefined;
};
