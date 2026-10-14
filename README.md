# CYBERHACK 2026 — Premium Countdown & Arena Platform

Conducted by the **Department of Cyber Security** and **CyberSentinels**.

A digital event countdown experience engineered with precision-machined chrome, black titanium, and industrial hardware aesthetics. Features real Supabase authentication, atomic PostgreSQL state transitions, Supabase Realtime synchronization, and Framer Motion animations.

---

## 1. Visual Direction & Architecture

- **Aesthetic**: Precision-machined chrome, black titanium, industrial hardware, and horology-grade dial graduation marks.
- **Color Palette**:
  - Pure Black (`#000000`)
  - Deep Black (`#0A0A0C`)
  - Elevated Dark Surface (`#111317`)
  - Subtle Borders (`#222428`)
  - Primary Silver (`#F0F1F2`)
  - Chrome Silver (`#C7C9CC`)
  - Muted Silver (`#777B82`)
  - Dark Titanium (`#1E2025`)
  - Emerald (`#10B981`)
  - Amber (`#F59E0B`, exclusively for the final 10 seconds)
- **Typography**:
  - **Clash Display** for event title and major headings.
  - **Space Mono** for countdown numerals, timestamps, and technical metrics.
  - **Plus Jakarta Sans** for supporting text, labels, and input fields.
- **Interactions**:
  - Protected administrator-only gateway.
  - Circular chrome progress ring with 120 precision graduation ticks and an active clockwise progress arc.
  - Cinematic 3.5-second machine power-on launch sequence with hardware diagnostic telemetry.
  - Real-time tick synthesizer via Web Audio API.
  - Final 10-second alert state with amber accents.
  - Dignified, restrained completion presentation (`HACKATHON INITIATED`, `THE ARENA IS NOW LIVE`).

---

## 2. Quick Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the local dev server**:
   ```bash
   npm run dev
   ```

3. Open `http://localhost:5173`.
   - If Supabase environment variables are not yet populated, you can click **LAUNCH PREVIEW ARENA** to test the complete UI, test the initiation sequence, and view the active countdown right out of the box.

---

## 3. Real Supabase Setup Guide

### Step 1: Create a Supabase Project
1. Log in to [supabase.com](https://supabase.com) and create a new project.
2. Under **Project Settings -> API**, copy:
   - **Project URL**
   - **anon / public key**
   - **service_role secret key** (keep private)

### Step 2: Run the SQL Setup Script
1. Go to the **SQL Editor** in your Supabase dashboard.
2. Open [`supabase_schema.sql`](./supabase_schema.sql) in this repository and paste its entire contents into the SQL Editor.
3. **Configure the exact UTC end timestamp**:
   In the final `INSERT` statement of `supabase_schema.sql`, replace the placeholder timestamp with your actual event end date:
   ```sql
   '2026-10-18 18:00:00+00'::TIMESTAMPTZ
   ```
4. Click **Run**. This will:
   - Create the singleton `events` table.
   - Enforce Row Level Security (RLS) so only authenticated users can read the countdown.
   - Install the atomic `initiate_hackathon()` and `check_and_finish_hackathon()` PostgreSQL functions.
   - Enable Supabase Realtime publication on the `events` table.
   - Seed the initial `CYBERHACK 2026` event record in `idle` state.

### Step 3: Create the Single Administrator Account
1. In your Supabase Dashboard, go to **Authentication -> Users**.
2. Click **Add User -> Create User**.
3. Enter your Administrator Email and Password (e.g. `admin@cybersentinels.internal`).
4. Once created, click on the user row and **Copy User UID** (e.g., `e4b3c2a1-0000-4000-8000-123456789abc`).
5. In **Authentication -> Providers -> Email**, make sure "Confirm email" is either turned off or you confirm the user manually.
6. Under **Authentication -> URL Configuration**, ensure user registration is closed/disabled for public signups.

### Step 4: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in the credentials:
```env
# Client-Safe Variables
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_public_key
VITE_ADMIN_USER_ID=your_admin_user_uuid_here

# Server-Only Variables (Used for Vercel Serverless Functions)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SECRET_KEY=your_supabase_service_role_secret_key
ADMIN_USER_ID=your_admin_user_uuid_here
```

---

## 4. Vercel Deployment Instructions

1. Push your repository to GitHub or GitLab.
2. Log in to [vercel.com](https://vercel.com) and click **Add New -> Project**.
3. Import the `cyberhacks-countdown` repository.
4. Framework Preset: Select **Vite**.
5. Add the following **Environment Variables** in the Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_ADMIN_USER_ID`
   - `SUPABASE_URL`
   - `SUPABASE_SECRET_KEY`
   - `ADMIN_USER_ID`
6. Click **Deploy**.
7. The included `vercel.json` automatically configures the SPA routing for the frontend and mounts the `/api/initiate` and `/api/finish` serverless routes.

---

## 5. Security Architecture Summary

- **Authentication**: Native Supabase Auth with persisted session cookies and bearer JWT verification.
- **Authorization**: Configured `ADMIN_USER_ID` verified on both client and PostgreSQL serverless/RPC functions. Non-admin users cannot access the countdown screen or mutate event state.
- **Atomic Operations**: Initiation is enforced via atomic database condition `status = 'idle' AND ends_at > now()`, preventing race conditions or duplicate initiations.
- **Credential Protection**: Server keys (`SUPABASE_SECRET_KEY`) are never exposed to the frontend; only `VITE_` prefixed public keys are bundled client-side.
