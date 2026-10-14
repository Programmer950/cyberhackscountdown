import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface ChromeProgressRingProps {
  progress: number; // 0.0 to 1.0
  isFinalTen?: boolean;
  status: 'idle' | 'running' | 'finished';
  children: React.ReactNode;
}

export const ChromeProgressRing: React.FC<ChromeProgressRingProps> = ({
  progress,
  isFinalTen = false,
  status,
  children,
}) => {
  // SVG Dimensions & Ring Geometry (Enlarged for Dominant Screen Presence)
  const size = 520;
  const center = size / 2;
  const radius = 208;
  const circumference = 2 * Math.PI * radius; // ≈ 1306.9

  // Ensure progress bounds
  const clampedProgress = status === 'finished' ? 1.0 : Math.min(1, Math.max(0, progress));
  const strokeDashoffset = circumference * (1 - clampedProgress);

  // Generate 120 precision graduation tick marks
  const tickMarks = useMemo(() => {
    const ticks = [];
    const totalTicks = 120;
    const innerRadiusMinor = 226;
    const innerRadiusMajor = 220;
    const outerRadius = 234;

    for (let i = 0; i < totalTicks; i++) {
      const angle = (i * 360) / totalTicks;
      const isMajor = i % 10 === 0;
      const isMedium = i % 5 === 0 && !isMajor;
      const inner = isMajor ? innerRadiusMajor : isMedium ? innerRadiusMinor - 2 : innerRadiusMinor;

      ticks.push({
        angle,
        isMajor,
        isMedium,
        inner,
        outer: outerRadius,
      });
    }
    return ticks;
  }, []);

  const ringColor = isFinalTen
    ? '#F59E0B'
    : status === 'finished' || status === 'running'
    ? '#10B981'
    : '#1E2025';

  return (
    <div className="relative w-[min(94vw,60vh)] max-w-[660px] aspect-square mx-auto flex items-center justify-center p-1">
      {/* Precision ambient background glow */}
      <div
        className={`absolute inset-4 rounded-full blur-3xl opacity-25 pointer-events-none transition-colors duration-700 ${
          isFinalTen
            ? 'bg-[#F59E0B]'
            : status === 'running' || status === 'finished'
            ? 'bg-[#10B981]'
            : 'bg-[#1E2025]'
        }`}
      />

      {/* Main SVG Hardware Construction */}
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full h-full transform -rotate-90 select-none overflow-visible"
        aria-hidden="true"
      >
        <defs>
          {/* Specular machined chrome gradient */}
          <linearGradient id="chrome-bezel" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="18%" stopColor="#C7C9CC" stopOpacity="0.9" />
            <stop offset="42%" stopColor="#1E2025" stopOpacity="0.95" />
            <stop offset="68%" stopColor="#F0F1F2" stopOpacity="0.85" />
            <stop offset="85%" stopColor="#777B82" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#111317" stopOpacity="1" />
          </linearGradient>

          {/* Titanium edge gradient */}
          <linearGradient id="titanium-rim" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0A0A0C" />
            <stop offset="50%" stopColor="#222428" />
            <stop offset="100%" stopColor="#1E2025" />
          </linearGradient>

          {/* Emerald progress neon beam */}
          <linearGradient id="emerald-glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>

          {/* Amber warning glow */}
          <linearGradient id="amber-glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="ring-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Dark inner well shadow */}
          <radialGradient id="inner-well" cx="50%" cy="50%" r="50%">
            <stop offset="65%" stopColor="#000000" />
            <stop offset="88%" stopColor="#0A0A0C" />
            <stop offset="100%" stopColor="#111317" />
          </radialGradient>
        </defs>

        {/* 1. Outer Dark Titanium Rim */}
        <circle
          cx={center}
          cy={center}
          r={254}
          fill="none"
          stroke="url(#titanium-rim)"
          strokeWidth="2.5"
        />

        {/* 2. Precision Chamfered Bevel Outer Track */}
        <circle
          cx={center}
          cy={center}
          r={245}
          fill="none"
          stroke="#1E2025"
          strokeWidth="1.5"
        />

        {/* 3. Machined Specular Chrome Ring */}
        <circle
          cx={center}
          cy={center}
          r={238}
          fill="none"
          stroke="url(#chrome-bezel)"
          strokeWidth="6"
          opacity="0.9"
        />

        {/* 4. Fine Horology Graduation Marks */}
        <g opacity="0.85">
          {tickMarks.map((tick, i) => (
            <line
              key={i}
              x1={center}
              y1={center - tick.inner}
              x2={center}
              y2={center - tick.outer}
              stroke={
                tick.isMajor
                  ? isFinalTen
                    ? '#F59E0B'
                    : '#F0F1F2'
                  : tick.isMedium
                  ? '#777B82'
                  : '#222428'
              }
              strokeWidth={tick.isMajor ? 2.0 : tick.isMedium ? 1.3 : 0.8}
              strokeLinecap="round"
              transform={`rotate(${tick.angle} ${center} ${center})`}
            />
          ))}
        </g>

        {/* 5. Recessed Progress Channel / Groove */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#111317"
          strokeWidth="7"
        />

        {/* 6. Active Clockwise Progress Arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={isFinalTen ? 'url(#amber-glow)' : 'url(#emerald-glow)'}
          strokeWidth="7"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          filter="url(#ring-glow)"
          className="transition-all duration-1000 ease-linear"
        />

        {/* 7. Top 12-o'clock Index Marker */}
        <polygon
          points={`${center},${center - radius + 10} ${center - 5},${center - radius - 2} ${center + 5},${center - radius - 2}`}
          fill={ringColor}
          opacity="0.95"
        />

        {/* 8. Center Deep Black Chamber (Expanded for huge timer) */}
        <circle
          cx={center}
          cy={center}
          r={192}
          fill="url(#inner-well)"
          stroke="#222428"
          strokeWidth="1.5"
        />

        {/* 9. Concentric Fine Titanium Reticle */}
        <circle
          cx={center}
          cy={center}
          r={186}
          fill="none"
          stroke="#1E2025"
          strokeWidth="1"
          strokeDasharray="2 6"
          opacity="0.6"
        />
      </svg>

      {/* Center Dominant Content Housing */}
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full flex flex-col items-center justify-center text-center"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
};
