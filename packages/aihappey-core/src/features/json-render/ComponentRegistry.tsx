import React, { useEffect, useMemo, useState } from "react";
import { getByPath } from "@json-render/core";
import {
  useAction,
  useActions,
  useData,
  useDataBinding,
  useDataValue,
  useFieldValidation,
  useIsVisible,
  useValidation,
} from "@json-render/react";
import { ChartJsBlock, useTheme } from "aihappey-components";
import { useDarkMode } from "usehooks-ts";
import {
  buildRuntimeActionRegistryForId,
  buildRuntimeRegistryForId,
  mergeComponentRegistries,
  type JsonRenderActionItem,
  type JsonRenderRegistryItem,
  useJsonRenderRegistry,
  type RegistryRuntime,
  type RuntimeActionError,
  type RuntimeActionRegistry,
  type RuntimeRegistryError,
  type RuntimeComponentRegistry,
} from "aihappey-json-render-registry";
import type { ComponentRenderProps } from "./Renderer";

const spacingScale: Record<string, number> = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

const formatNumber = (value: unknown, format?: string, precision?: number) => {
  if (typeof value !== "number") return value;
  const digits = typeof precision === "number" ? precision : undefined;
  if (format === "currency") {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: digits,
    }).format(value);
  }
  if (format === "percent") {
    return new Intl.NumberFormat(undefined, {
      style: "percent",
      maximumFractionDigits: digits,
    }).format(value);
  }
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: digits,
  }).format(value);
};

const useOptionalDataValue = <T,>(path?: string) => {
  const safePath = path || "__missing__";
  const value = useDataValue<T>(safePath);
  return path ? value : undefined;
};

const readRowValue = (row: any, key?: string, path?: string) => {
  if (!row) return undefined;
  const field = path || key;
  if (!field) return undefined;
  if (field.startsWith("/")) {
    return getByPath(row, field);
  }
  return field.split(".").reduce((acc: any, part) => acc?.[part], row);
};

const Metric = ({ element }: ComponentRenderProps<any>) => {
  const value = useDataValue<any>(element.props.valuePath);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 12, opacity: 0.7 }}>{element.props.label}</span>
      <span style={{ fontSize: 20, fontWeight: 600 }}>
        {String(
          formatNumber(value, element.props.format, element.props.precision) ?? "",
        )}
      </span>
    </div>
  );
};

const Container = ({ element, children }: ComponentRenderProps<any>) => {
  const gap = element.props.gap;
  const padding = spacingScale[element.props.padding] ?? undefined;

  const flexDirection =
    element.props.direction === "vertical"
      ? "column"
      : element.props.direction === "horizontal"
        ? "row"
        : element.props.direction ?? "row";


  return (
    <div
      style={{
        display: "flex",
        flexDirection: flexDirection,
        gap: typeof gap === "number" ? gap : undefined,
        alignItems: element.props.align ?? undefined,
        justifyContent: element.props.justify ?? undefined,
        flexWrap: element.props.wrap ? "wrap" : undefined,
        padding,
        width: element.props.width ?? undefined,
        maxWidth: element.props.maxWidth ?? undefined,
      }}
    >
      {children}
    </div>
  );
};

const Stack = ({ element, children }: ComponentRenderProps<any>) => (
  <Container
    element={{
      ...element,
      props: { ...element.props, direction: "column" },
    }}
  >
    {children}
  </Container>
);

const Row = ({ element, children }: ComponentRenderProps<any>) => (
  <Container
    element={{
      ...element,
      props: { ...element.props, direction: "row" },
    }}
  >
    {children}
  </Container>
);

const Grid = ({ element, children }: ComponentRenderProps<any>) => {
  const gap = element.props.gap ?? 12;
  const columns = element.props.columns;
  const minColumnWidth = element.props.minColumnWidth;
  const templateColumns = columns
    ? `repeat(${columns}, minmax(0, 1fr))`
    : minColumnWidth
      ? `repeat(auto-fit, minmax(${minColumnWidth}px, 1fr))`
      : undefined;
  return (
    <div
      style={{
        display: "grid",
        gap,
        gridTemplateColumns: templateColumns,
        width: element.props.width ?? undefined,
      }}
    >
      {children}
    </div>
  );
};

const Card = ({ element, children }: ComponentRenderProps<any>) => {
  const { Card: CardComponent } = useTheme();
  return (
    <CardComponent
      title={element.props.title}
      description={element.props.description}
      text={element.props.text}
      size={element.props.size}
    >
      {children}
    </CardComponent>
  );
};

const Header = ({ element, children }: ComponentRenderProps<any>) => {
  const { Header: HeaderComponent } = useTheme();
  return (
    <HeaderComponent level={element.props.level}>
      {element.props.text ?? children}
    </HeaderComponent>
  );
};

const Paragraph = ({ element, children }: ComponentRenderProps<any>) => {
  const { Paragraph: ParagraphComponent } = useTheme();
  return (
    <ParagraphComponent>
      {element.props.text ?? children}
    </ParagraphComponent>
  );
};

