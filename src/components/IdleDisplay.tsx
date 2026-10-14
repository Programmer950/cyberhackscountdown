import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';

export const IdleDisplay: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, filter: 'blur(6px)' }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center text-center px-4 py-2 select-none"
    >
      {/* Precision Standby Shield Emblem */}
      <motion.div
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="mb-3 w-12 h-12 rounded-2xl bg-[#111317] border border-[#222428] flex items-center justify-center shadow-[inset_0_0_15px_rgba(0,0,0,0.8)]"
      >
        <ShieldAlert className="w-6 h-6 text-[#777B82]" strokeWidth={1.75} />
      </motion.div>

      {/* Standby Headline */}
      <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#F0F1F2]">
        SYSTEM ARMED
      </h2>

      {/* Technical Status */}
      <p className="mt-1.5 text-xs sm:text-sm font-mono tracking-[0.25em] text-[#10B981] font-semibold uppercase">
        AWAITING INITIATION
      </p>

      {/* Subtle telemetry prompt */}
      <div className="mt-4 flex items-center space-x-2 text-[10px] sm:text-[11px] font-mono tracking-widest text-[#777B82] uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-[#777B82] animate-pulse" />
        <span>ARENA LOCKED • INITIATE TO COMMENCE</span>
      </div>
    </motion.div>
  );
};
