'use client';

import React, { useState } from 'react';

interface FieldProps {
  name: string;
  value: unknown;
  onChange: (name: string, value: unknown) => void;
}

const fields: Record<string, React.FC<any>> = {
  StringField: ({ name, label, description, required, format, value, onChange }) => (
    <div className="space-y-1">
      <label className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <input
        type={format === 'email' ? 'email' : format === 'password' ? 'password' : 'text'}
        className="w-full px-3 py-2 border rounded text-sm"
        value={(value as string) || ''}
        onChange={(e) => onChange(name, e.target.value)}
        required={required}
      />
    </div>
  ),

  NumberField: ({ name, label, description, required, minimum, maximum, value, onChange }) => (
    <div className="space-y-1">
      <label className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <input
        type="number"
        className="w-full px-3 py-2 border rounded text-sm"
        value={(value as number) ?? ''}
        min={minimum}
        max={maximum}
        onChange={(e) => onChange(name, e.target.value ? parseFloat(e.target.value) : undefined)}
        required={required}
      />
    </div>
  ),

  BooleanField: ({ name, label, description, value, onChange }) => (
    <div className="flex items-start gap-2">
      <input
        type="checkbox"
        id={name}
        checked={Boolean(value)}
        onChange={(e) => onChange(name, e.target.checked)}
        className="mt-1"
      />
      <div>
        <label htmlFor={name} className="text-sm font-medium">{label}</label>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    </div>
  ),

  EnumField: ({ name, label, description, required, options, value, onChange }) => (
    <div className="space-y-1">
      <label className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <select
        className="w-full px-3 py-2 border rounded text-sm"
        value={(value as string) || ''}
        onChange={(e) => onChange(name, e.target.value)}
        required={required}
      >
        <option value="">Select...</option>
        {options?.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label || opt.value}
          </option>
        ))}
      </select>
    </div>
  ),

  ObjectField: ({ name, label, description, children }) => (
    <fieldset className="border rounded p-4 space-y-4">
      <legend className="text-sm font-medium px-2">{label}</legend>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      {children}
    </fieldset>
  ),

  Form: ({ title, description, endpoint, method, children, onSubmit }) => (
    <form
      className="space-y-4 max-w-md"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
    >
      {title && <h2 className="text-lg font-semibold">{title}</h2>}
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {children}
      <button
        type="submit"
        className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm"
      >
        {method === 'POST' ? 'Create' : method === 'PUT' ? 'Update' : 'Submit'}
      </button>
    </form>
  ),
};

interface OpenAPIFormProps {
  spec: {
    root: string;
    elements: Record<string, any>;
  };
  onSubmit: (data: Record<string, unknown>) => void;
}

export function OpenAPIForm({ spec, onSubmit }: OpenAPIFormProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  const handleChange = (name: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  function renderElement(key: string): React.ReactNode {
    const element = spec.elements[key];
    if (!element) return null;

    const Field = fields[element.type];
    if (!Field) return null;

    const children = element.children?.map(renderElement);

    return (
      <Field
        key={key}
        {...element.props}
        value={formData[element.props.name]}
        onChange={handleChange}
        onSubmit={() => onSubmit(formData)}
      >
        {children}
      </Field>
    );
  }

  return <>{renderElement(spec.root)}</>;
}