import Offcanvas from "react-bootstrap/Offcanvas";
import type { DrawerProps, DrawerSize } from "aihappey-types";

// Map DrawerSize to custom class for width control
const sizeClass: Record<DrawerSize, string> = {
  small: "aih-drawer-sm",
  medium: "aih-drawer-md",
  large: "aih-drawer-lg",
  full: "aih-drawer-full",
};

export const Drawer = ({
  open,
  onClose,
  position = "end",
  size = "small",
  title,
  backdrop = false,
  children,
}: DrawerProps) => (
  <Offcanvas
    show={open}
    onHide={onClose}
    placement={position}
    backdrop={backdrop}
    className={sizeClass[size]}
  >
    {title && (
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>{title}</Offcanvas.Title>
      </Offcanvas.Header>
    )}
    <Offcanvas.Body>{children}</Offcanvas.Body>
  </Offcanvas>
);