const Badge = ({ element, children }: ComponentRenderProps<any>) => {
  const { Badge: BadgeComponent } = useTheme();
  return (
    <BadgeComponent appearance={element.props.appearance} bg={element.props.variant}>
      {element.props.text ?? children}
    </BadgeComponent>
  );
};

const ProgressBar = ({ element }: ComponentRenderProps<any>) => {
  const { ProgressBar: ProgressBarComponent } = useTheme();
  const dataValue = useOptionalDataValue<number>(element.props.valuePath);
  return (
    <ProgressBarComponent
      value={dataValue ?? element.props.value}
      label={element.props.label}
      variant={element.props.variant}
      striped={element.props.striped}
      animated={element.props.animated}
    />
  );
};

const Skeleton = ({ element }: ComponentRenderProps<any>) => {
  const { Skeleton: SkeletonComponent } = useTheme();
  return (
    <SkeletonComponent
      width={element.props.width}
      height={element.props.height}
      circle={element.props.circle}
      animation={element.props.animation}
    />
  );
};

const Spinner = ({ element }: ComponentRenderProps<any>) => {
  const { Spinner: SpinnerComponent } = useTheme();
  return <SpinnerComponent size={element.props.size} label={element.props.label} />;
};

const Image = ({ element }: ComponentRenderProps<any>) => {
  const { Image: ImageComponent } = useTheme();
  return (
    <ImageComponent
      src={element.props.src}
      title={element.props.title}
      width={element.props.width}
      height={element.props.height}
      fit={element.props.fit}
      bordered={element.props.bordered}
      shadow={element.props.shadow}
    />
  );
};

const Carousel = ({ element }: ComponentRenderProps<any>) => {
  const { Carousel: CarouselComponent } = useTheme();
  const slides = (element.props.slides ?? []).map((slide: any) => ({
    key: slide.key,
    caption: slide.title,
    content: slide.imageSrc ? (
      <Image element={{ ...element, props: { src: slide.imageSrc } }} />
    ) : (
      <div>
        {slide.title ? <strong>{slide.title}</strong> : null}
        {slide.description ? <div>{slide.description}</div> : null}
      </div>
    ),
  }));
  return <CarouselComponent slides={slides} />;
};
/*
const JsonViewer = ({ element }: ComponentRenderProps<any>) => {
  const { JsonViewer: JsonViewerComponent } = useTheme();
  const valueFromData = useOptionalDataValue(element.props.valuePath);
  return (
    <JsonViewerComponent
      value={valueFromData ?? element.props.value}
      title={element.props.title}
    />
  );
};*/

const Chart = ({ element }: ComponentRenderProps<any>) => {
  const dataValue = useOptionalDataValue<any>(element.props.dataPath);
  return (
    <ChartJsBlock
      type={element.props.type}
      data={dataValue ?? element.props.data}
      options={element.props.options}
      height={element.props.height}
    />
  );
};

