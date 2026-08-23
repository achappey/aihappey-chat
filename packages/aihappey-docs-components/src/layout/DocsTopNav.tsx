import { useEffect, useRef, useState } from "react";
import type { DocsTopNavItem } from "../navigation/types";
import { docsActiveSurfaceStyle } from "../theme/docsThemeStyles";
import { docsBorderStyle } from "../theme/docsThemeStyles";
import { DocsLink } from "./DocsLink";

export type DocsTopNavProps = {
  items: DocsTopNavItem[];
  activePath: string;
};

const isActive = (activePath: string, href: string) => {
  if (href === "/") return activePath === "/";
  return activePath === href || activePath.startsWith(`${href}/`);
};

const DocsTopNavDropdown = ({ item, activePath }: { item: DocsTopNavItem; activePath: string }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const children = item.items ?? [];
  const active = isActive(activePath, item.href) || children.some((child) => isActive(activePath, child.href));

  useEffect(() => {
    const closeOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOutside);
    return () => document.removeEventListener("mousedown", closeOutside);
  }, []);

  return (
    <div ref={rootRef} style={{ position: "relative" }} onKeyDown={(event) => {
      if (event.key === "Escape") setOpen(false);
    }}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        style={{
          border: 0,
          color: "inherit",
          background: "transparent",
          font: "inherit",
          fontWeight: active ? 700 : 500,
          opacity: active ? 1 : 0.82,
          cursor: "pointer",
          borderRadius: 12,
          padding: "0.55rem 0.85rem",
          ...(active ? docsActiveSurfaceStyle : undefined),
        }}
      >
        {item.label} <span aria-hidden="true" style={{ fontSize: "0.75em" }}>▾</span>
      </button>
      {open ? (
        <div
          role="menu"
          aria-label={item.label}
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            zIndex: 40,
            minWidth: 190,
            padding: 8,
            display: "grid",
            gap: 4,
            border: docsBorderStyle,
            borderRadius: 12,
            background: "Canvas",
            color: "CanvasText",
            boxShadow: "0 16px 40px rgba(0,0,0,.24)",
          }}
        >
          {children.map((child) => (
            <DocsLink
              key={child.id}
              href={child.href}
              role="menuitem"
              active={isActive(activePath, child.href)}
              onClick={() => setOpen(false)}
              style={{ padding: "0.65rem 0.75rem", borderRadius: 8 }}
            >
              {child.label}
            </DocsLink>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export const DocsTopNav = ({ items, activePath }: DocsTopNavProps) => (
  <nav aria-label="Primary" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
    {items.map((item) => item.items?.length ? (
      <DocsTopNavDropdown key={item.id} item={item} activePath={activePath} />
    ) : (
      <DocsLink
        key={item.id}
        href={item.href}
        active={isActive(activePath, item.href)}
        style={{
          padding: "0.55rem 0.85rem",
          ...(isActive(activePath, item.href) ? docsActiveSurfaceStyle : undefined),
        }}
      >
        {item.label}
      </DocsLink>
    ))}
  </nav>
);

