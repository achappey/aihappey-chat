import * as React from "react";
import { Accordion as RBAccordion } from "react-bootstrap";
import type { AccordionProps } from "aihappey-types";

const normalizeOpenItems = (value: string[] | string | null | undefined): string[] => {
  if (Array.isArray(value)) return value.map(String);
  if (value == null) return [];
  return [String(value)];
};

export const Accordion = ({
  items,
  openItems,
  defaultOpenItems,
  onToggle,
  multiple = false,
  collapsible = true,
  variant = "default",
  className,
  style,
}: AccordionProps) => {
  const firstEnabledKey = React.useMemo(
    () => items.find((item) => !item.disabled)?.key,
    [items]
  );

  const [internalOpenItems, setInternalOpenItems] = React.useState<string[]>(() => {
    const initial = normalizeOpenItems(defaultOpenItems);
    if (!multiple && initial.length > 1) return initial.slice(0, 1);
    if (!collapsible && initial.length === 0 && firstEnabledKey) return [firstEnabledKey];
    return initial;
  });

  const resolvedOpenItems = openItems !== undefined
    ? normalizeOpenItems(openItems)
    : internalOpenItems;

  const effectiveOpenItems = !collapsible && resolvedOpenItems.length === 0 && firstEnabledKey
    ? [firstEnabledKey]
    : resolvedOpenItems;

  const activeKey = multiple ? effectiveOpenItems : (effectiveOpenItems[0] ?? null);

  const handleSelect = (eventKey: string | string[] | null) => {
    let next = normalizeOpenItems(eventKey);

    if (!multiple && next.length > 1) next = next.slice(0, 1);
    if (!collapsible && next.length === 0 && firstEnabledKey) next = [firstEnabledKey];

    if (openItems === undefined) setInternalOpenItems(next);
    onToggle?.(next);
  };

  return (
    <RBAccordion
      className={className}
      style={style}
      activeKey={activeKey as any}
      alwaysOpen={multiple}
      flush={variant === "flush"}
      onSelect={handleSelect as any}
    >
      {items.map((item) => (
        <RBAccordion.Item key={item.key} eventKey={item.key} className={item.className}>
          <RBAccordion.Header>{item.header}</RBAccordion.Header>
          <RBAccordion.Body>{item.content}</RBAccordion.Body>
        </RBAccordion.Item>
      ))}
    </RBAccordion>
  );
};

