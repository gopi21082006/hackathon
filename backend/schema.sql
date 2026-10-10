-- ====================================================================
-- Emotional Well-being Tracker: Supabase Database Migration
-- Zero Fake Defaults: All unrecorded data defaults to NULL
-- 5 Clean Tables: profiles, user_setup, check_ins, wellbeing_data, digital_wellbeing
-- Strict User Isolation: Row Level Security (RLS) on all tables
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. PROFILES TABLE
-- Stores authenticated user accounts linked directly to auth.users
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  provider VARCHAR(32) DEFAULT 'email',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 2. USER SETUP TABLE
-- Stores lifestyle onboarding answers (defaults to NULL until answered)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_setup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student VARCHAR(32) DEFAULT NULL,   -- 'Yes' | 'No' | 'Pursuing'
  gym VARCHAR(32) DEFAULT NULL,       -- 'Regularly' | 'Occasionally' | 'No'
  sports VARCHAR(32) DEFAULT NULL,    -- 'Active' | 'Weekends' | 'Rarely'
  work VARCHAR(32) DEFAULT NULL,      -- 'Full-time' | 'Remote' | 'Freelance' | 'None'
  hobbies JSONB DEFAULT '[]'::jsonb,  -- Array of selected hobbies e.g. ["Music", "Reading"]
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_setup_user UNIQUE (user_id)
);

-- --------------------------------------------------------------------
-- 3. CHECK-INS TABLE
-- Stores every notification response and micro-checkin with real data
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id VARCHAR(64) NOT NULL,                 -- e.g. 'q_mood', 'q_sleep', 'q_diet'
  question TEXT NOT NULL,                           -- e.g. 'How is your mood right now?'
  category VARCHAR(32) NOT NULL,                    -- 'mood', 'sleep', 'diet', 'screentime', 'hobby', 'productivity', 'study'
  answer TEXT NOT NULL,                             -- Selected answer text (e.g. 'Good', 'Yes', 'Low')
  numeric_value NUMERIC(5, 2) DEFAULT NULL,         -- Score/Value representation (e.g. 90, 60, 30)
  emoji VARCHAR(16) DEFAULT NULL,                   -- Emoji representation (e.g. '😊', '😴')
  response_time_seconds NUMERIC(4, 2) DEFAULT NULL, -- 2-3s response duration
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 4. WELLBEING DATA TABLE
-- Daily aggregated parameter state. ALL metrics default strictly to NULL.
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wellbeing_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- 7 Core Parameters (NULL until actual user answers are logged)
  mood TEXT DEFAULT NULL,
  mood_score NUMERIC(5, 2) DEFAULT NULL,

  sleep TEXT DEFAULT NULL,
  sleep_score NUMERIC(5, 2) DEFAULT NULL,

  diet TEXT DEFAULT NULL,
  diet_score NUMERIC(5, 2) DEFAULT NULL,

  screen_time TEXT DEFAULT NULL,
  screentime_score NUMERIC(5, 2) DEFAULT NULL,

  hobby TEXT DEFAULT NULL,
  hobby_score NUMERIC(5, 2) DEFAULT NULL,

  productivity TEXT DEFAULT NULL,
  productivity_score NUMERIC(5, 2) DEFAULT NULL,

  study TEXT DEFAULT NULL,
  study_score NUMERIC(5, 2) DEFAULT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_wellbeing_date UNIQUE (user_id, date)
);

-- --------------------------------------------------------------------
-- 5. DIGITAL WELL-BEING TABLE
-- Telemetry architecture ready for future device usage (defaults to NULL)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.digital_wellbeing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_screen_time_minutes INTEGER DEFAULT NULL,
  pickups_count INTEGER DEFAULT NULL,
  late_night_screen_minutes INTEGER DEFAULT NULL,
  permission_granted BOOLEAN DEFAULT FALSE,
  app_usage JSONB DEFAULT NULL,
  categories JSONB DEFAULT NULL,
  longest_session_minutes INTEGER DEFAULT NULL,
  synced_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_digital_wellbeing_date UNIQUE (user_id, date)
);

-- --------------------------------------------------------------------
-- 6. PERFORMANCE INDEXES
-- --------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_user ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_user_setup_user ON public.user_setup(user_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_user_date ON public.check_ins(user_id, date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wellbeing_user_date ON public.wellbeing_data(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_digital_wellbeing_user_date ON public.digital_wellbeing(user_id, date DESC);

-- --------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS)
-- Every user is isolated strictly to their own data via auth.uid()
-- --------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_setup ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellbeing_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_wellbeing ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- User Setup Policies
DROP POLICY IF EXISTS "user_setup_select_own" ON public.user_setup;
CREATE POLICY "user_setup_select_own" ON public.user_setup FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_setup_insert_own" ON public.user_setup;
CREATE POLICY "user_setup_insert_own" ON public.user_setup FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_setup_update_own" ON public.user_setup;
CREATE POLICY "user_setup_update_own" ON public.user_setup FOR UPDATE USING (auth.uid() = user_id);

-- Check-ins Policies
DROP POLICY IF EXISTS "check_ins_select_own" ON public.check_ins;
CREATE POLICY "check_ins_select_own" ON public.check_ins FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "check_ins_insert_own" ON public.check_ins;
CREATE POLICY "check_ins_insert_own" ON public.check_ins FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "check_ins_update_own" ON public.check_ins;
CREATE POLICY "check_ins_update_own" ON public.check_ins FOR UPDATE USING (auth.uid() = user_id);

-- Wellbeing Data Policies
DROP POLICY IF EXISTS "wellbeing_select_own" ON public.wellbeing_data;
CREATE POLICY "wellbeing_select_own" ON public.wellbeing_data FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "wellbeing_insert_own" ON public.wellbeing_data;
CREATE POLICY "wellbeing_insert_own" ON public.wellbeing_data FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "wellbeing_update_own" ON public.wellbeing_data;
CREATE POLICY "wellbeing_update_own" ON public.wellbeing_data FOR UPDATE USING (auth.uid() = user_id);

-- Digital Well-being Policies
DROP POLICY IF EXISTS "digital_wb_select_own" ON public.digital_wellbeing;
CREATE POLICY "digital_wb_select_own" ON public.digital_wellbeing FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "digital_wb_insert_own" ON public.digital_wellbeing;
CREATE POLICY "digital_wb_insert_own" ON public.digital_wellbeing FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "digital_wb_update_own" ON public.digital_wellbeing;
CREATE POLICY "digital_wb_update_own" ON public.digital_wellbeing FOR UPDATE USING (auth.uid() = user_id);

-- --------------------------------------------------------------------
-- 8. AUTOMATIC PROFILE CREATION TRIGGER
-- Provisions a user profile upon Google, Facebook, or Email login
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, provider)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_app_meta_data->>'provider', 'email')
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      name = COALESCE(EXCLUDED.name, public.profiles.name),
      updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
