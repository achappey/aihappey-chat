import type { ReactNode } from "react";

export type DocsNavItem = {
  id: string;
  label: string;
  href: string;
  description?: string;
  badge?: string;
  items?: DocsNavItem[];
};

export type DocsNavSection = {
  id: string;
  title: string;
  items: DocsNavItem[];
};

export type DocsTopNavItem = DocsNavItem & {
  sectionIds?: string[];
};

export type DocsHomeCard = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon?: ReactNode;
};

export type DocsCodeExample = {
  id: string;
  label: string;
  language: string;
  code: string;
};

export type DocsParameter = {
  name: string;
  type: string;
  required?: boolean;
  description: ReactNode;
};

export type DocsEndpointResponse = {
  status: string;
  description: ReactNode;
  example?: DocsCodeExample;
};

export type DocsEndpointDoc = {
  id: string;
  title: string;
  surface: string;
  method: string;
  path: string;
  summary: string;
  description: ReactNode;
  auth?: ReactNode;
  parameters?: DocsParameter[];
  requestExamples?: DocsCodeExample[];
  responses?: DocsEndpointResponse[];
  errors?: DocsEndpointResponse[];
  related?: DocsNavItem[];
};

