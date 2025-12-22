import {
  DrawerHeader,
  InlineDrawer,
  DrawerHeaderTitle,
  DrawerBody,
  OverlayDrawer,
} from "@fluentui/react-components";
import type { DrawerProps, DrawerSize } from "aihappey-types";

const sizeMap: Record<DrawerSize, any> = {
  small: "small",
  medium: "medium",
  large: "large",
  full: "full",
};

export const Drawer = (props: DrawerProps) => {
  const {
    open,
    onClose,
    position = "end",
    size = "small",
    overlay,
    headerNavigation,
    title,
    backdrop = true, // OverlayDrawer always has backdrop, ignore param
    children,
  } = props;

  // Early-exit: do not render anything while closed.
  // InlineDrawer from @fluentui keeps its width (≈320 px) when mounted,
  // so mounting it in a “closed” state still causes horizontal overflow.
  // By returning null here we remove the element completely until it is shown.
  if (!open) {
    return null;
  }

  return !overlay ? (
    <InlineDrawer
      open={open}
      separator
      position={position === "top" ? "end" : position}
      size={sizeMap[size]}
    >
      {title && (
        <DrawerHeader>
          {headerNavigation}
          <DrawerHeaderTitle>{title}</DrawerHeaderTitle>
        </DrawerHeader>
      )}
      <DrawerBody>{children}</DrawerBody>
    </InlineDrawer>
  ) : (
    <OverlayDrawer
      open={open}
      onOpenChange={(_, data) => !data.open && onClose?.()}
      position={position === "top" ? "end" : position}
      size={sizeMap[size]}
    >
      {title && (
        <DrawerHeader>
          {headerNavigation}
          <DrawerHeaderTitle>{title}</DrawerHeaderTitle>
        </DrawerHeader>
      )}
      <DrawerBody>{children}</DrawerBody>
    </OverlayDrawer>
  );
};
