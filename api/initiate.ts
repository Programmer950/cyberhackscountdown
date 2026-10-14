import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || '';
const adminUserId = process.env.ADMIN_USER_ID || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  // 1. Extract Bearer token from headers
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header.' });
  }

  const token = authHeader.split(' ')[1];

  if (!supabaseUrl || !supabaseSecretKey) {
    return res.status(500).json({ error: 'Server Supabase credentials not configured.' });
  }

  const supabase = createClient(supabaseUrl, supabaseSecretKey);

  try {
    // 2. Verify Supabase Auth JWT
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return res.status(401).json({ error: 'Invalid or expired authentication session.' });
    }

    const callerId = userData.user.id;

    // 3. Verify caller matches configured administrator UUID
    if (adminUserId && callerId !== adminUserId) {
      return res.status(403).json({ error: 'Access Denied: Caller is not the authorized Event Administrator.' });
    }

    // 4. Atomically initiate the hackathon event
    const nowIso = new Date().toISOString();
    const newLaunchId = crypto.randomUUID();

    const { data, error } = await supabase
      .from('events')
      .update({
        status: 'running',
        started_at: nowIso,
        launch_id: newLaunchId,
        updated_at: nowIso,
      })
      .eq('status', 'idle')
      .gt('ends_at', nowIso)
      .select('*')
      .single();

    if (error || !data) {
      // Check current state to provide precise failure rationale
      const { data: currentEvent } = await supabase.from('events').select('*').limit(1).single();
      if (currentEvent?.status !== 'idle') {
        return res.status(409).json({ error: `Event is already in status '${currentEvent?.status}'. Duplicate initiation rejected.` });
      }
      if (currentEvent && new Date(currentEvent.ends_at) <= new Date()) {
        return res.status(400).json({ error: 'Event end timestamp has already elapsed.' });
      }
      return res.status(500).json({ error: error?.message || 'Initiation update failed.' });
    }

    return res.status(200).json({
      message: 'Hackathon successfully initiated',
      event: data,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return res.status(500).json({ error: message });
  }
}
