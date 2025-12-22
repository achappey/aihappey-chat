import React, { useState } from "react";
import { ElicitationField } from "aihappey-components";

export default {
  title: "Forms/ElicitationField",
};

const Controlled = ({ fieldName, field, required = false, initial }) => {
  const [value, setValue] = useState(initial);

  return React.createElement(ElicitationField, {
    fieldName,
    field,
    value,
    required,
    onChange: (v) => setValue(v?.target ? v.target.value : v),
  });
};

export const BooleanSwitch = () =>
  React.createElement(Controlled, {
    fieldName: "isActive",
    initial: true,
    field: {
      type: "boolean",
      title: "Active",
      description: "Enable or disable this feature",
    },
  });

export const SelectOneOf = () =>
  React.createElement(Controlled, {
    fieldName: "priority",
    initial: "medium",
    required: true,
    field: {
      type: "string",
      title: "Priority",
      description: "Select a priority level",
      oneOf: [
        { const: "low", title: "Low" },
        { const: "medium", title: "Medium" },
        { const: "high", title: "High" },
      ],
    },
  });

export const TextAreaDefault = () =>
  React.createElement(Controlled, {
    fieldName: "description",
    initial: "",
    field: {
      type: "string",
      title: "Description",
      description: "Free-form description",
    },
  });

export const NumberField = () =>
  React.createElement(Controlled, {
    fieldName: "amount",
    initial: 5,
    field: {
      type: "number",
      title: "Amount",
      minimum: 0,
      maximum: 10,
    },
  });

export const IntegerField = () =>
  React.createElement(Controlled, {
    fieldName: "count",
    initial: 1,
    field: {
      type: "integer",
      title: "Count",
      minimum: 0,
      maximum: 100,
    },
  });

export const EmailField = () =>
  React.createElement(Controlled, {
    fieldName: "email",
    initial: "",
    required: true,
    field: {
      type: "string",
      format: "email",
      title: "Email",
    },
  });

export const UrlField = () =>
  React.createElement(Controlled, {
    fieldName: "website",
    initial: "",
    field: {
      type: "string",
      format: "uri",
      title: "Website",
    },
  });

export const DateField = () =>
  React.createElement(Controlled, {
    fieldName: "startDate",
    initial: "",
    field: {
      type: "string",
      format: "date",
      title: "Start date",
    },
  });

export const DateTimeField = () =>
  React.createElement(Controlled, {
    fieldName: "eventTime",
    initial: "",
    field: {
      type: "string",
      format: "date-time",
      title: "Event time",
    },
  });

export const WithLengthConstraints = () =>
  React.createElement(Controlled, {
    fieldName: "username",
    initial: "",
    required: true,
    field: {
      type: "string",
      title: "Username",
      minLength: 3,
      maxLength: 12,
    },
  });

export const DecimalWithStep = () =>
  React.createElement(Controlled, {
    fieldName: "ratio",
    initial: 0.5,
    field: {
      type: "number",
      title: "Ratio",
      minimum: 0,
      maximum: 1,
    },
  });
