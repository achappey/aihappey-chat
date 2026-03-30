import { useTheme, ChartJsBlock } from "aihappey-components";
import React from "react";
import { ComponentRenderProps } from ".";
import { getByPath } from "@json-render/core";
import {
    useStateValue,
} from "@json-render/react";

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

const spacingScale: Record<string, number> = {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
};

type BuiltInMeta = {
    propsSchema: any;
    defaultProps?: Record<string, any>;
    description?: string;
};


const useOptionalDataValue = <T,>(path?: string) => {
    const safePath = path || "__missing__";
    const value = useStateValue<T>(safePath);
    return path ? value : undefined;
};

const toStatePath = (value: unknown): string | undefined => {
    if (typeof value === "string") return value;
    if (value && typeof value === "object" && typeof (value as any).$path === "string") {
        return (value as any).$path;
    }
    return undefined;
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

const resolveElementValue = <T,>(element: any, pathProp: string, valueProp: string): T | undefined => {
    const pathValue = useOptionalDataValue<T>(element?.props?.[pathProp]);
    return pathValue ?? element?.props?.[valueProp];
};

const resolveRowKey = (row: any, rowIndex: number, rowKeyPath?: string) => {
    const explicitKey = readRowValue(row, undefined, rowKeyPath);
    if (explicitKey !== undefined && explicitKey !== null && typeof explicitKey !== "object") {
        return explicitKey;
    }
    if (row?.id !== null && row?.id !== undefined && typeof row?.id !== "object") {
        return row.id;
    }
    return rowIndex;
};

const Metric = ({ element }: ComponentRenderProps<any>) => {
    const value = resolveElementValue<any>(element, "valuePath", "value");
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


export const getBuiltInMeta = (name: string): BuiltInMeta | undefined =>
    (defaultComponentRegistry as any)?.[name]?.__jsonRenderMeta;

const withMeta = <T,>(component: T, meta: BuiltInMeta) => {
    (component as any).__jsonRenderMeta = meta;
    return component;
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
                boxSizing: "border-box"
            }}
        >
            {children}
        </div>
    );
};

const Stack = ({ element, children, emit, on, bindings, loading }: ComponentRenderProps<any>) => (
    <Container
        emit={emit}
        on={on}
        bindings={bindings}
        loading={loading}
        element={{
            ...element,
            props: { ...element.props, direction: "column" },
        }}
    >
        {children}
    </Container>
);

const Row = ({ element, children, emit, on, bindings, loading }: ComponentRenderProps<any>) => (
    <Container
        emit={emit}
        on={on}
        bindings={bindings}
        loading={loading}
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

const Text = ({ element, children }: ComponentRenderProps<any>) => {
    const { Text: TextComponent } = useTheme();
    const hasChildren = React.Children.count(children) > 0;

    return (
        <TextComponent
            as={element.props.as}
            size={element.props.size}
            weight={element.props.weight}
            italic={element.props.italic}
            underline={element.props.underline}
            strikethrough={element.props.strikethrough}
            truncate={element.props.truncate}
            wrap={element.props.wrap}
            block={element.props.block}
            font={element.props.font}
        >
            {hasChildren ? children : element.props.text}
        </TextComponent>
    );
};

const Card = withMeta(({ element, children }: ComponentRenderProps<any>) => {
    const { Card: CardComponent } = useTheme();
    return (
        <CardComponent
            title={element.props.title}
            description={element.props.description}
            text={element.props.text}
            size={element.props.size}
        >
            <div>
                {children}
            </div>
        </CardComponent>
    );
}, {
    description: "Card",
    propsSchema: {
        type: "object",
        properties: {
            title: { type: "string" },
            description: { type: "string" },
            text: { type: "string" },
            size: { type: "string" },
        },
        additionalProperties: false,
    },
    defaultProps: {},
});

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

const Carousel = ({ element, emit, on, bindings, loading }: ComponentRenderProps<any>) => {
    const { Carousel: CarouselComponent } = useTheme();
    const slides = (element.props.slides ?? []).map((slide: any) => ({
        key: slide.key,
        caption: slide.title,
        content: slide.imageSrc ? (
            <Image
                element={{ ...element, props: { src: slide.imageSrc } }}
                emit={emit}
                on={on}
                bindings={bindings}
                loading={loading}
            />
        ) : (
            <div>
                {slide.title ? <strong>{slide.title}</strong> : null}
                {slide.description ? <div>{slide.description}</div> : null}
            </div>
        ),
    }));
    return <CarouselComponent slides={slides} />;
};

const Chart = withMeta(({ element }: ComponentRenderProps<any>) => {
    const labelsFromState = useOptionalDataValue<any[]>(element.props.labelsPath ?? toStatePath(element.props.labels));
    const datasetsFromState = useOptionalDataValue<any[]>(element.props.datasetsPath ?? toStatePath(element.props.datasets));
    const optionsFromState = useOptionalDataValue<any>(element.props.optionsPath ?? toStatePath(element.props.options));

    const labels = Array.isArray(labelsFromState)
        ? labelsFromState
        : Array.isArray(element.props.labels)
            ? element.props.labels
            : [];

    const datasets = Array.isArray(datasetsFromState)
        ? datasetsFromState
        : Array.isArray(element.props.datasets)
            ? element.props.datasets
            : [];

    const options = optionsFromState
        ?? (element.props.options && typeof element.props.options === "object" && !Array.isArray(element.props.options)
            ? element.props.options
            : undefined);

    return (
        <ChartJsBlock
            type={element.props.type}
            data={{
                labels,
                datasets
            }}
            options={options}
            height={element.props.height}
        />
    );
}, {
    description: "ChartJS",
    propsSchema: {
        type: "object",
        properties: {
            type: { type: "string" },
            height: { type: "number" },
        },
        additionalProperties: false,
    },
    defaultProps: {},
});

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
                {rows.length === 0 && element.props.emptyText ? (
                    <tr>
                        <td colSpan={Math.max(columns.length, 1)}>{element.props.emptyText}</td>
                    </tr>
                ) : null}
                {rows.map((row: any, rowIndex: number) => (
                    <tr key={resolveRowKey(row, rowIndex, element.props.rowKeyPath)}>
                        {columns.map((column: any) => {
                            const value = readRowValue(row, column.key, column.fieldPath);
                            const formatted = formatNumber(value, column.format, column.precision);
                            return (
                                <td key={column.key}>
                                    {formatted == null ? "" : String(formatted)}
                                </td>
                            );
                        })}
                    </tr>
                ))}
            </tbody>
        </TableComponent>
    );
};

const DataGrid = ({ element, emit, on, bindings, loading }: ComponentRenderProps<any>) => {
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
                emit={emit}
                on={on}
                bindings={bindings}
                loading={loading}
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
            rowKey={(row: any, rowIndex?: number) => resolveRowKey(row, rowIndex ?? 0, element.props.rowKeyPath)}
            selectionMode={element.props.selectionMode ?? "none"}
        />
    );
};

const AudioPlayer = ({ element }: ComponentRenderProps<any>) => {
    const { AudioPlayer: AudioPlayerComponent } = useTheme();
    return <AudioPlayerComponent src={element.props.src} />;
};

export const defaultComponentRegistry = {
    Container,
    Stack,
    Row,
    Grid,
    Card,
    Badge,
    Text,
    ProgressBar,
    Skeleton,
    Spinner,
    Image,
    Carousel,
    Table: SimpleTable,
    DataGrid,
    Chart,
    Metric,
    AudioPlayer,
};
