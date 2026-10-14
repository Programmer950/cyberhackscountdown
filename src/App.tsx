import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, isUserAdmin, fetchEventRecord, resetMockEvent } from '@/lib/supabase';
import { LoginScreen } from '@/components/LoginScreen';
import { MainCountdownScreen } from '@/components/MainCountdownScreen';
import type { HackathonEvent } from '@/types';
import { Loader2 } from 'lucide-react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [eventData, setEventData] = useState<HackathonEvent | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Check auth session and fetch initial event data
  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        if (!isSupabaseConfigured || !supabase) {
          // If Supabase is not configured yet, stop loading so user can use preview/demo mode or see setup instructions
          setLoading(false);
          return;
        }

        // 1. Check existing Supabase session
        const { data: sessionData } = await supabase.auth.getSession();
        const activeUser = sessionData?.session?.user;

        if (activeUser && isUserAdmin(activeUser.id)) {
          if (mounted) {
            setUser({ id: activeUser.id, email: activeUser.email });
          }

          // 2. Fetch event record
          const { data: event, error: eventErr } = await fetchEventRecord();
          if (event && !eventErr && mounted) {
            setEventData(event);
          }
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initialize();

    // Listen to Supabase Auth State changes
    if (supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (_event: AuthChangeEvent, session: Session | null) => {
          const authUser = session?.user;
          if (authUser && isUserAdmin(authUser.id)) {
            setUser({ id: authUser.id, email: authUser.email });
            const { data: event } = await fetchEventRecord();
            if (event && mounted) {
              setEventData(event);
            }
          } else {
            setUser(null);
          }
        }
      );

      return () => {
        mounted = false;
        authListener.subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, []);

  // Handler for successful login
  const handleLoginSuccess = async (loggedInUser: { id: string; email?: string }) => {
    setUser(loggedInUser);
    setLoading(true);
    const { data: event } = await fetchEventRecord();
    if (event) {
      setEventData(event);
    }
    setLoading(false);
  };

  // Handler for entering demo/preview mode (when Supabase credentials are not yet configured)
  const handleEnterDemoMode = async () => {
    resetMockEvent();
    setIsDemoMode(true);
    setUser({ id: 'demo-admin-id', email: 'admin@cybersentinels.internal' });
    const { data: event } = await fetchEventRecord();
    if (event) {
      setEventData(event);
    }
  };

  // Sign out handler
  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    resetMockEvent();
    setUser(null);
    setIsDemoMode(false);
    setEventData(null);
  };

  // Loading screen in sleek titanium aesthetic
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center text-[#F0F1F2]">
        <div className="relative w-14 h-14 flex items-center justify-center mb-4">
          <Loader2 className="w-8 h-8 text-[#10B981] animate-spin" />
        </div>
        <p className="font-mono text-xs tracking-widest text-[#777B82] uppercase">
          INITIALIZING CYBERHACK 2026...
        </p>
      </div>
    );
  }

  // If user is not authenticated, display login screen
  if (!user || (!eventData && !isDemoMode)) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        onEnterDemoMode={handleEnterDemoMode}
      />
    );
  }

  // Authenticated administrator view: Main Countdown Screen
  return (
    <MainCountdownScreen
      initialEvent={
        eventData || {
          id: 'a0000000-0000-0000-0000-000000000001',
          name: 'CYBERHACK 2026',
          status: 'idle',
          started_at: null,
          ends_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          launch_id: null,
          updated_at: new Date().toISOString(),
        }
      }
      adminEmail={user.email}
      onSignOut={handleSignOut}
      isDemoMode={isDemoMode}
    />
  );
}
