import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { HackathonEvent } from '@/types';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
export const adminUserId = import.meta.env.VITE_ADMIN_USER_ID || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder') && 
  !supabaseAnonKey.includes('placeholder')
);

// Client instance (null if not configured yet)
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

// Initial mock event state for preview/demo when Supabase credentials are empty
// Configured to end 24 hours from launch or fixed date
const DEFAULT_PREVIEW_END = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

let mockEventState: HackathonEvent = {
  id: 'a0000000-0000-0000-0000-000000000001',
  name: 'CYBERHACK 2026',
  status: 'idle',
  started_at: null,
  ends_at: DEFAULT_PREVIEW_END,
  launch_id: null,
  updated_at: new Date().toISOString(),
};

export function resetMockEvent(): void {
  mockEventState = {
    id: 'a0000000-0000-0000-0000-000000000001',
    name: 'CYBERHACK 2026',
    status: 'idle',
    started_at: null,
    ends_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    launch_id: null,
    updated_at: new Date().toISOString(),
  };
}

// Check if user is the permitted administrator
export function isUserAdmin(userId: string | null | undefined): boolean {
  if (!userId) return false;
  if (!adminUserId) {
    // If no ADMIN_USER_ID is set in .env, allow first authenticated user in dev mode
    return true;
  }
  return userId === adminUserId;
}

// Fetch the current single event record
export async function fetchEventRecord(): Promise<{ data: HackathonEvent | null; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    // Return mock state for preview mode
    return { data: { ...mockEventState }, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as HackathonEvent, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch event record';
    return { data: null, error: message };
  }
}

// Atomic initiation of the hackathon event
export async function initiateEvent(): Promise<{ data: HackathonEvent | null; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    // Demo Mode atomic simulation
    if (mockEventState.status !== 'idle') {
      return { data: null, error: 'Event is already initiated or finished' };
    }
    const startedAt = new Date().toISOString();
    // Default 24h event for preview
    const endsAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    const launchId = crypto.randomUUID();

    mockEventState = {
      ...mockEventState,
      status: 'running',
      started_at: startedAt,
      ends_at: endsAt,
      launch_id: launchId,
      updated_at: startedAt,
    };
    return { data: { ...mockEventState }, error: null };
  }

  try {
    // 1. Invoke atomic PostgreSQL RPC function
    const { data, error } = await supabase.rpc('initiate_hackathon');

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as HackathonEvent, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Initiation request failed';
    return { data: null, error: message };
  }
}

// Atomic transition from running to finished when time expires
export async function finishEvent(): Promise<{ data: HackathonEvent | null; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    mockEventState = {
      ...mockEventState,
      status: 'finished',
      updated_at: new Date().toISOString(),
    };
    return { data: { ...mockEventState }, error: null };
  }

  try {
    const { data, error } = await supabase.rpc('check_and_finish_hackathon');
    if (error) {
      return { data: null, error: error.message };
    }
    return { data: data as HackathonEvent, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Completion transition failed';
    return { data: null, error: message };
  }
}

// Subscribe to Supabase Realtime changes on the events table
export function subscribeToEvents(
  onUpdate: (event: HackathonEvent) => void,
  onStatusChange?: (status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR') => void
) {
  if (!isSupabaseConfigured || !supabase) {
    return () => {};
  }

  const channel = supabase
    .channel('cyberhack-live-event')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'events',
      },
      (payload) => {
        if (payload.new && typeof payload.new === 'object') {
          onUpdate(payload.new as HackathonEvent);
        }
      }
    )
    .subscribe((status) => {
      if (onStatusChange) {
        onStatusChange(status);
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}