const SimpleTable = ({ element }: ComponentRenderProps<any>) => {
  const { Table: TableComponent } = useTheme();
  const columns = element.props.columns ?? [];
  const data = useOptionalDataValue<any[]>(element.props.dataPath) ?? element.props.data;
  const rows = Array.isArray(data) ? data : [];
  return (
    <TableComponent
      striped={element.props.striped}
      bordered={element.props.bordered}
      hover={element.props.hover}
      size={element.props.size}
    >
      <thead>
        <tr>
          {columns.map((column: any) => (
            <th key={column.key}>{column.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row: any, rowIndex: number) => (
          <tr key={row?.id !== null &&
            typeof row?.id !== "object"
            ? row.id
            : rowIndex}>
            {columns.map((column: any) => {
              const value = readRowValue(row, column.key, column.fieldPath);
              return (
                <td key={column.key}>
                  {value}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </TableComponent>
  );
};
//{formatNumber(value, column.format, column.precision) ?? ""}

const DataGrid = ({ element }: ComponentRenderProps<any>) => {
  const { DataGrid: DataGridComponent } = useTheme();
  const columns = (element.props.columns ?? []).map((column: any) => ({
    key: column.key,
    header: column.header,
    sortable: column.sortable,
    width: column.width,
    render: (row: any) =>
      formatNumber(
        readRowValue(row, column.key, column.fieldPath),
        column.format,
        column.precision,
      ),
  }));
  const data = useOptionalDataValue<any[]>(element.props.dataPath) ?? element.props.data;
  const rows = Array.isArray(data) ? data : [];
  if (!DataGridComponent) {
    return (
      <SimpleTable
        element={{
          ...element,
          props: { ...element.props, data: rows },
        }}
      />
    );
  }
  return (
    <DataGridComponent
      columns={columns}
      data={rows}
      rowKey={(row: any) => row?.id}
      selectionMode={element.props.selectionMode ?? "none"}
    />
  );
};

const AudioPlayer = ({ element }: ComponentRenderProps<any>) => {
  const { AudioPlayer: AudioPlayerComponent } = useTheme();
  return <AudioPlayerComponent src={element.props.src} />;
};

export const componentRegistry = {
  Container,
  Stack,
  Row,
  Grid,
  Card,
  Header,
  Paragraph,
  Badge,
  ProgressBar,
  Skeleton,
  Spinner,
  Image,
  Carousel,
  Table: SimpleTable,
  DataGrid,
  //JsonViewer,
  Chart,
  Metric,
  AudioPlayer,
};

export const buildCombinedComponentRegistry = (
  registryItems: JsonRenderRegistryItem[],
  runtime: RegistryRuntime,
  registryId: string,
): {
  registry: RuntimeComponentRegistry;
  errors: RuntimeRegistryError[];
} => {
  const { registry: runtimeRegistry, errors } = buildRuntimeRegistryForId(
    registryItems,
    runtime,
    registryId,
  );
  return {
    registry: mergeComponentRegistries(componentRegistry, runtimeRegistry),
    errors,
  };
};

export const buildCombinedComponentRegistryForIds = (
  registryItems: JsonRenderRegistryItem[],
  runtime: RegistryRuntime,
  registryIds: string[],
): {
  registry: RuntimeComponentRegistry;
  errors: RuntimeRegistryError[];
} => {
  const ids = (registryIds ?? []).filter(Boolean);

  let runtimeRegistry: RuntimeComponentRegistry = {};
  const errors: RuntimeRegistryError[] = [];

  for (const rid of ids) {
    const res = buildRuntimeRegistryForId(registryItems, runtime, rid);
    runtimeRegistry = mergeComponentRegistries(runtimeRegistry, res.registry);
    errors.push(
      ...res.errors.map((e) => ({
        ...e,
        message: `[${rid}] ${e.message}`,
      })),
    );
  }

  return {
    registry: mergeComponentRegistries(componentRegistry, runtimeRegistry),
    errors,
  };
};

export const buildCombinedActionRegistry = (
  actionItems: JsonRenderActionItem[],
  runtime: RegistryRuntime,
  registryId: string,
): {
  handlers: RuntimeActionRegistry;
  errors: RuntimeActionError[];
} => {
  const { handlers, errors } = buildRuntimeActionRegistryForId(
    actionItems,
    runtime,
    registryId,
  );
  return {
    handlers,
    errors,
  };
};

export const buildCombinedActionRegistryForIds = (
  actionItems: JsonRenderActionItem[],
  runtime: RegistryRuntime,
  registryIds: string[],
): {
  handlers: RuntimeActionRegistry;
  errors: RuntimeActionError[];
} => {
  const ids = (registryIds ?? []).filter(Boolean);

  let handlers: RuntimeActionRegistry = {};
  const errors: RuntimeActionError[] = [];

  for (const rid of ids) {
    const res = buildRuntimeActionRegistryForId(actionItems, runtime, rid);
    handlers = { ...handlers, ...res.handlers };
    errors.push(
      ...res.errors.map((e) => ({
        ...e,
        message: `[${rid}] ${e.message}`,
      })),
    );
  }

  return { handlers, errors };
};

export const useCombinedComponentRegistry = (registryId: string) => {
  const { items, actions } = useJsonRenderRegistry();

  const runtime = useMemo<RegistryRuntime>(
    () => ({
      React,
      useDataBinding,
      useDataValue,
      useAction,
      useActions,
      useData,
      useIsVisible,
      useFieldValidation,
      useValidation,
      useTheme,
      useDarkMode,
    }),
    [],
  );

  return useMemo(
    () => {
      const components = buildCombinedComponentRegistry(items, runtime, registryId);
      const actionRuntime = buildCombinedActionRegistry(actions, runtime, registryId);
      return {
        ...components,
        actionHandlers: actionRuntime.handlers,
        actionErrors: actionRuntime.errors,
      };
    },
    [actions, items, runtime, registryId],
  );
};

export const useCombinedComponentRegistryForIds = (registryIds: string[]) => {
  const { items, actions } = useJsonRenderRegistry();

  const runtime = useMemo<RegistryRuntime>(
    () => ({
      React,
      useDataBinding,
      useDataValue,
      useAction,
      useActions,
      useData,
      useIsVisible,
      useFieldValidation,
      useValidation,
      useTheme,
      useDarkMode,
    }),
    [],
  );

  const idsKey = (registryIds ?? []).filter(Boolean).slice().sort().join("|");

  return useMemo(
    () => {
      const components = buildCombinedComponentRegistryForIds(items, runtime, registryIds);
      const actionRuntime = buildCombinedActionRegistryForIds(actions, runtime, registryIds);
      return {
        ...components,
        actionHandlers: actionRuntime.handlers,
        actionErrors: actionRuntime.errors,
      };
    },
    [actions, items, runtime, idsKey],
  );
};

