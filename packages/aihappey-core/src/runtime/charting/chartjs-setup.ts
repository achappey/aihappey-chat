import { Chart, registerables } from "chart.js";
import { MatrixController, MatrixElement } from "chartjs-chart-matrix";
import { SankeyController, Flow } from 'chartjs-chart-sankey';
import { TreemapController, TreemapElement } from 'chartjs-chart-treemap';
import { WordCloudController, WordElement } from 'chartjs-chart-wordcloud';
import { EdgeLine, ForceDirectedGraphController, GraphController } from "chartjs-chart-graph";
import annotationPlugin from "chartjs-plugin-annotation";
import zoomPlugin from "chartjs-plugin-zoom";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { VennDiagramController, ArcSlice } from 'chartjs-chart-venn';
import { BoxPlotController, BoxAndWiskers } from '@sgratzl/chartjs-chart-boxplot';

type RegistryItemInfo = {
    id: string;
    name: string;
    defaults?: any;
};

const readRegistryBucket = (bucket: any): RegistryItemInfo[] => {
    const items = bucket?.items ?? {};

    return Object.entries(items)
        .map(([id, item]: [string, any]) => ({
            id,
            name: item?.name ?? item?.constructor?.name ?? item?.id ?? id,
            defaults: item?.defaults,
        }))
        .sort((a, b) => a.id.localeCompare(b.id, undefined, {
            sensitivity: "base",
            numeric: true,
        }));
};

Chart.register(
    ...registerables,
    MatrixController, MatrixElement,
    TreemapController, TreemapElement,
    SankeyController, Flow,
    WordCloudController, WordElement,
    GraphController,
    ForceDirectedGraphController, EdgeLine,
    ArcSlice, VennDiagramController,
    BoxPlotController, BoxAndWiskers,
    annotationPlugin,
    zoomPlugin,
    ChartDataLabels,
);

export function getChartJsRuntimeCapabilities() {
    const registry = (Chart as any).registry;

    const controllers = readRegistryBucket(registry?.controllers).map((x) => ({
        kind: "controller",
        type: x.id,
        name: x.name,
        datasetElementType: x.defaults?.datasetElementType,
        dataElementType: x.defaults?.dataElementType,
        defaults: x.defaults,
    }));

    const elements = readRegistryBucket(registry?.elements).map((x) => ({
        kind: "element",
        id: x.id,
        name: x.name,
        defaults: x.defaults,
    }));

    const scales = readRegistryBucket(registry?.scales).map((x) => ({
        kind: "scale",
        id: x.id,
        name: x.name,
        defaults: x.defaults,
    }));

    const plugins = readRegistryBucket(registry?.plugins).map((x) => ({
        kind: "plugin",
        id: x.id,
        name: x.name,
        optionsPath: `options.plugins.${x.id}`,
        defaults: (Chart as any).defaults?.plugins?.[x.id] ?? x.defaults,
    }));

    return {
        renderer: "chartjs",
        markdownFence: "chartjs",
        chartjsVersion: Chart.version,
        controllers,
        elements,
        scales,
        plugins,
        aiRules: [
            "Render Chart.js markdown using a fenced code block with language chartjs containing JSON or JSONC.",
            "Only use chart types listed in controllers[].type.",
            "Only use scale ids listed in scales[].id.",
            "Only use element ids listed in elements[].id.",
            "Only use plugin config paths listed in plugins[].optionsPath.",
            "Do not invent chart types, scales, elements, or plugins that are not present in this capability response.",
            "Plugin options belong under options.plugins.<pluginId>; chart-level options belong under options.",
            "Return chart configs as plain data: { type, data, options }. Do not include JavaScript functions in chartjs markdown JSON.",
        ],
    };
}
