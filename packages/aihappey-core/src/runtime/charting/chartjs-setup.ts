import { Chart, registerables } from "chart.js";
import { MatrixController, MatrixElement } from "chartjs-chart-matrix";
import { SankeyController, Flow } from 'chartjs-chart-sankey';
import { TreemapController, TreemapElement } from 'chartjs-chart-treemap';
import { WordCloudController, WordElement } from 'chartjs-chart-wordcloud';
import { EdgeLine, ForceDirectedGraphController, GraphController } from "chartjs-chart-graph";

Chart.register(
    ...registerables,
    MatrixController, MatrixElement,
    TreemapController, TreemapElement,
    SankeyController, Flow,
    WordCloudController, WordElement,
    GraphController,
    ForceDirectedGraphController, EdgeLine
);
