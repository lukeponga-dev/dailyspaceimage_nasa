import React, { useEffect, useRef } from 'react';

/**
 * AmbientStarfield Component
 * 
 * - What it does:
 *   Renders a lightweight HTML5 canvas cosmic background with drifting stardust,
 *   subtle twinkling constellations, and soft cosmic dust trails.
 * 
 * - Why it exists:
 *   Adds deep-space calm-tech atmospheric motion across all views without impacting performance.
 * 
 * - How it fits into the workflow:
 *   Mounted as a fixed, non-blocking background layer in Layout.tsx.
 */
export default function AmbientStarfield() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Generate balanced star collection
    const starCount = Math.min(65, Math.floor((width * height) / 20000));
    const stars: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      alpha: number;
      alphaSpeed: number;
      color: string;
    }> = [];

    const colors = [
      'rgba(228, 168, 83, ', // Gold
      'rgba(255, 255, 255, ', // White
      'rgba(148, 163, 184, ', // Slate
      'rgba(253, 224, 71, ',  // Bright Stellar Yellow
    ];

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        radius: Math.random() * 1.4 + 0.4,
        alpha: Math.random() * 0.7 + 0.2,
        alphaSpeed: (Math.random() * 0.01 + 0.003) * (Math.random() > 0.5 ? 1 : -1),
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw faint constellation linkages
      for (let i = 0; i < stars.length; i++) {
        const s1 = stars[i];
        s1.x += s1.vx;
        s1.y += s1.vy;
        s1.alpha += s1.alphaSpeed;

        if (s1.alpha > 0.85 || s1.alpha < 0.15) {
          s1.alphaSpeed *= -1;
        }

        // Wrap boundaries
        if (s1.x < 0) s1.x = width;
        if (s1.x > width) s1.x = 0;
        if (s1.y < 0) s1.y = height;
        if (s1.y > height) s1.y = 0;

        ctx.beginPath();
        ctx.arc(s1.x, s1.y, s1.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${s1.color}${s1.alpha.toFixed(2)})`;
        ctx.fill();

        // Connect nearby stars with faint line
        for (let j = i + 1; j < stars.length; j++) {
          const s2 = stars[j];
          const dist = Math.hypot(s1.x - s2.x, s1.y - s2.y);
          if (dist < 100) {
            const lineAlpha = (1 - dist / 100) * 0.08;
            ctx.beginPath();
            ctx.moveTo(s1.x, s1.y);
            ctx.lineTo(s2.x, s2.y);
            ctx.strokeStyle = `rgba(228, 168, 83, ${lineAlpha.toFixed(3)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-10 w-full h-full opacity-65"
    />
  );
}
