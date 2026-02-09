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
    const value = useStateValue<any>(element.props.valuePath);
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

const Chart = withMeta(({ element }: ComponentRenderProps<any>) => {
    const labels =
        typeof element.props.labels === "string"
            ? useStateValue(element.props.labels)
            : element.props.labels;

    const datasets =
        typeof element.props.datasets === "string"
            ? useStateValue(element.props.datasets)
            : element.props.datasets;

    const options =
        typeof element.props.options === "string"
            ? useStateValue(element.props.options)
            : element.props.options;

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
                {rows.map((row: any, rowIndex: number) => (
                    <tr key={row?.id !== null && typeof row?.id !== "object" ? row.id : rowIndex}>
                        | {columns.map((column: any) => {
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
