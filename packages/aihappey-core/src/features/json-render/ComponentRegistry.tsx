import React, { useEffect, useMemo, useState } from "react";
import { getByPath } from "@json-render/core";
import { useDataBinding, useDataValue } from "@json-render/react";
import { ChartJsBlock, useTheme } from "aihappey-components";
import type { ComponentRenderProps } from "./Renderer";

const spacingScale: Record<string, number> = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

const resolveInputValue = (value: any) =>
  value?.target?.value ?? value ?? "";

const resolveBooleanValue = (value: any) => {
  if (typeof value === "boolean") return value;
  if (value?.target) return !!value.target.checked;
  return !!value;
};

const resolveNumberValue = (value: any) => {
  if (typeof value === "number") return value;
  if (value?.target?.value) return Number(value.target.value);
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
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

const Tags = ({ element }: ComponentRenderProps<any>) => {
  const { Tags: TagsComponent } = useTheme();
  return <TagsComponent items={element.props.items} size={element.props.size} />;
};

const Breadcrumb = ({ element, onAction }: ComponentRenderProps<any>) => {
  const { Breadcrumb: BreadcrumbComponent } = useTheme();
  const items = (element.props.items ?? []).map((item: any) => ({
    ...item,
    onClick: item.action ? () => onAction?.(item.action) : undefined,
  }));
  return <BreadcrumbComponent items={items} />;
};

const Button = ({ element, onAction }: ComponentRenderProps<any>) => {
  const { Button: ButtonComponent } = useTheme();
  return (
    <ButtonComponent
      variant={element.props.variant}
      size={element.props.size}
      icon={element.props.icon}
      iconPosition={element.props.iconPosition}
      disabled={element.props.disabled}
      onClick={() => element.props.action && onAction?.(element.props.action)}
    >
      {element.props.label}
    </ButtonComponent>
  );
};

const ToggleButton = ({ element, onAction }: ComponentRenderProps<any>) => {
  const { ToggleButton: ToggleButtonComponent } = useTheme();
  return (
    <ToggleButtonComponent
      checked={element.props.checked}
      variant={element.props.variant}
      size={element.props.size}
      icon={element.props.icon}
      iconPosition={element.props.iconPosition}
      onClick={() => element.props.action && onAction?.(element.props.action)}
    >
      {element.props.label}
    </ToggleButtonComponent>
  );
};

const SplitButton = ({ element, onAction }: ComponentRenderProps<any>) => {
  const { SplitButton: SplitButtonComponent } = useTheme();
  const menuItems = (element.props.menuItems ?? []).map((item: any) => ({
    ...item,
    onClick: item.action ? () => onAction?.(item.action) : undefined,
  }));
  return (
    <SplitButtonComponent
      label={element.props.label}
      icon={element.props.icon}
      iconPosition={element.props.iconPosition}
      variant={element.props.variant}
      size={element.props.size}
      shape={element.props.shape}
      align={element.props.align}
      disabled={element.props.disabled}
      menuItems={menuItems}
      onClick={() => element.props.action && onAction?.(element.props.action)}
    />
  );
};

const Toolbar = ({ element, children }: ComponentRenderProps<any>) => {
  const { Toolbar: ToolbarComponent } = useTheme();
  return (
    <ToolbarComponent ariaLabel={element.props.ariaLabel} size={element.props.size}>
      {children}
    </ToolbarComponent>
  );
};

const ToolbarButton = ({ element, onAction }: ComponentRenderProps<any>) => {
  const { ToolbarButton: ToolbarButtonComponent } = useTheme();
  return (
    <ToolbarButtonComponent
      icon={element.props.icon}
      variant={element.props.variant}
      disabled={element.props.disabled}
      onClick={() => element.props.action && onAction?.(element.props.action)}
    >
      {element.props.label}
    </ToolbarButtonComponent>
  );
};

const ToolbarDivider = () => {
  const { ToolbarDivider: ToolbarDividerComponent } = useTheme();
  return <ToolbarDividerComponent />;
};

const Input = ({ element }: ComponentRenderProps<any>) => {
  const { Input: InputComponent } = useTheme();
  const [value, setValue] = useDataBinding<any>(element.props.valuePath);
  return (
    <InputComponent
      type={element.props.type}
      label={element.props.label}
      hint={element.props.hint}
      placeholder={element.props.placeholder}
      value={value ?? ""}
      required={element.props.required}
      disabled={element.props.disabled}
      onChange={(next: any) => setValue(resolveInputValue(next))}
    />
  );
};

const TextArea = ({ element }: ComponentRenderProps<any>) => {
  const { TextArea: TextAreaComponent } = useTheme();
  const [value, setValue] = useDataBinding<any>(element.props.valuePath);
  return (
    <TextAreaComponent
      label={element.props.label}
      placeholder={element.props.placeholder}
      rows={element.props.rows}
      value={value ?? ""}
      readOnly={element.props.readOnly}
      required={element.props.required}
      onChange={(next: any) => setValue(resolveInputValue(next))}
    />
  );
};

const Switch = ({ element }: ComponentRenderProps<any>) => {
  const { Switch: SwitchComponent } = useTheme();
  const [value, setValue] = useDataBinding<any>(element.props.valuePath);
  return (
    <SwitchComponent
      label={element.props.label}
      hint={element.props.hint}
      required={element.props.required}
      disabled={element.props.disabled}
      size={element.props.size}
      checked={!!value}
      onChange={(next: any) => setValue(resolveBooleanValue(next))}
    />
  );
};

const Slider = ({ element }: ComponentRenderProps<any>) => {
  const { Slider: SliderComponent } = useTheme();
  const [value, setValue] = useDataBinding<any>(element.props.valuePath);
  return (
    <SliderComponent
      label={element.props.label}
      min={element.props.min}
      max={element.props.max}
      step={element.props.step}
      disabled={element.props.disabled}
      showValue={element.props.showValue}
      value={Number(value ?? 0)}
      onChange={(next: any) => setValue(resolveNumberValue(next))}
    />
  );
};

const Select = ({ element }: ComponentRenderProps<any>) => {
  const { Select: SelectComponent } = useTheme();
  const [value, setValue] = useDataBinding<any>(element.props.valuePath);
  const options = element.props.options ?? [];
  const SelectControl = SelectComponent || "select";
  const selectedValue = element.props.multiple
    ? Array.isArray(value)
      ? value
      : []
    : value ?? "";
  return (
    <SelectControl
      label={element.props.label}
      placeholder={element.props.placeholder}
      multiple={element.props.multiple}
      value={selectedValue}
      values={Array.isArray(selectedValue) ? selectedValue : [selectedValue]}
      disabled={element.props.disabled}
      onChange={(next: any) => setValue(resolveInputValue(next))}
    >
      {options.map((option: any) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </SelectControl>
  );
};

const SearchBox = ({ element }: ComponentRenderProps<any>) => {
  const { SearchBox: SearchBoxComponent } = useTheme();
  const [value, setValue] = useDataBinding<any>(element.props.valuePath);
  return (
    <SearchBoxComponent
      value={value ?? ""}
      placeholder={element.props.placeholder}
      disabled={element.props.disabled}
      autoFocus={element.props.autoFocus}
      onChange={(next: any) => setValue(resolveInputValue(next))}
    />
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

const Tabs = ({ element, children, onAction }: ComponentRenderProps<any>) => {
  const { Tabs: TabsComponent } = useTheme();
  const [activeKey, setActiveKey] = useState<string | undefined>(
    element.props.activeKey ?? element.props.defaultKey,
  );

  useEffect(() => {
    if (element.props.activeKey) setActiveKey(element.props.activeKey);
  }, [element.props.activeKey]);

  const handleSelect = (key: string) => {
    setActiveKey(key);
    if (element.props.onSelectAction) {
      onAction?.(element.props.onSelectAction);
    }
  };

  return (
    <TabsComponent
      activeKey={activeKey ?? ""}
      onSelect={handleSelect}
      vertical={element.props.vertical}
      size={element.props.size}
    >
      {children}
    </TabsComponent>
  );
};

const Tab = ({ element, children }: ComponentRenderProps<any>) => {
  const { Tab: TabComponent } = useTheme();
  return (
    <TabComponent
      eventKey={element.props.eventKey}
      title={element.props.title}
      icon={element.props.icon}
      disabled={element.props.disabled}
    >
      {children}
    </TabComponent>
  );
};

const JsonViewer = ({ element }: ComponentRenderProps<any>) => {
  const { JsonViewer: JsonViewerComponent } = useTheme();
  const valueFromData = useOptionalDataValue(element.props.valuePath);
  return (
    <JsonViewerComponent
      value={valueFromData ?? element.props.value}
      title={element.props.title}
    />
  );
};

const Chart = ({ element }: ComponentRenderProps<any>) => (
  <ChartJsBlock
    type={element.props.type}
    data={element.props.data}
    options={element.props.options}
    height={element.props.height}
  />
);

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
          <tr key={row?.id ?? rowIndex}>
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

const Modal = ({ element, children, onAction }: ComponentRenderProps<any>) => {
  const { Modal: ModalComponent, Button: ButtonComponent } = useTheme();
  const actions = useMemo(() => {
    const items = [] as React.ReactNode[];
    if (element.props.secondaryAction) {
      items.push(
        <ButtonComponent
          key="secondary"
          variant="secondary"
          onClick={() => onAction?.(element.props.secondaryAction.action)}
        >
          {element.props.secondaryAction.label}
        </ButtonComponent>,
      );
    }
    if (element.props.primaryAction) {
      items.push(
        <ButtonComponent
          key="primary"
          variant="primary"
          onClick={() => onAction?.(element.props.primaryAction.action)}
        >
          {element.props.primaryAction.label}
        </ButtonComponent>,
      );
    }
    if (items.length === 0) return undefined;
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        {items}
      </div>
    );
  }, [element.props.primaryAction, element.props.secondaryAction, onAction]);

  return (
    <ModalComponent
      title={element.props.title}
      show={element.props.show ?? true}
      size={element.props.size}
      centered={element.props.centered}
      onHide={() =>
        element.props.onCloseAction && onAction?.(element.props.onCloseAction)
      }
      actions={actions}
    >
      {children}
    </ModalComponent>
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
  Tags,
  Breadcrumb,
  Button,
  ToggleButton,
  SplitButton,
  Toolbar,
  ToolbarButton,
  ToolbarDivider,
  Input,
  TextArea,
  Switch,
  Slider,
  Select,
  SearchBox,
  ProgressBar,
  Skeleton,
  Spinner,
  Image,
  Carousel,
  Tabs,
  Tab,
  Table: SimpleTable,
  DataGrid,
  JsonViewer,
  Chart,
  Metric,
  Modal,
  AudioPlayer,
};

