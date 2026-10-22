import React from "react";
import { useDarkMode } from "usehooks-ts";
import { useTheme } from "../theme/ThemeContext";
import { selectCapabilityIcon } from "./selectCapabilityIcon";

export interface CapabilityIconProps {
  icons?: {
    src: string,
    theme?: string
  }[]
}

export const CapabilityIcon: React.FC<CapabilityIconProps> = ({
  icons,
}) => {
  const { Image } = useTheme();
  const { isDarkMode } = useDarkMode();
  const icon = selectCapabilityIcon(icons, isDarkMode)?.src;

  return icon ? <Image src={icon} height={32} shape="square"></Image> : undefined;
};
