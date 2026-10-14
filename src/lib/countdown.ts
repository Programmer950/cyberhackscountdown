import type { TimeRemaining } from '@/types';

export function padZero(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

export function calculateTimeRemaining(
  endsAt: string | null | undefined,
  serverTimeOffsetMs: number = 0
): TimeRemaining {
  if (!endsAt) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalSeconds: 0,
      isFinalTen: false,
      isComplete: false,
    };
  }

  const endTimestamp = new Date(endsAt).getTime();
  const currentTimestamp = Date.now() + serverTimeOffsetMs;
  const diff = Math.max(0, endTimestamp - currentTimestamp);
  const totalSeconds = Math.floor(diff / 1000);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  const isComplete = diff <= 0;
  const isFinalTen = totalSeconds <= 10 && totalSeconds > 0;

  return {
    days,
    hours,
    minutes,
    seconds,
    totalSeconds,
    isFinalTen,
    isComplete,
  };
}

export function calculateProgress(
  startedAt: string | null | undefined,
  endsAt: string | null | undefined,
  serverTimeOffsetMs: number = 0
): number {
  if (!startedAt || !endsAt) return 0;

  const start = new Date(startedAt).getTime();
  const end = new Date(endsAt).getTime();
  const now = Date.now() + serverTimeOffsetMs;

  const total = end - start;
  if (total <= 0) return 1;

  const elapsed = Math.max(0, now - start);
  const progress = Math.min(1, Math.max(0, elapsed / total));

  return progress;
}
