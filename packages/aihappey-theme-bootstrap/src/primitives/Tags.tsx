import { TagItem } from "aihappey-types";
import React, { useState } from "react";
import Badge from "react-bootstrap/Badge";
import CloseButton from "react-bootstrap/CloseButton";

function Tags(
  tags: TagItem[],
  onRemove?: (id: any) => Promise<void>
): React.ReactNode {
  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          marginBottom: 8,
        }}
      >
        {tags.map((tag) => (
          <Badge pill bg="primary" key={tag.key}>
            {tag.label}
            {onRemove && (
              <CloseButton
                variant="white"
                onClick={() => onRemove(tag.key)}
                style={{ marginLeft: 4, fontSize: 10 }}
                aria-label="Remove"
              />
            )}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export default Tags;
