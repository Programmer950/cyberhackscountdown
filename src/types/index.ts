export type EventStatus = 'idle' | 'running' | 'finished';

export interface HackathonEvent {
  id: string;
  name: string;
  status: EventStatus;
  started_at: string | null;
  ends_at: string;
  launch_id: string | null;
  updated_at: string;
}

export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isFinalTen: boolean;
  isComplete: boolean;
}

export interface AuthUser {
  id: string;
  email?: string;
  role?: string;
}

export type SyncState = 'connected' | 'connecting' | 'disconnected' | 'demo';
