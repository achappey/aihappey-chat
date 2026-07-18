import { useEffect, useRef } from "react";

export const StreamingAudioVisualizer = ({ analyser }: { analyser?: AnalyserNode }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    analyser.fftSize = 256;
    const values = new Uint8Array(analyser.frequencyBinCount);
    let frame = 0;

    const draw = () => {
      frame = requestAnimationFrame(draw);
      const width = canvas.clientWidth || 640;
      const height = canvas.clientHeight || 120;
      if (canvas.width !== width * devicePixelRatio || canvas.height !== height * devicePixelRatio) {
        canvas.width = width * devicePixelRatio;
        canvas.height = height * devicePixelRatio;
        context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      }
      analyser.getByteFrequencyData(values);
      context.clearRect(0, 0, width, height);
      const gap = 2;
      const barWidth = Math.max(2, width / values.length - gap);
      context.fillStyle = "#6b8afd";
      values.forEach((value, index) => {
        const barHeight = Math.max(2, (value / 255) * (height - 8));
        context.fillRect(index * (barWidth + gap), height - barHeight, barWidth, barHeight);
      });
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [analyser]);

  return <canvas ref={canvasRef} aria-hidden="true" style={{ width: "100%", height: 120, display: "block" }} />;
};
