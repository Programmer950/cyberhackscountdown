import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { sound } from '@/lib/audio';

interface CompletionDisplayProps {
  justCompleted?: boolean;
}

export const CompletionDisplay: React.FC<CompletionDisplayProps> = ({ justCompleted }) => {
  useEffect(() => {
    if (justCompleted) {
      sound.playCompletionChime();
    }
  }, [justCompleted]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center text-center px-4 py-2"
    >
      {/* Precision emerald lock emblem */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="mb-3 w-8 h-8 rounded-full border border-[#10B981]/50 bg-[#10B981]/10 flex items-center justify-center"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
      </motion.div>

      {/* Required prompt text: HACKATHON INITIATED */}
      <motion.h2
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="font-display text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-[#F0F1F2]"
      >
        HACKATHON INITIATED
      </motion.h2>

      {/* Required prompt text: THE ARENA IS NOW LIVE */}
      <motion.p
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.4 }}
        className="mt-2 text-xs sm:text-sm font-mono tracking-[0.25em] text-[#10B981] font-semibold uppercase"
      >
        THE ARENA IS NOW LIVE
      </motion.p>

      {/* Restrained technical status */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="mt-4 flex items-center space-x-2 text-[10px] font-mono tracking-widest text-[#777B82] uppercase"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
        <span>ENGAGEMENT ACTIVE</span>
      </motion.div>
    </motion.div>
  );
};
