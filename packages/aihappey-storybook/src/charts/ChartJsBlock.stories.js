import React from "react";
import "chart.js/auto";
import { ChartJsBlock } from "aihappey-components";

export default {
  title: "Charts/ChartJsBlock",
  component: ChartJsBlock,
};

const barData = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  datasets: [
    {
      label: "Requests",
      data: [12, 19, 3, 5, 2],
      backgroundColor: "rgba(54, 162, 235, 0.6)",
    },
  ],
};

const lineData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May"],
  datasets: [
    {
      label: "Latency (ms)",
      data: [220, 180, 260, 210, 190],
      borderColor: "rgba(255, 99, 132, 0.9)",
      backgroundColor: "rgba(255, 99, 132, 0.2)",
      tension: 0.25,
    },
  ],
};

export const Bar = () =>
  React.createElement(ChartJsBlock, {
    type: "bar",
    data: barData,
    height: 320,
  });

export const LineWithOptions = () =>
  React.createElement(ChartJsBlock, {
    type: "line",
    data: lineData,
    height: 320,
    options: {
      plugins: {
        legend: { display: true },
        title: { display: true, text: "Line chart example" },
      },
      scales: {
        y: { beginAtZero: true },
      },
    },
  });

export const MissingTypeOrData = () =>
  React.createElement(ChartJsBlock, {
    type: null,
    data: null,
  });