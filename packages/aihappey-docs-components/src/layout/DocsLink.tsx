import type { AnchorHTMLAttributes, ReactNode } from "react";
import { useNavigate } from "react-router";

export type DocsLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  active?: boolean;
  children: ReactNode;
};

export const DocsLink = ({ active, style, children, href, onClick, target, ...props }: DocsLinkProps) => {
  const navigate = useNavigate();

  return (
    <a
      {...props}
      href={href}
      target={target}
      onClick={(event) => {
        onClick?.(event);

        if (
          event.defaultPrevented ||
          !href ||
          target ||
          event.button !== 0 ||
          event.metaKey ||
          event.altKey ||
          event.ctrlKey ||
          event.shiftKey ||
          href.startsWith("http://") ||
          href.startsWith("https://") ||
          href.startsWith("mailto:") ||
          href.startsWith("tel:")
        ) {
          return;
        }

        event.preventDefault();
        navigate(href);
      }}
      style={{
        color: "inherit",
        textDecoration: "none",
        borderRadius: 12,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontWeight: active ? 700 : 500,
        opacity: active ? 1 : 0.82,
        ...style,
      }}
    >
      {children}
    </a>
  );
};

