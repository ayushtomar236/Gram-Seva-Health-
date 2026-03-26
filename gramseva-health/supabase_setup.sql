-- =============================================
-- GRAMSEVA HEALTH — CLEAN DATABASE SETUP v3
-- FEATURES: Profiles, Patients, Doctors, Consultations, Prescriptions
-- Copy-paste this ENTIRE SQL into Supabase SQL Editor and click "Run"
-- =============================================

-- ── STEP 1: DROP OLD TABLES (order matters due to foreign keys) ─────────
DROP TABLE IF EXISTS public.prescriptions CASCADE;
DROP TABLE IF EXISTS public.consultations CASCADE;
DROP TABLE IF EXISTS public.patients CASCADE;
DROP TABLE IF EXISTS public.doctors CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ── STEP 2: CREATE PROFILES TABLE ──────────────────────────────────────
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role TEXT CHECK (role IN ('patient', 'doctor', 'admin')) DEFAULT 'patient',
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── STEP 3: CREATE PATIENTS TABLE ──────────────────────────────────────
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT,
  phone TEXT,
  age INTEGER,
  gender TEXT,
  village TEXT,
  blood_group TEXT,
  emergency_contact TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── STEP 4: CREATE DOCTORS TABLE ───────────────────────────────────────
CREATE TABLE public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT,
  specialization TEXT DEFAULT 'General Physician',
  hospital_name TEXT,
  experience_years INTEGER DEFAULT 0,
  rating DECIMAL DEFAULT 4.5,
  total_consultations INTEGER DEFAULT 0,
  is_online BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT true,
  languages TEXT DEFAULT 'Hindi, English',
  fee TEXT DEFAULT '₹0 (Free)',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── STEP 5: CREATE CONSULTATIONS TABLE ─────────────────────────────────
CREATE TABLE public.consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
  channel_name TEXT NOT NULL,
  symptoms TEXT,
  urgency TEXT DEFAULT 'low',
  ai_suggestion TEXT,
  status TEXT CHECK (status IN ('pending', 'active', 'completed', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  end_time TIMESTAMPTZ
);

-- ── STEP 6: CREATE PRESCRIPTIONS TABLE ─────────────────────────────────
CREATE TABLE public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES public.consultations(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  diagnosis TEXT,
  medicines JSONB DEFAULT '[]',
  instructions TEXT,
  follow_up TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── STEP 7: ENABLE REALTIME ────────────────────────────────────────────
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.consultations;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.doctors;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- ── STEP 8: ROW LEVEL SECURITY ────────────────────────────────────────

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Patients
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "patients_select" ON public.patients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "patients_insert" ON public.patients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "patients_update" ON public.patients FOR UPDATE USING (auth.uid() = user_id);

-- Doctors (anyone can VIEW doctors list, only owner can modify)
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doctors_select_all" ON public.doctors FOR SELECT USING (true);
CREATE POLICY "doctors_insert" ON public.doctors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "doctors_update" ON public.doctors FOR UPDATE USING (auth.uid() = user_id);

-- Consultations (any authenticated user can create & view their consultations)
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consultations_select" ON public.consultations FOR SELECT USING (
  patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
  OR doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
);

CREATE POLICY "consultations_insert" ON public.consultations FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "consultations_update" ON public.consultations FOR UPDATE USING (
  patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
  OR doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
);

-- Prescriptions (doctor can create, both can view)
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prescriptions_select" ON public.prescriptions FOR SELECT USING (
  patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
  OR doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
);

CREATE POLICY "prescriptions_insert" ON public.prescriptions FOR INSERT 
  WITH CHECK (
    doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
  );

CREATE POLICY "prescriptions_update" ON public.prescriptions FOR UPDATE USING (
  doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
);

-- ── STEP 9: AUTO-CREATE PROFILE ON SIGNUP ──────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
  user_name TEXT;
  user_spec TEXT;
BEGIN
  user_role := COALESCE(new.raw_user_meta_data->>'role', 'patient');
  user_name := COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '');
  user_spec := COALESCE(new.raw_user_meta_data->>'specialization', 'General Physician');

  -- Insert into profiles
  INSERT INTO public.profiles (user_id, role, full_name)
  VALUES (new.id, user_role, user_name)
  ON CONFLICT (user_id) DO NOTHING;

  -- Insert into role-specific table
  IF user_role = 'doctor' THEN
    INSERT INTO public.doctors (user_id, name, specialization)
    VALUES (new.id, user_name, user_spec)
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    INSERT INTO public.patients (user_id, name)
    VALUES (new.id, user_name)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- DONE! Tables: profiles, patients, doctors, consultations, prescriptions
-- Run this in Supabase SQL Editor, then test!
-- =============================================
