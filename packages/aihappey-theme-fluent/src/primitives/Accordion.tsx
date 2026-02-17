import * as React from "react";
import {
  Accordion as FluentAccordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
} from "@fluentui/react-components";
import type { AccordionProps } from "aihappey-types";

const toKeyList = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String);
  if (value == null) return [];

  if (typeof value !== "string" && Symbol.iterator in Object(value)) {
    return Array.from(value as Iterable<unknown>).map(String);
  }

  return [String(value)];
};

export const Accordion = ({
  items,
  openItems,
  defaultOpenItems,
  onToggle,
  multiple = false,
  collapsible = true,
  className,
  style,
}: AccordionProps) => {
  const firstEnabledKey = React.useMemo(
    () => items.find((item) => !item.disabled)?.key,
    [items]
  );

  const normalizedOpenItems = toKeyList(openItems);
  const normalizedDefaultOpenItems = toKeyList(defaultOpenItems);

  const effectiveOpenItems = !collapsible && normalizedOpenItems.length === 0 && firstEnabledKey
    ? [firstEnabledKey]
    : normalizedOpenItems;

  const effectiveDefaultOpenItems = !collapsible && normalizedDefaultOpenItems.length === 0 && firstEnabledKey
    ? [firstEnabledKey]
    : normalizedDefaultOpenItems;

  return (
    <FluentAccordion
      className={className}
      style={style}
      multiple={multiple}
      collapsible={collapsible}
      openItems={openItems === undefined
        ? undefined
        : (multiple ? effectiveOpenItems : effectiveOpenItems[0])}
      defaultOpenItems={openItems === undefined
        ? (multiple ? effectiveDefaultOpenItems : effectiveDefaultOpenItems[0])
        : undefined}
      onToggle={(_, data) => {
        const next = toKeyList(data.openItems);
        const nextOpenItems = !collapsible && next.length === 0 && firstEnabledKey
          ? [firstEnabledKey]
          : next;
        onToggle?.(nextOpenItems);
      }}
    >
      {items.map((item) => (
        <AccordionItem key={item.key} value={item.key} disabled={item.disabled} className={item.className}>
          <AccordionHeader>{item.header}</AccordionHeader>
          <AccordionPanel>{item.content}</AccordionPanel>
        </AccordionItem>
      ))}
    </FluentAccordion>
  );
};

