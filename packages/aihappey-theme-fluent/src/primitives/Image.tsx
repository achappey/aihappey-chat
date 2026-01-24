import { Image as FluentImage } from "@fluentui/react-components";
import { Tooltip } from "@fluentui/react-components";

export const Image = ({
  src,
  title,
  ...rest
}: {
  src?: string;
  fit?: "none" | "center" | "contain" | "cover" | "default";
  shadow?: boolean;
  width?: string | number;
  height?: string | number;
  block?: boolean;
  title?: string;
  bordered?: boolean;
  onClick?: React.MouseEventHandler<HTMLImageElement>;
  style?: React.CSSProperties;
  shape?: "circular" | "rounded" | "square";
}): JSX.Element => {
  const image = <FluentImage loading="lazy" src={src} {...rest} />;

  return title ? (
    <Tooltip relationship="label" content={title}>
      {image}
    </Tooltip>
  ) : (
    image
  );
};
