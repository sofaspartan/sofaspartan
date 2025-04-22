import { useEffect, useRef } from 'react';

interface AudioSpectrumProps {
  isPlaying: boolean;
  audioElement: HTMLAudioElement | null;
}

export const AudioSpectrum = ({ isPlaying, audioElement }: AudioSpectrumProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!audioElement || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const barCount = 4;
    const barWidth = 3;
    const barGap = 2;
    const maxHeight = 12;
    const minHeight = 2;
    const updateInterval = 100; // Update every 100ms

    const drawBars = (timestamp: number) => {
      if (!ctx || !isPlaying) return;

      // Only update if enough time has passed
      if (timestamp - lastUpdateRef.current < updateInterval) {
        animationRef.current = requestAnimationFrame(drawBars);
        return;
      }
      lastUpdateRef.current = timestamp;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < barCount; i++) {
        const height = isPlaying 
          ? minHeight + Math.random() * (maxHeight - minHeight)
          : minHeight;
        
        const x = i * (barWidth + barGap);
        const y = (canvas.height - height) / 2;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillRect(x, y, barWidth, height);
      }

      animationRef.current = requestAnimationFrame(drawBars);
    };

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(drawBars);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, audioElement]);

  return (
    <canvas
      ref={canvasRef}
      width={20}
      height={16}
      className="ml-2 self-center"
    />
  );
}; 