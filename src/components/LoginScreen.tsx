import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase, isSupabaseConfigured, isUserAdmin } from '@/lib/supabase';
import { sound } from '@/lib/audio';
import { Shield, Lock, AlertCircle, ArrowRight, Loader2, Sparkles } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: { id: string; email?: string }) => void;
  onEnterDemoMode?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onEnterDemoMode,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please provide both administrator email and password.');
      return;
    }

    // If Supabase is not configured, inform the user or prompt demo mode
    if (!isSupabaseConfigured || !supabase) {
      setErrorMessage(
        'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to your .env file, or use Preview Mode below.'
      );
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setErrorMessage('Authentication failed. No user returned.');
        setLoading(false);
        return;
      }

      // Verify administrator UUID authorization
      if (!isUserAdmin(data.user.id)) {
        await supabase.auth.signOut();
        setErrorMessage('Access Denied: Account is not authorized as the Event Administrator.');
        setLoading(false);
        return;
      }

      onLoginSuccess({
        id: data.user.id,
        email: data.user.email,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected authentication error occurred.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-black text-[#F0F1F2] overflow-hidden select-none">
      {/* Background radial ambient depth */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-[#111317]/80 blur-[140px] pointer-events-none -top-40 -left-40" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-[#10B981]/5 blur-[160px] pointer-events-none -bottom-20 -right-20" />
      <div className="absolute inset-0 precision-grid opacity-25 pointer-events-none" />

      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[420px] z-10"
      >
        {/* Machined outer frame */}
        <div className="relative rounded-2xl bg-[#0A0A0C] border border-[#222428] p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.85)]">
          {/* Subtle top chrome specular line */}
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#F0F1F2]/30 to-transparent" />

          {/* Header Branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#111317] border border-[#222428] mb-4 shadow-inner">
              <Shield className="w-5 h-5 text-[#F0F1F2]" strokeWidth={1.75} />
            </div>

            <div className="text-[10px] font-mono tracking-[0.28em] text-[#777B82] uppercase mb-1">
              DEPARTMENT OF CYBER SECURITY & CYBERSENTINELS
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#F0F1F2]">
              CYBERHACK 2026
            </h1>

            <p className="mt-1 text-xs text-[#777B82] font-mono tracking-wider">
              ADMINISTRATOR GATEWAY
            </p>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-5 p-3 rounded-lg border border-red-900/50 bg-red-950/20 text-red-300 text-xs flex items-start space-x-2.5"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="admin-email"
                className="block text-[11px] font-mono tracking-wider text-[#777B82] uppercase mb-1.5"
              >
                ADMINISTRATOR EMAIL
              </label>
              <div className="relative">
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@cybersentinels.internal"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#111317] border border-[#222428] text-sm text-[#F0F1F2] placeholder-[#777B82]/40 focus:outline-none focus:border-[#777B82] transition-colors font-mono"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-[11px] font-mono tracking-wider text-[#777B82] uppercase mb-1.5"
              >
                ACCESS KEY / PASSWORD
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#111317] border border-[#222428] text-sm text-[#F0F1F2] placeholder-[#777B82]/40 focus:outline-none focus:border-[#777B82] transition-colors font-mono tracking-widest"
                />
                <Lock className="absolute right-3.5 top-3 w-4 h-4 text-[#777B82]/40 pointer-events-none" />
              </div>
            </div>

            {/* Single Sign-in Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 titanium-button rounded-lg py-3 px-4 flex items-center justify-center space-x-2 text-sm font-semibold text-[#F0F1F2] disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#10B981]" />
                  <span>AUTHENTICATING...</span>
                </>
              ) : (
                <>
                  <span className="font-mono tracking-wider uppercase text-xs">
                    AUTHENTICATE & ENTER
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#C7C9CC]" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Mode fallback banner if Supabase is pending setup */}
          {!isSupabaseConfigured && onEnterDemoMode && (
            <div className="mt-6 pt-5 border-t border-[#222428] text-center">
              <p className="text-[11px] text-[#777B82] mb-2 font-mono">
                SUPABASE NOT YET CONFIGURED
              </p>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onEnterDemoMode();
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md border border-[#10B981]/40 bg-[#10B981]/10 text-xs font-mono text-[#10B981] hover:bg-[#10B981]/20 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>LAUNCH PREVIEW ARENA</span>
              </button>
            </div>
          )}

          {/* Footer Security Watermark */}
          <div className="mt-8 pt-4 border-t border-[#222428]/60 text-center text-[10px] font-mono text-[#777B82]/50 tracking-wider">
            SECURE ACCESS LAYER • AUTHORIZED PERSONNEL ONLY
          </div>
        </div>
      </motion.div>
    </div>
  );
};
