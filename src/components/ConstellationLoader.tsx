import { motion } from 'motion/react';

interface ConstellationLoaderProps {
  label?: string;
}

export default function ConstellationLoader({ label = "Loading celestial data..." }: ConstellationLoaderProps) {
  const stars = [
    { x: 30, y: 65, delay: 0.0, size: 3 },
    { x: 65, y: 35, delay: 0.25, size: 4 },
    { x: 100, y: 55, delay: 0.5, size: 2.5 },
    { x: 135, y: 25, delay: 0.75, size: 4.5 },
    { x: 170, y: 60, delay: 1.0, size: 3.5 },
  ];

  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-6">
      <div className="relative w-48 h-24">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Animated Connecting Lines */}
          <motion.path
            d="M 30 65 L 65 35 L 100 55 L 135 25 L 170 60"
            stroke="currentColor"
            className="text-stellar-500/20"
            strokeWidth="1"
            strokeDasharray="4 4"
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: -20 }}
            transition={{
              repeat: Infinity,
              duration: 4,
              ease: "linear"
            }}
          />
          
          <motion.path
            d="M 30 65 L 65 35 L 100 55 L 135 25 L 170 60"
            stroke="currentColor"
            className="text-stellar-500/10"
            strokeWidth="1"
            initial={{ opacity: 0.3 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{
              repeat: Infinity,
              duration: 3,
              ease: "easeInOut"
            }}
          />

          {/* Twinkling Stars */}
          {stars.map((star, i) => (
            <g key={i}>
              {/* Outer glow ring */}
              <motion.circle
                cx={star.x}
                cy={star.y}
                r={star.size * 2}
                fill="currentColor"
                className="text-stellar-400/20"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: [0.8, 1.4, 0.8],
                  opacity: [0, 0.5, 0]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  delay: star.delay,
                  ease: "easeInOut"
                }}
              />
              {/* Core star */}
              <motion.circle
                cx={star.x}
                cy={star.y}
                r={star.size / 2}
                fill="currentColor"
                className="text-stellar-400"
                initial={{ scale: 0.6, opacity: 0.2 }}
                animate={{ 
                  scale: [0.6, 1.2, 0.6],
                  opacity: [0.2, 1, 0.2]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  delay: star.delay,
                  ease: "easeInOut"
                }}
              />
              {/* Star sparkles crosshairs for the larger stars */}
              {star.size > 3.5 && (
                <motion.path
                  d={`M ${star.x - 6} ${star.y} L ${star.x + 6} ${star.y} M ${star.x} ${star.y - 6} L ${star.x} ${star.y + 6}`}
                  stroke="currentColor"
                  className="text-stellar-400/40"
                  strokeWidth="0.75"
                  initial={{ opacity: 0, rotate: 0 }}
                  animate={{ 
                    opacity: [0, 0.8, 0],
                    rotate: [0, 15, 0]
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                    delay: star.delay,
                    ease: "easeInOut"
                  }}
                />
              )}
            </g>
          ))}
        </svg>
      </div>
      <motion.p 
        initial={{ opacity: 0.4 }}
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="text-xs font-mono tracking-widest uppercase text-slate-400 text-center"
      >
        {label}
      </motion.p>
    </div>
  );
}
