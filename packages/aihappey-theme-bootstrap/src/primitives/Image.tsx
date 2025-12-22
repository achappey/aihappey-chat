import { Image as BSImage } from "react-bootstrap";

export const Image = ({
  src,
}: {
  src?: string;
  fit?: "none" | "center" | "contain" | "cover" | "default";
  shadow?: boolean;
  block?: boolean;
  bordered?: boolean;
  shape?: "circular" | "rounded" | "square";
}) => <BSImage src={src}></BSImage>;
