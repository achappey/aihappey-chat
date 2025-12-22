import React, { useState } from "react";
import { ResourceTags } from "aihappey-components";

export default {
    title: "Forms/ResourceTags",
    component: ResourceTags,
};

export const Default = () => {
    const [resources, setResources] = useState([
        [
            { uri: "mcp://server/resource-1", name: "Resource one" },
            { content: "example", mimeType: "text/plain" },
        ],
        [
            { uri: "mcp://server/resource-2", name: "Resource two" },
            { content: "example", mimeType: "text/plain" },
        ],
    ]);

    const removeResource = (uri) => {
        setResources((prev) => prev.filter(([r]) => r.uri !== uri));
    };

    return React.createElement(ResourceTags, {
        resources,
        removeResource,
    });
};

export const Static = () =>
    React.createElement(ResourceTags, {
        resources: [
            [
                { uri: "mcp://server/resource-1", name: "Resource one" },
                { content: "example", mimeType: "text/plain" },
            ],
            [
                { uri: "mcp://server/resource-2", name: "Resource two" },
                { content: "example", mimeType: "text/plain" },
            ],
        ],
    });

export const ExtraSmall = () =>
  React.createElement(ResourceTags, {
    size: "extra-small",
    resources: [
      [
        { uri: "mcp://server/resource-1", name: "Resource one" },
        { content: "example", mimeType: "text/plain" },
      ],
    ],
  });

export const Small = () =>
  React.createElement(ResourceTags, {
    size: "small",
    resources: [
      [
        { uri: "mcp://server/resource-1", name: "Resource one" },
        { content: "example", mimeType: "text/plain" },
      ],
    ],
  });

export const Medium = () =>
  React.createElement(ResourceTags, {
    size: "medium",
    resources: [
      [
        { uri: "mcp://server/resource-1", name: "Resource one" },
        { content: "example", mimeType: "text/plain" },
      ],
    ],
  });
