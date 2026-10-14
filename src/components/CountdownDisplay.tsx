import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { padZero } from '@/lib/countdown';
import type { TimeRemaining } from '@/types';

interface CountdownDisplayProps {
  time: TimeRemaining;
  status: 'idle' | 'running' | 'finished';
}

interface TimeUnitProps {
  value: number;
  label: string;
  isAmber?: boolean;
}

const TimeUnit: React.FC<TimeUnitProps> = ({ value, label, isAmber = false }) => {
  const formatted = padZero(value);
  const digits = formatted.split('');

  return (
    <div className="flex flex-col items-center">
      {/* Massive digits container (Expanded without Days) */}
      <div className="flex items-center space-x-0.5 sm:space-x-1 font-mono text-5xl sm:text-7xl md:text-8xl lg:text-[96px] xl:text-[108px] font-bold tracking-tight leading-none">
        {digits.map((digit, idx) => (
          <div
            key={idx}
            className="relative w-[0.6em] h-[1.12em] overflow-hidden flex items-center justify-center"
          >
            <AnimatePresence mode="popLayout">
              <motion.span
                key={`${idx}-${digit}`}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className={`absolute inset-0 flex items-center justify-center transition-colors duration-300 ${
                  isAmber ? 'text-[#F59E0B]' : 'text-white'
                }`}
              >
                {digit}
              </motion.span>
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Technical label */}
      <span
        className={`mt-2.5 sm:mt-3.5 text-[11px] sm:text-xs md:text-sm font-mono tracking-[0.25em] uppercase font-bold transition-colors duration-300 ${
          isAmber ? 'text-[#F59E0B]/80' : 'text-[#777B82]'
        }`}
      >
        {label}
      </span>
    </div>
  );
};

export const CountdownDisplay: React.FC<CountdownDisplayProps> = ({ time, status }) => {
  const isFinalTen = time.isFinalTen && status === 'running';

  // Calculate total hours (days converted into hours + remaining hours)
  const totalHours = (time.days * 24) + time.hours;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center select-none py-2 w-full"
    >
      {/* Numbers layout: HOURS : MINUTES : SECONDS */}
      <div className="flex items-center justify-center space-x-2 sm:space-x-4 md:space-x-6">
        <TimeUnit value={totalHours} label="HOURS" isAmber={isFinalTen} />

        <div className="flex flex-col items-center justify-center pb-5 sm:pb-8">
          <span
            className={`font-mono text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extralight transition-colors duration-300 ${
              isFinalTen ? 'text-[#F59E0B]/50' : 'text-[#777B82]/60'
            }`}
          >
            :
          </span>
        </div>

        <TimeUnit value={time.minutes} label="MINUTES" isAmber={isFinalTen} />

        <div className="flex flex-col items-center justify-center pb-5 sm:pb-8">
          <span
            className={`font-mono text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extralight transition-colors duration-300 ${
              isFinalTen ? 'text-[#F59E0B]/50' : 'text-[#777B82]/60'
            }`}
          >
            :
          </span>
        </div>

        <TimeUnit value={time.seconds} label="SECONDS" isAmber={isFinalTen} />
      </div>

      {/* Final 10 seconds alert badge if active */}
      {isFinalTen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="mt-4 flex items-center space-x-2 px-3 py-1 rounded-full border border-[#F59E0B]/40 bg-[#F59E0B]/10"
        >
          <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-ping" />
          <span className="text-xs font-mono uppercase tracking-widest text-[#F59E0B] font-bold">
            T-MINUS {time.seconds}S
          </span>
        </motion.div>
      )}
    </motion.div>
  );
};
