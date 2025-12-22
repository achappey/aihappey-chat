import { TagGroup } from "aihappey-types";
import React from "react";
import {
  TagGroup as FTagGroup, Tag, Image,
  InteractionTag,
  InteractionTagPrimary,
  InteractionTagSecondary
} from "@fluentui/react-components";
import { iconMap } from "./Button";


export const Tags2 = ({ items, onRemove, size }: TagGroup): React.ReactNode => (
  <div>
    <FTagGroup
      aria-label="Fluent tag group"
      size={size}
      onDismiss={onRemove ? (_e, data) => onRemove(data.value) : undefined}
      style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
    >
      {items?.map((tag) => (
        <InteractionTag value={tag.key} key={tag.key}>
          <InteractionTagPrimary
            icon={
              tag.icon && iconMap[tag.icon]
                ? React.createElement(iconMap[tag.icon])
                : tag.image ? <Image width={size == "small" ? 16 : 20} src={tag.image} /> : undefined
            }
            hasSecondaryAction={onRemove != undefined}>
            {tag.label}
          </InteractionTagPrimary>
          {onRemove && <InteractionTagSecondary aria-label="remove" />}
        </InteractionTag>
      ))}
    </FTagGroup>
  </div>
);


export const Tags = ({ items, onRemove, size }: TagGroup): React.ReactNode => (
  <div>
    <FTagGroup
      aria-label="Fluent tag group"
      size={size}
      onDismiss={onRemove ? (_e, data) => onRemove(data.value) : undefined}
      style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
    >
      {items?.map((tag) => (
        <Tag
          key={tag.key}
          value={tag.key}
          icon={
            tag.icon && iconMap[tag.icon]
              ? React.createElement(iconMap[tag.icon])
              : tag.image ? <Image width={size == "small" ? 16 : 20} src={tag.image} /> : undefined
          }
          size={size}
          dismissible={!!onRemove}
          dismissIcon={onRemove ? { "aria-label": "Remove" } : undefined}
        >
          {tag.label}
        </Tag>
      ))}
    </FTagGroup>
  </div>
);
