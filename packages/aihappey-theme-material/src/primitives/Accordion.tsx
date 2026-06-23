import { Accordion as MuiAccordion, AccordionDetails, AccordionSummary } from "@mui/material";
import type { AccordionProps } from "aihappey-types";
import { renderIcon } from "./icons";

export const Accordion = ({ items, openItems, defaultOpenItems, onToggle, multiple, className, style }: AccordionProps) => {
  const current = openItems ?? defaultOpenItems ?? [];
  const isOpen = (key: string) => current.includes(key);

  return (
    <div className={className} style={style}>
      {items.map((item) => (
        <MuiAccordion
          key={item.key}
          disabled={item.disabled}
          expanded={openItems ? isOpen(item.key) : undefined}
          defaultExpanded={!openItems && defaultOpenItems?.includes(item.key)}
          onChange={(_, expanded) => {
            const next = multiple
              ? expanded
                ? Array.from(new Set([...current, item.key]))
                : current.filter((key) => key !== item.key)
              : expanded ? [item.key] : [];
            onToggle?.(next);
          }}
        >
          <AccordionSummary expandIcon={renderIcon("chevronDown")}>{item.header}</AccordionSummary>
          <AccordionDetails>{item.content}</AccordionDetails>
        </MuiAccordion>
      ))}
    </div>
  );
};

