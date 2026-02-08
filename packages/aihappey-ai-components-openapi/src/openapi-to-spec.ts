interface OpenAPISchema {
  type?: string;
  format?: string;
  enum?: string[];
  properties?: Record<string, OpenAPISchema>;
  items?: OpenAPISchema;
  required?: string[];
  description?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  default?: unknown;
}

interface SpecElement {
  type: string;
  props: Record<string, unknown>;
  children: string[];
}

function schemaToSpec(
  schema: OpenAPISchema,
  name: string,
  required: string[] = [],
  parentKey: string = '',
  elements: Map<string, SpecElement> = new Map(),
): string {
  const key = parentKey ? `${parentKey}-${name}` : name;
  const isRequired = required.includes(name);
  const label = name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1');

  if (schema.enum) {
    elements.set(key, {
      type: 'EnumField',
      props: {
        name,
        label,
        description: schema.description,
        required: isRequired,
        options: schema.enum.map(v => ({ value: v, label: v })),
        defaultValue: schema.default as string,
      },
      children: [],
    });
  } else if (schema.type === 'string') {
    elements.set(key, {
      type: 'StringField',
      props: {
        name,
        label,
        description: schema.description,
        required: isRequired,
        format: schema.format || 'text',
        minLength: schema.minLength,
        maxLength: schema.maxLength,
        defaultValue: schema.default as string,
      },
      children: [],
    });
  } else if (schema.type === 'integer' || schema.type === 'number') {
    elements.set(key, {
      type: 'NumberField',
      props: {
        name,
        label,
        description: schema.description,
        required: isRequired,
        type: schema.type,
        minimum: schema.minimum,
        maximum: schema.maximum,
        defaultValue: schema.default as number,
      },
      children: [],
    });
  } else if (schema.type === 'boolean') {
    elements.set(key, {
      type: 'BooleanField',
      props: {
        name,
        label,
        description: schema.description,
        defaultValue: schema.default as boolean,
      },
      children: [],
    });
  } else if (schema.type === 'array' && schema.items) {
    const childKeys: string[] = [];
    const itemKey = schemaToSpec(schema.items, 'item', [], key, elements);
    childKeys.push(itemKey);

    elements.set(key, {
      type: 'ArrayField',
      props: {
        name,
        label,
        description: schema.description,
      },
      children: childKeys,
    });
  } else if (schema.type === 'object' && schema.properties) {
    const childKeys: string[] = [];

    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      const childKey = schemaToSpec(
        propSchema,
        propName,
        schema.required || [],
        key,
        elements,
      );
      childKeys.push(childKey);
    }

    elements.set(key, {
      type: 'ObjectField',
      props: {
        name,
        label,
        description: schema.description,
      },
      children: childKeys,
    });
  }

  return key;
}

// Convert full OpenAPI operation to spec
export function operationToSpec(
  operationId: string,
  method: string,
  path: string,
  schema: OpenAPISchema,
  title?: string,
  description?: string,
) {
  const elements = new Map<string, SpecElement>();
  const rootKey = 'form';
  const childKeys: string[] = [];

  if (schema.properties) {
    for (const [name, propSchema] of Object.entries(schema.properties)) {
      const childKey = schemaToSpec(
        propSchema,
        name,
        schema.required || [],
        rootKey,
        elements,
      );
      childKeys.push(childKey);
    }
  }

  elements.set(rootKey, {
    type: 'Form',
    props: {
      operationId,
      endpoint: path,
      method: method.toUpperCase(),
      title,
      description,
    },
    children: childKeys,
  });

  return {
    root: rootKey,
    elements: Object.fromEntries(elements),
  };
}