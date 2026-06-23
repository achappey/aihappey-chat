import { Box, Paper, Stack } from "@mui/material";

export const AudioPlayer = ({ src, autoPlay, controls = true, className }: any) => <audio src={src} autoPlay={autoPlay} controls={controls} className={className} />;

export const Carousel = ({ items = [], children, className, style }: any) => {
  const nodes = items.length ? items.map((item: any) => item.content ?? item.children ?? item) : children;
  return <Stack direction="row" className={className} sx={{ overflowX: "auto", scrollSnapType: "x mandatory", gap: 2, ...style }}>{Array.isArray(nodes) ? nodes.map((node: any, index: number) => <Paper key={node?.key ?? index} variant="outlined" sx={{ p: 1, flex: "0 0 auto", scrollSnapAlign: "start" }}>{node}</Paper>) : nodes}</Stack>;
};

