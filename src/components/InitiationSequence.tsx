import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sound } from '@/lib/audio';

interface InitiationSequenceProps {
  isActive: boolean;
  onComplete: () => void;
}

export const InitiationSequence: React.FC<InitiationSequenceProps> = ({ isActive, onComplete }) => {
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [progress, setProgress] = useState(0);

  const onCompleteRef = React.useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!isActive) {
      setPhase(1);
      setProgress(0);
      return;
    }

    sound.playInitiateSweep();

    // Smooth accelerating progress counter
    const start = Date.now();
    const duration = 3000;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(pct);
    }, 20);

    const timer1 = setTimeout(() => setPhase(2), 800);
    const timer2 = setTimeout(() => setPhase(3), 2000);
    const timerEnd = setTimeout(() => {
      clearInterval(interval);
      onCompleteRef.current();
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timerEnd);
    };
  }, [isActive]);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          key="initiation-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.2,
            filter: 'blur(16px) brightness(1.8)',
          }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 select-none overflow-hidden"
        >
          {/* Subtle grid and expanding ambient flash */}
          <div className="absolute inset-0 precision-grid opacity-30" />

          {/* Radial shockwave pulse */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{
              scale: phase === 3 ? 2.5 : [0.8, 1.4, 0.9],
              opacity: phase === 3 ? [0.4, 0.8, 0] : [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: phase === 3 ? 0.8 : 2,
              repeat: phase === 3 ? 0 : Infinity,
              ease: 'easeInOut',
            }}
            className="absolute w-[600px] h-[600px] rounded-full bg-radial from-[#10B981]/40 via-[#10B981]/10 to-transparent blur-3xl pointer-events-none"
          />

          {/* Expanding shockwave ring */}
          <motion.div
            initial={{ scale: 0.2, opacity: 0.8 }}
            animate={{ scale: 3.2, opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut', repeat: Infinity }}
            className="absolute w-[320px] h-[320px] rounded-full border border-[#10B981]/60 pointer-events-none"
          />

          {/* Central Aperture & Hardware Lock HUD */}
          <div className="relative z-10 flex flex-col items-center text-center max-w-xl px-6">
            <div className="relative w-72 h-72 sm:w-88 sm:h-88 flex items-center justify-center mb-6">
              {/* Spinning technical dashed reticle */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, ease: 'linear', repeat: Infinity }}
                className="absolute inset-0 rounded-full border border-dashed border-[#777B82]/50"
              />

              {/* Counter-rotating segmented chrome bezel */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 4.5, ease: 'linear', repeat: Infinity }}
                className="absolute inset-3 rounded-full border-2 border-t-[#FFFFFF] border-r-transparent border-b-[#777B82] border-l-transparent"
              />

              {/* Glowing emerald power arc */}
              <svg className="absolute inset-6 w-[calc(100%-48px)] h-[calc(100%-48px)] -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="44%"
                  fill="none"
                  stroke="#1E2025"
                  strokeWidth="4"
                />
                <motion.circle
                  cx="50%"
                  cy="50%"
                  r="44%"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="5"
                  strokeDasharray="1000"
                  strokeDashoffset={1000 - (1000 * progress) / 100}
                  strokeLinecap="round"
                  className="filter drop-shadow-[0_0_14px_rgba(16,185,129,0.9)]"
                />
              </svg>

              {/* Center Core with percentage display */}
              <div className="relative w-40 h-40 rounded-full bg-[#0A0A0C] border-2 border-[#222428] flex flex-col items-center justify-center shadow-[inset_0_0_35px_rgba(0,0,0,0.95)]">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="font-mono text-5xl sm:text-6xl font-bold tracking-tight text-white"
                >
                  {progress}
                  <span className="text-2xl text-[#10B981] font-light">%</span>
                </motion.div>
                <span className="text-[10px] font-mono tracking-[0.25em] text-[#777B82] uppercase mt-1">
                  CALIBRATING
                </span>
              </div>

              {/* Precise Corner Marks */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#10B981]" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#10B981]" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#10B981]" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#10B981]" />
            </div>

            {/* Authoritative Typography */}
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-4 py-1 rounded-full border border-[#10B981]/40 bg-[#10B981]/10 text-xs font-mono tracking-widest text-[#10B981] uppercase font-bold">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
                <span>
                  {phase === 1 && 'HARDWARE CORE ENGAGED'}
                  {phase === 2 && 'SYNCHRONIZING ARENA MATRIX'}
                  {phase === 3 && 'SYSTEM ARMED • UNLOCKING ARENA'}
                </span>
              </div>

              <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight metallic-silver-title">
                {phase === 1 && 'POWERING ARENA'}
                {phase === 2 && 'INITIALIZING MATRIX'}
                {phase === 3 && 'ARENA DEPLOYED'}
              </h1>

              <p className="font-mono text-xs tracking-[0.3em] text-[#777B82] uppercase">
                CYBERHACK 2026 • CYBERSENTINELS
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
