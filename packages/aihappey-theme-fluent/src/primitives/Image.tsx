import { Image as FluentImage } from "@fluentui/react-components";

export const Image = ({
  src,
  ...rest
}: {
  src?: string;
  fit?: "none" | "center" | "contain" | "cover" | "default";
  shadow?: boolean;
  width?:string | number | undefined
  height?:string | number | undefined
  block?: boolean;
  bordered?: boolean;
  shape?: "circular" | "rounded" | "square";
}): JSX.Element => <FluentImage loading="lazy" src={src} {...rest} />;
