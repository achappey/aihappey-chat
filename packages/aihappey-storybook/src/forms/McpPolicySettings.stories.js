import React, { useState } from "react";
import { McpPolicySettings } from "aihappey-components";

export default {
    title: "Forms/McpPolicySettings",
};

const translations = {
    openWorld: "Open world access",
    destructive: "Destructive actions",
    readOnly: "Read-only operations",
    idempotent: "Idempotent operations",
};

const Wrapper = ({ initial }) => {
    const [policy, setPolicy] = useState(initial ?? {});

    const toggle = (key) => {
        setPolicy((p) => ({
            ...p,
            [key]: !p?.[key],
        }));
    };

    return React.createElement(McpPolicySettings, {
        policySettings: policy,
        toggle,
        translations,
        cardTitle: "MCP policy hints",
    });
};


/**
 * EMPTY — nothing enabled
 */
export const Empty = () =>
    React.createElement(Wrapper, {
        initial: {},
    });

/**
 * PARTIAL — some hints enabled
 */
export const Partial = () =>
    React.createElement(Wrapper, {
        initial: {
            openWorldHint: true,
            readOnlyHint: true,
        },
    });

/**
 * ALL ENABLED — full policy surface
 */
export const AllEnabled = () =>
    React.createElement(Wrapper, {
        initial: {
            openWorldHint: true,
            destructiveHint: true,
            readOnlyHint: true,
            idempotentHint: true,
        },
    });

/**
 * NO TRANSLATIONS — labels undefined (edge case)
 */
export const NoTranslations = () =>
    React.createElement(McpPolicySettings, {
        policySettings: {
            openWorldHint: true,
        },
        toggle: () => { },
        cardTitle: "Policy (raw)",
    });
