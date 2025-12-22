import React from "react";
import { ElicitationForm } from "aihappey-components";

export default {
    title: "Forms/ElicitationForm",
};

const onRespond = (r) => {
    console.log("elicitation result", r);
};

/**
 * COMPLETE FORM — EMPTY
 * Covers ALL supported field types without defaults
 */
export const AllFieldsEmpty = () =>
    React.createElement(ElicitationForm, {
        params: {
            message: "Complete form (empty)",
            requestedSchema: {
                type: "object",
                required: [
                    "name",
                    "email",
                    "active",
                    "priority",
                    "count",
                ],
                properties: {
                    name: {
                        type: "string",
                        title: "Name",
                        description: "Full name",
                    },
                    description: {
                        type: "string",
                        title: "Description",
                        description: "Free text",
                    },
                    email: {
                        type: "string",
                        format: "email",
                        title: "Email",
                    },
                    website: {
                        type: "string",
                        format: "uri",
                        title: "Website",
                    },
                    active: {
                        type: "boolean",
                        title: "Active",
                    },
                    priority: {
                        type: "string",
                        title: "Priority",
                        oneOf: [
                            { const: "low", title: "Low" },
                            { const: "medium", title: "Medium" },
                            { const: "high", title: "High" },
                        ],
                    },
                    count: {
                        type: "integer",
                        title: "Count",
                        minimum: 0,
                        maximum: 10,
                    },
                    ratio: {
                        type: "number",
                        title: "Ratio",
                        minimum: 0,
                        maximum: 1,
                    },
                    startDate: {
                        type: "string",
                        format: "date",
                        title: "Start date",
                    },
                    eventTime: {
                        type: "string",
                        format: "date-time",
                        title: "Event time",
                    },
                },
            },
        },
        onRespond,
    });

/**
 * COMPLETE FORM — WITH DEFAULTS
 * Exercises coercion + default handling
 */
export const AllFieldsWithDefaults = () =>
    React.createElement(ElicitationForm, {
        params: {
            message: "Complete form (with defaults + coercion)",
            requestedSchema: {
                type: "object",
                required: [
                    "name",
                    "email",
                    "active",
                    "priority",
                    "count",
                ],
                properties: {
                    name: {
                        type: "string",
                        title: "Name",
                        defaultValue: "Arthur",
                    },
                    description: {
                        type: "string",
                        title: "Description",
                        defaultValue: "Default description text",
                    },
                    email: {
                        type: "string",
                        format: "email",
                        title: "Email",
                        defaultValue: "arthur@example.com",
                    },
                    website: {
                        type: "string",
                        format: "uri",
                        title: "Website",
                        defaultValue: "https://example.com",
                    },
                    active: {
                        type: "boolean",
                        title: "Active",
                        defaultValue: "true", // string → boolean
                    },
                    priority: {
                        type: "string",
                        title: "Priority",
                        defaultValue: "medium",
                        oneOf: [
                            { const: "low", title: "Low" },
                            { const: "medium", title: "Medium" },
                            { const: "high", title: "High" },
                        ],
                    },
                    count: {
                        type: "integer",
                        title: "Count",
                        defaultValue: "3", // string → integer
                        minimum: 0,
                        maximum: 10,
                    },
                    ratio: {
                        type: "number",
                        title: "Ratio",
                        defaultValue: "0.75", // string → number
                        minimum: 0,
                        maximum: 1,
                    },
                    startDate: {
                        type: "string",
                        format: "date",
                        title: "Start date",
                        defaultValue: "2025-01-01",
                    },
                    eventTime: {
                        type: "string",
                        format: "date-time",
                        title: "Event time",
                        defaultValue: "2025-01-01T09:30",
                    },
                },
            },
        },
        onRespond,
    });

export const AllFieldsWithDescriptions = () =>
    React.createElement(ElicitationForm, {
        params: {
            message: "Complete form with descriptions for every field",
            requestedSchema: {
                type: "object",
                required: [
                    "name",
                    "email",
                    "active",
                    "priority",
                    "count",
                ],
                properties: {
                    name: {
                        type: "string",
                        title: "Name",
                        description: "Enter the full name of the user",
                    },
                    description: {
                        type: "string",
                        title: "Description",
                        description: "Additional context or free-form notes",
                    },
                    email: {
                        type: "string",
                        format: "email",
                        title: "Email",
                        description: "Primary contact email address",
                    },
                    website: {
                        type: "string",
                        format: "uri",
                        title: "Website",
                        description: "Public website or profile URL",
                    },
                    active: {
                        type: "boolean",
                        title: "Active",
                        description: "Indicates whether the entity is active",
                    },
                    priority: {
                        type: "string",
                        title: "Priority",
                        description: "Select the priority level",
                        oneOf: [
                            { const: "low", title: "Low" },
                            { const: "medium", title: "Medium" },
                            { const: "high", title: "High" },
                        ],
                    },
                    count: {
                        type: "integer",
                        title: "Count",
                        description: "Whole number between 0 and 10",
                        minimum: 0,
                        maximum: 10,
                    },
                    ratio: {
                        type: "number",
                        title: "Ratio",
                        description: "Decimal value between 0 and 1",
                        minimum: 0,
                        maximum: 1,
                    },
                    startDate: {
                        type: "string",
                        format: "date",
                        title: "Start date",
                        description: "Date when the process starts",
                    },
                    eventTime: {
                        type: "string",
                        format: "date-time",
                        title: "Event time",
                        description: "Exact date and time of the event",
                    },
                },
            },
        },
        onRespond,
    });
