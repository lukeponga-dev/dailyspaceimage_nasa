import React, { useMemo } from 'react';

interface StarfieldProps {
  count?: number;
}

/**
 * Starfield Component
 * Renders atmospheric twinkling stars with randomized geometry, active in dark mode.
 */
export default function Starfield({ count = 100 }: StarfieldProps) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 0.8 + Math.random() * 1.8,
        dur: 2 + Math.random() * 5,
        delay: Math.random() * 4,
        o1: (0.05 + Math.random() * 0.2).toFixed(2),
        o2: (0.5 + Math.random() * 0.5).toFixed(2),
      })),
    [count]
  );

  return (
    <div className="stars-layer" aria-hidden="true">
      {stars.map((s) => (
        <div
          key={s.id}
          className="star"
          style={
            {
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              '--d': `${s.dur}s`,
              '--delay': `${s.delay}s`,
              '--o1': s.o1,
              '--o2': s.o2,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
