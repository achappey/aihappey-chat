import type { ComponentProps } from "react";
import { useTheme } from "aihappey-components";

import { useTranslation } from "aihappey-i18n";

/**
 * A reusable Cancel button that uses the current theme and translation.
 * Forwards all props to the underlying themed Button.
 */
export const CancelButton = (
  { children, ...rest }: ComponentProps<"button">
) => {
  const { Button } = useTheme();
  const { t } = useTranslation();
  return (
    <Button type="button" variant="subtle" {...rest}>
      {children ?? t("cancel")}
    </Button>
  );
};
