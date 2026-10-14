import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  if (!supabaseUrl || !supabaseSecretKey) {
    return res.status(500).json({ error: 'Server Supabase credentials not configured.' });
  }

  const supabase = createClient(supabaseUrl, supabaseSecretKey);

  try {
    const nowIso = new Date().toISOString();

    // Conditionally transition from running to finished if ends_at <= now
    const { data, error } = await supabase
      .from('events')
      .update({
        status: 'finished',
        updated_at: nowIso,
      })
      .eq('status', 'running')
      .lte('ends_at', nowIso)
      .select('*')
      .single();

    if (error || !data) {
      const { data: currentEvent } = await supabase.from('events').select('*').limit(1).single();
      return res.status(200).json({
        message: 'No transition needed or already completed',
        event: currentEvent,
      });
    }

    return res.status(200).json({
      message: 'Hackathon successfully transitioned to finished',
      event: data,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return res.status(500).json({ error: message });
  }
}
