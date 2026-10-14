import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChromeProgressRing } from './ChromeProgressRing';
import { CountdownDisplay } from './CountdownDisplay';
import { CompletionDisplay } from './CompletionDisplay';
import { IdleDisplay } from './IdleDisplay';
import { InitiationSequence } from './InitiationSequence';
import { calculateTimeRemaining, calculateProgress } from '@/lib/countdown';
import { initiateEvent, finishEvent, subscribeToEvents } from '@/lib/supabase';
import { sound } from '@/lib/audio';
import type { HackathonEvent, TimeRemaining } from '@/types';
import { AlertTriangle } from 'lucide-react';

interface MainCountdownScreenProps {
  initialEvent: HackathonEvent;
  adminEmail?: string;
  onSignOut?: () => void;
  isDemoMode?: boolean;
}

export const MainCountdownScreen: React.FC<MainCountdownScreenProps> = ({
  initialEvent,
  isDemoMode = false,
}) => {
  const [event, setEvent] = useState<HackathonEvent>(initialEvent);
  const [time, setTime] = useState<TimeRemaining>(() =>
    calculateTimeRemaining(initialEvent.ends_at)
  );
  const [progress, setProgress] = useState<number>(() =>
    calculateProgress(initialEvent.started_at, initialEvent.ends_at)
  );
  const [isInitiatingServer, setIsInitiatingServer] = useState(false);
  const [showLaunchSequence, setShowLaunchSequence] = useState(false);
  const [initiationError, setInitiationError] = useState<string | null>(null);
  const [justCompleted, setJustCompleted] = useState(false);
  const [connectionWarning, setConnectionWarning] = useState(false);

  // Keep track of the known launch_id to prevent replaying animation on refresh
  const knownLaunchIdRef = useRef<string | null>(initialEvent.launch_id);
  const prevStatusRef = useRef<'idle' | 'running' | 'finished'>(initialEvent.status);

  // Sync internal state if initialEvent changes
  useEffect(() => {
    setEvent(initialEvent);
    setTime(calculateTimeRemaining(initialEvent.ends_at));
    setProgress(calculateProgress(initialEvent.started_at, initialEvent.ends_at));
    prevStatusRef.current = initialEvent.status;
    knownLaunchIdRef.current = initialEvent.launch_id;
  }, [initialEvent]);

  // Realtime subscription setup
  useEffect(() => {
    if (isDemoMode) return;

    const unsubscribe = subscribeToEvents(
      (updatedEvent: HackathonEvent) => {
        setConnectionWarning(false);

        // Check if an initiation just happened on another display or concurrently
        if (
          updatedEvent.status === 'running' &&
          updatedEvent.launch_id &&
          updatedEvent.launch_id !== knownLaunchIdRef.current &&
          prevStatusRef.current === 'idle'
        ) {
          knownLaunchIdRef.current = updatedEvent.launch_id;
          setShowLaunchSequence(true);
        }

        // Check if completion just occurred
        if (updatedEvent.status === 'finished' && prevStatusRef.current === 'running') {
          setJustCompleted(true);
        }

        prevStatusRef.current = updatedEvent.status;
        setEvent(updatedEvent);
      },
      (status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR') => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setConnectionWarning(true);
        } else if (status === 'SUBSCRIBED') {
          setConnectionWarning(false);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isDemoMode]);

  // Main high-precision 1-second interval loop
  useEffect(() => {
    const updateCountdown = () => {
      const calculated = calculateTimeRemaining(event.ends_at);
      setTime(calculated);

      if (event.status === 'running') {
        const curProgress = calculateProgress(event.started_at, event.ends_at);
        setProgress(curProgress);

        // Audio tick in final 10 seconds
        if (calculated.isFinalTen) {
          sound.playCountdownTick(calculated.seconds);
        }

        // Auto trigger atomic backend completion if countdown reached 0
        if (calculated.isComplete) {
          finishEvent().then(({ data }: { data: HackathonEvent | null }) => {
            if (data) {
              setEvent(data);
              setJustCompleted(true);
              prevStatusRef.current = 'finished';
            }
          });
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [event.ends_at, event.started_at, event.status]);

  // Handle Initiate Hackathon Button Click
  const handleInitiate = async () => {
    sound.playClick();
    setInitiationError(null);
    setIsInitiatingServer(true);

    try {
      const { data, error } = await initiateEvent();

      if (error || !data) {
        setInitiationError(error || 'Failed to initiate hackathon');
        setIsInitiatingServer(false);
        return;
      }

      // Server confirmed successful initiation!
      setEvent(data);
      knownLaunchIdRef.current = data.launch_id;
      prevStatusRef.current = 'running';

      // Trigger cinematic launch animation
      setShowLaunchSequence(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Initiation failed';
      setInitiationError(msg);
    } finally {
      setIsInitiatingServer(false);
    }
  };

  const handleLaunchSequenceComplete = useCallback(() => {
    setShowLaunchSequence(false);
  }, []);

  const isFinalTen = time.isFinalTen && event.status === 'running';

  return (
    <div className="relative h-screen max-h-screen w-full flex flex-col justify-between items-center bg-black text-[#F0F1F2] select-none p-3 sm:p-5 overflow-hidden">
      {/* Subtle Dynamic Ambient Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Subtle breathing radial glow */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: isFinalTen ? [0.35, 0.5, 0.35] : [0.15, 0.25, 0.15],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(100vw,800px)] h-[min(100vw,800px)] rounded-full blur-[140px] pointer-events-none transition-colors duration-1000 ${
            isFinalTen
              ? 'bg-[#F59E0B]/25'
              : event.status === 'running' || event.status === 'finished'
              ? 'bg-[#10B981]/20'
              : 'bg-[#1E2025]/35'
          }`}
        />

        {/* Precision metallic grid with subtle radial vignette */}
        <div className="absolute inset-0 precision-grid opacity-20 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_60%,transparent_100%)]" />

        {/* Ambient concentric circuit ring background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(95vw,850px)] aspect-square rounded-full border border-[#222428]/40 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(115vw,1050px)] aspect-square rounded-full border border-[#1E2025]/30 pointer-events-none" />
      </div>

      {/* Cinematic Launch Sequence Modal */}
      <InitiationSequence
        isActive={showLaunchSequence}
        onComplete={handleLaunchSequenceComplete}
      />

      {/* Top Header Bar */}
      <header className="relative w-full max-w-5xl flex items-center justify-between z-10 shrink-0">
        <div className="flex flex-col items-start">
          <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.25em] text-[#C7C9CC] font-semibold uppercase">
            DEPARTMENT OF CYBER SECURITY
          </span>
          <span className="text-[9px] sm:text-[10px] font-mono tracking-[0.2em] text-[#777B82] uppercase">
            CYBERSENTINELS
          </span>
        </div>

        {/* Status indicator */}
        <div className="flex items-center space-x-3">
          {connectionWarning && (
            <div className="flex items-center space-x-1 text-xs font-mono text-[#F59E0B]">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>RECONNECTING</span>
            </div>
          )}

          {isDemoMode && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#222428] bg-[#111317] text-[#777B82]">
              PREVIEW MODE
            </span>
          )}
        </div>
      </header>

      {/* Dominant Center Stage: Scaled specifically to fit 1 page without scrolling */}
      <main className="relative w-full max-w-4xl flex-1 flex flex-col items-center justify-center my-auto min-h-0 z-10">
        {/* Event Header & Clear Event Tracking Status */}
        <div className="text-center mb-1.5 sm:mb-2.5 shrink-0">
          <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight metallic-silver-title">
            CYBERHACK 2026
          </h1>

          {/* Prominent Hackathon State Tracker */}
          <div className="mt-1 flex items-center justify-center space-x-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isFinalTen
                  ? 'bg-[#F59E0B] animate-ping'
                  : event.status === 'running'
                  ? 'bg-[#10B981] animate-pulse'
                  : event.status === 'finished'
                  ? 'bg-[#10B981]'
                  : 'bg-[#777B82]'
              }`}
            />
            <span
              className={`text-xs sm:text-sm font-mono tracking-[0.25em] uppercase font-bold transition-colors duration-300 ${
                isFinalTen
                  ? 'text-[#F59E0B]'
                  : event.status === 'running'
                  ? 'text-[#10B981]'
                  : event.status === 'finished'
                  ? 'text-[#10B981]'
                  : 'text-[#777B82]'
              }`}
            >
              {event.status === 'idle' && 'AWAITING INITIATION'}
              {event.status === 'running' && (isFinalTen ? 'LIVE • FINAL 10 SECONDS' : 'LIVE')}
              {event.status === 'finished' && 'HACKATHON COMPLETED'}
            </span>
          </div>
        </div>

        {/* The Dominant Timer: Circular Chrome Progress Ring */}
        <div className="w-full flex items-center justify-center min-h-0 shrink">
          <ChromeProgressRing
            progress={progress}
            isFinalTen={isFinalTen}
            status={event.status}
          >
            {event.status === 'idle' ? (
              <IdleDisplay />
            ) : event.status === 'finished' ? (
              <CompletionDisplay justCompleted={justCompleted} />
            ) : (
              <CountdownDisplay time={time} status={event.status} />
            )}
          </ChromeProgressRing>
        </div>

        {/* Initiation Control (Only visible when event is idle) */}
        {event.status === 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="mt-3 sm:mt-4 flex flex-col items-center shrink-0"
          >
            {initiationError && (
              <p className="mb-2 text-xs font-mono text-red-400 bg-red-950/40 border border-red-900/50 px-3 py-1 rounded-md">
                {initiationError}
              </p>
            )}

            <button
              type="button"
              onClick={handleInitiate}
              disabled={isInitiatingServer}
              className="titanium-button group relative px-8 sm:px-12 py-3 sm:py-3.5 rounded-xl flex items-center space-x-3 cursor-pointer disabled:opacity-50"
            >
              <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#F0F1F2]/50 to-transparent" />
              <span className="relative w-2.5 h-2.5 rounded-full bg-[#10B981] group-hover:shadow-[0_0_8px_rgba(16,185,129,0.9)] transition-shadow" />
              <span className="font-display font-semibold tracking-wider text-sm sm:text-base text-[#F0F1F2] group-hover:text-white transition-colors">
                {isInitiatingServer ? 'INITIATING ARENA...' : 'INITIATE HACKATHON'}
              </span>
            </button>
          </motion.div>
        )}
      </main>

      {/* Minimal Single-Line Footer */}
      <footer className="relative w-full max-w-5xl flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-[#777B82]/70 pt-2 border-t border-[#222428] z-10 shrink-0">
        <div>
          <span>CYBERHACK 2026</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>CYBERSENTINELS</span>
          <span>•</span>
          <span className="text-[#C7C9CC]">DEPT OF CYBER SECURITY</span>
        </div>
      </footer>
    </div>
  );
};
