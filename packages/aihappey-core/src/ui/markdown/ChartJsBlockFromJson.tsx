// core/markdown/ChartJsBlockFromJson.tsx
import { parse } from "jsonc-parser";
import "chart.js/auto";
import "chartjs-adapter-date-fns";

import { ChartJsBlock } from "aihappey-components";

type Props = {
  chart: string; // raw JSON / JSONC from markdown / AI
  height?: number;
};

export const ChartJsBlockFromJson = ({ chart, height }: Props) => {
  let chartData: any;

  try {
    chartData = parse(chart);
  } catch {
    return null;
  }

  if (!chartData?.type || !chartData?.data) return null;

  return (
    <ChartJsBlock
      type={chartData.type}
      data={chartData.data}
      options={chartData.options}
      height={height}
    />
  );
};
