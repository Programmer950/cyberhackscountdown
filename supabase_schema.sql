-- ==============================================================================
-- CYBERHACK 2026 — PostgreSQL Database Schema & Security Architecture
-- Conducted by: Department of Cyber Security & CyberSentinels
-- ==============================================================================

-- 1. EXTENSIONS (gen_random_uuid is native in PostgreSQL 13+)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CREATE EVENTS TABLE
-- Enforces a strict singleton pattern so only one event record can ever exist.
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'CYBERHACK 2026',
    status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'running', 'finished')),
    started_at TIMESTAMPTZ DEFAULT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    launch_id UUID DEFAULT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    -- Singleton constraint: Ensures CYBERHACK 2026 is strictly the sole row
    singleton_lock BOOLEAN NOT NULL DEFAULT true UNIQUE CHECK (singleton_lock = true)
);

-- Comment on table & columns
COMMENT ON TABLE public.events IS 'Single source of truth for the CYBERHACK 2026 countdown state';
COMMENT ON COLUMN public.events.ends_at IS 'The configured immutable UTC end timestamp for the hackathon';

-- 3. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Allow authenticated users to view the countdown event" ON public.events;
DROP POLICY IF EXISTS "Deny direct public modifications" ON public.events;

-- POLICY 1: Authenticated users can view the countdown event
CREATE POLICY "Allow authenticated users to view the countdown event"
    ON public.events
    FOR SELECT
    TO authenticated
    USING (true);

-- POLICY 2: Deny all direct client-side INSERT / UPDATE / DELETE.
-- All state mutations MUST happen through authorized SECURITY DEFINER functions.
-- (Supabase default denies writes when no policy grants them).

-- 4. ATOMIC INITIATION FUNCTION
-- Verifies the administrator's identity, confirms event is idle and not expired,
-- and atomically transitions status to 'running' with a unique launch_id.
CREATE OR REPLACE FUNCTION public.initiate_hackathon()
RETURNS public.events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_event public.events;
    v_admin_id UUID;
BEGIN
    -- Get caller ID from Supabase Auth JWT
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: User is not authenticated.' USING ERRCODE = '42501';
    END IF;

    -- Retrieve configured admin ID from app setting or table
    -- (If configured via Supabase custom settings: current_setting('app.settings.admin_user_id', true))
    -- Or you can hardcode/verify the admin UUID here:
    BEGIN
        v_admin_id := current_setting('app.settings.admin_user_id', true)::UUID;
    EXCEPTION WHEN OTHERS THEN
        v_admin_id := NULL;
    END;

    -- If an admin ID is set in Postgres settings, enforce strict equality
    IF v_admin_id IS NOT NULL AND v_user_id <> v_admin_id THEN
        RAISE EXCEPTION 'Forbidden: User % is not the authorized Event Administrator.', v_user_id USING ERRCODE = '42501';
    END IF;

    -- Atomically lock and update the idle event
    UPDATE public.events
    SET 
        status = 'running',
        started_at = timezone('utc'::text, now()),
        launch_id = gen_random_uuid(),
        updated_at = timezone('utc'::text, now())
    WHERE 
        status = 'idle'
        AND ends_at > timezone('utc'::text, now())
    RETURNING * INTO v_event;

    -- Handle validation failures
    IF NOT FOUND THEN
        -- Check why it didn't update
        SELECT * INTO v_event FROM public.events LIMIT 1;
        IF v_event.status <> 'idle' THEN
            RAISE EXCEPTION 'Initiation rejected: Event is already in state "%"', v_event.status;
        ELSIF v_event.ends_at <= timezone('utc'::text, now()) THEN
            RAISE EXCEPTION 'Initiation rejected: Configured end timestamp has already elapsed.';
        ELSE
            RAISE EXCEPTION 'Initiation failed: No matching event record found.';
        END IF;
    END IF;

    RETURN v_event;
END;
$$;

-- 5. ATOMIC COMPLETION FUNCTION
-- Safely transitions status from running to finished once the end time has passed.
CREATE OR REPLACE FUNCTION public.check_and_finish_hackathon()
RETURNS public.events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_event public.events;
BEGIN
    UPDATE public.events
    SET 
        status = 'finished',
        updated_at = timezone('utc'::text, now())
    WHERE 
        status = 'running'
        AND ends_at <= timezone('utc'::text, now())
    RETURNING * INTO v_event;

    IF NOT FOUND THEN
        SELECT * INTO v_event FROM public.events LIMIT 1;
    END IF;

    RETURN v_event;
END;
$$;

-- Grant execution permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.initiate_hackathon() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_finish_hackathon() TO authenticated;

-- 6. ENABLE SUPABASE REALTIME REPLICATION (Idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'events'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
    END IF;
END $$;

-- ==============================================================================
-- 7. INITIAL RECORD INSERTION (CONFIGURABLE FIXED END TIMESTAMP)
-- ==============================================================================
-- 3:00 PM local time (IST +05:30)
INSERT INTO public.events (
    name,
    status,
    started_at,
    ends_at,
    launch_id,
    updated_at
)
VALUES (
    'CYBERHACK 2026',
    'idle',
    NULL,
    '2026-10-14 15:00:00+05:30'::TIMESTAMPTZ,
    NULL,
    timezone('utc'::text, now())
)
ON CONFLICT (singleton_lock) DO UPDATE
SET ends_at = '2026-10-14 15:00:00+05:30'::TIMESTAMPTZ;

-- Run this to update existing row if already created:
UPDATE public.events 
SET ends_at = '2026-10-14 15:00:00+05:30'::TIMESTAMPTZ;

-- ==============================================================================
-- 8. QUERY TO RESET HACKATHON TO IDLE (FOR TESTING / RE-LAUNCH)
-- ==============================================================================
-- Run this in Supabase SQL Editor anytime to reset the event back to 'idle':
UPDATE public.events 
SET 
    status = 'idle',
    started_at = NULL,
    launch_id = NULL,
    ends_at = '2026-10-14 15:00:00+05:30'::TIMESTAMPTZ,
    updated_at = timezone('utc'::text, now());
