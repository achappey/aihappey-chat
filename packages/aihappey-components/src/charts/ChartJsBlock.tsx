// components/charts/ChartJsBlock.tsx
import { Chart } from "react-chartjs-2";

export type ChartJsBlockProps = {
  type: any;
  data: any;
  options?: any;
  height?: number;
};

export const ChartJsBlock = ({
  type,
  data,
  options,
  height = 300,
}: ChartJsBlockProps) => {
  if (!type || !data) return null;

  return (
    <div style={{ width: "100%", height }}>
      <Chart
        type={type}
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          ...options,
        }}
      />
    </div>
  );
};
