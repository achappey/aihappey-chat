import Ajv, { type ErrorObject } from "ajv";
import Ajv2019 from "ajv/dist/2019";
import Ajv2020 from "ajv/dist/2020";

export type JsonSchema = Record<string, unknown>;
export type GuidedSchemaType =
  | "object"
  | "array"
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "null";

const ajvOptions = {
  allErrors: true,
  strict: false,
  validateFormats: false,
  allowUnionTypes: true,
} as const;

const draft7Validator = new Ajv(ajvOptions);
const draft2019Validator = new Ajv2019(ajvOptions);
const draft2020Validator = new Ajv2020(ajvOptions);

function isRecord(value: unknown): value is JsonSchema {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function validatorFor(schema: JsonSchema) {
  const dialect = typeof schema.$schema === "string" ? schema.$schema : "";
  if (dialect.includes("2020-12")) return draft2020Validator;
  if (dialect.includes("2019-09")) return draft2019Validator;
  return draft7Validator;
}

function errorText(error: ErrorObject) {
  const path = error.instancePath || "/";
  const detail = error.message ?? "is invalid";
  return `${path} ${detail}`;
}

export type SchemaValidationResult =
  | { valid: true; schema: JsonSchema }
  | { valid: false; errors: string[] };

export function parseAndValidateSchema(text: string): SchemaValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : "Schema must be valid JSON."],
    };
  }

  return validateSchema(parsed);
}

export function validateSchema(value: unknown): SchemaValidationResult {
  if (!isRecord(value)) {
    return { valid: false, errors: ["The schema must be a JSON object."] };
  }
  if (value.type !== "object") {
    return {
      valid: false,
      errors: ["The root schema must explicitly have type object."],
    };
  }

  const validator = validatorFor(value);
  let valid = false;
  try {
    valid = validator.validateSchema(value) === true;
  } catch (error) {
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : "The JSON Schema is invalid."],
    };
  }

  if (!valid) {
    return {
      valid: false,
      errors: (validator.errors ?? []).map(errorText),
    };
  }
  return { valid: true, schema: value };
}

export function cloneSchema<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function schemaType(schema: JsonSchema): GuidedSchemaType | null {
  const type = schema.type;
  return type === "object" || type === "array" || type === "string" ||
    type === "number" || type === "integer" || type === "boolean" || type === "null"
    ? type
    : null;
}

export function changeSchemaType(schema: JsonSchema, type: GuidedSchemaType): JsonSchema {
  const next = cloneSchema(schema);
  next.type = type;

  if (type === "object") {
    if (!isRecord(next.properties)) next.properties = {};
    if (next.additionalProperties === undefined) next.additionalProperties = false;
    delete next.items;
  } else if (type === "array") {
    if (!isRecord(next.items)) next.items = { type: "string" };
    delete next.properties;
    delete next.required;
  } else {
    delete next.properties;
    delete next.required;
    delete next.items;
  }

  if (Array.isArray(next.enum)) {
    const compatible = next.enum.filter((item) => enumValueMatchesType(item, type));
    if (compatible.length) next.enum = compatible;
    else delete next.enum;
  }
  return next;
}

/**
 * Adds the closed-object constraint expected by Structured Outputs backends to
 * object schemas that do not already declare it. Explicit advanced values are
 * never overwritten, keeping existing schemas lossless.
 */
export function addMissingClosedObjectConstraints(schema: JsonSchema): JsonSchema {
  const visitSchema = (value: unknown): unknown => {
    if (typeof value === "boolean" || !isRecord(value)) return value;

    const next: JsonSchema = { ...value };
    if (next.type === "object" && next.additionalProperties === undefined) {
      next.additionalProperties = false;
    }

    const schemaMapKeywords = ["properties", "patternProperties", "$defs", "definitions", "dependentSchemas"];
    schemaMapKeywords.forEach((keyword) => {
      const map = next[keyword];
      if (!isRecord(map)) return;
      next[keyword] = Object.fromEntries(
        Object.entries(map).map(([name, child]) => [name, visitSchema(child)])
      );
    });

    const schemaKeywords = [
      "items", "contains", "additionalProperties", "unevaluatedProperties",
      "propertyNames", "not", "if", "then", "else",
    ];
    schemaKeywords.forEach((keyword) => {
      if (next[keyword] !== undefined) next[keyword] = visitSchema(next[keyword]);
    });

    const schemaArrayKeywords = ["prefixItems", "allOf", "anyOf", "oneOf"];
    schemaArrayKeywords.forEach((keyword) => {
      const children = next[keyword];
      if (Array.isArray(children)) next[keyword] = children.map(visitSchema);
    });

    return next;
  };

  return visitSchema(schema) as JsonSchema;
}

export function enumValueMatchesType(value: unknown, type: GuidedSchemaType) {
  if (type === "null") return value === null;
  if (type === "array") return Array.isArray(value);
  if (type === "object") return isRecord(value);
  if (type === "integer") return typeof value === "number" && Number.isInteger(value);
  return typeof value === type;
}

export function renameProperty(schema: JsonSchema, oldName: string, newName: string): JsonSchema {
  const cleanName = newName.trim();
  if (!cleanName || cleanName === oldName) return schema;
  const properties = isRecord(schema.properties) ? schema.properties : {};
  if (Object.prototype.hasOwnProperty.call(properties, cleanName)) return schema;

  const renamed: JsonSchema = {};
  Object.entries(properties).forEach(([name, value]) => {
    renamed[name === oldName ? cleanName : name] = value;
  });
  const next: JsonSchema = { ...schema, properties: renamed };
  if (Array.isArray(schema.required)) {
    next.required = schema.required.map((name) => name === oldName ? cleanName : name);
  }
  return next;
}

export function uniquePropertyName(schema: JsonSchema) {
  const properties = isRecord(schema.properties) ? schema.properties : {};
  let index = Object.keys(properties).length + 1;
  let name = `property${index}`;
  while (Object.prototype.hasOwnProperty.call(properties, name)) {
    index += 1;
    name = `property${index}`;
  }
  return name;
}

export function schemaProperties(schema: JsonSchema): Record<string, JsonSchema | boolean> {
  if (!isRecord(schema.properties)) return {};
  return schema.properties as Record<string, JsonSchema | boolean>;
}

export function isJsonSchemaObject(value: unknown): value is JsonSchema {
  return isRecord(value);
}
