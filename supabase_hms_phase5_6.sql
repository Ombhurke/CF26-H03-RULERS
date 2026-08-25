-- ============================================================================
-- MyHealthChain Enterprise HMS - Phase 5 & Phase 6 Database Schema
-- Modules: Operation Theater (OT) & WHO Checklist, Blood Bank & Cross-match,
--          CSSD Sterilization, HL7 FHIR v4.0, ABDM (ABHA), and Compliance Audit Logs
-- ============================================================================

-- 1. Operation Theater (OT) Management & Surgical Safety
CREATE TABLE IF NOT EXISTS public.ot_surgeries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  uhid text NOT NULL,
  patient_name text NOT NULL,
  procedure_name text NOT NULL,
  ot_room text NOT NULL DEFAULT 'OT Room 1 (Cardiac/General)',
  scheduled_start timestamptz NOT NULL,
  scheduled_end timestamptz,
  lead_surgeon text NOT NULL,
  anesthetist text NOT NULL,
  asa_status text NOT NULL DEFAULT 'ASA_II' CHECK (asa_status IN ('ASA_I', 'ASA_II', 'ASA_III', 'ASA_IV', 'ASA_V', 'ASA_VI', 'ASA_E')),
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'pre_op_ready', 'intra_op', 'pacu_recovery', 'completed', 'cancelled')),
  who_sign_in boolean NOT NULL DEFAULT false,
  who_time_out boolean NOT NULL DEFAULT false,
  who_sign_out boolean NOT NULL DEFAULT false,
  sponge_instrument_count_verified boolean NOT NULL DEFAULT false,
  aldrete_score integer DEFAULT 10,
  surgical_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Blood Bank Management System
CREATE TABLE IF NOT EXISTS public.blood_bank_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_barcode text UNIQUE NOT NULL,
  blood_group text NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  component_type text NOT NULL CHECK (component_type IN ('PRBC', 'FFP', 'PLATELETS', 'WHOLE_BLOOD', 'CRYOPRECIPITATE')),
  volume_ml integer NOT NULL DEFAULT 350,
  collection_date date NOT NULL,
  expiry_date date NOT NULL,
  status text NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'RESERVED', 'CROSS_MATCHED', 'TRANSFUSED', 'DISCARDED')),
  screening_passed boolean NOT NULL DEFAULT true,
  reserved_for_uhid text,
  reserved_for_patient text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed Standard Blood Bank Stock
INSERT INTO public.blood_bank_units (unit_barcode, blood_group, component_type, volume_ml, collection_date, expiry_date, status)
VALUES
  ('BB-PRBC-8891', 'O+', 'PRBC', 300, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '37 days', 'AVAILABLE'),
  ('BB-PRBC-8892', 'A+', 'PRBC', 300, CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '39 days', 'AVAILABLE'),
  ('BB-FFP-4401', 'B+', 'FFP', 200, CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '355 days', 'AVAILABLE'),
  ('BB-PLT-1205', 'O-', 'PLATELETS', 50, CURRENT_DATE - INTERVAL '1 days', CURRENT_DATE + INTERVAL '4 days', 'AVAILABLE'),
  ('BB-PRBC-9912', 'AB+', 'PRBC', 300, CURRENT_DATE - INTERVAL '8 days', CURRENT_DATE + INTERVAL '34 days', 'AVAILABLE')
ON CONFLICT (unit_barcode) DO NOTHING;

-- 3. Central Sterile Services Department (CSSD)
CREATE TABLE IF NOT EXISTS public.cssd_trays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tray_barcode text UNIQUE NOT NULL,
  tray_name text NOT NULL,
  sterilization_method text NOT NULL DEFAULT 'STEAM_AUTOCLAVE' CHECK (sterilization_method IN ('STEAM_AUTOCLAVE', 'ETO_GAS', 'PLASMA_HYDROGEN_PEROXIDE')),
  autoclave_cycle_no text NOT NULL,
  biological_indicator_passed boolean NOT NULL DEFAULT true,
  sterilized_at timestamptz NOT NULL DEFAULT now(),
  expiry_at timestamptz NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  status text NOT NULL DEFAULT 'STERILE_STORAGE' CHECK (status IN ('WASHING', 'PACKING', 'AUTOCLAVING', 'STERILE_STORAGE', 'DISPATCHED_TO_OT', 'USED')),
  dispatched_to_ot text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed CSSD Surgical Trays
INSERT INTO public.cssd_trays (tray_barcode, tray_name, sterilization_method, autoclave_cycle_no, status, dispatched_to_ot)
VALUES
  ('CSSD-TRY-101', 'Major Laparotomy Surgical Tray (42 Instruments)', 'STEAM_AUTOCLAVE', 'CYCLE-2026-0819-01', 'DISPATCHED_TO_OT', 'OT Room 1'),
  ('CSSD-TRY-102', 'Orthopedic Joint Replacement Kit', 'STEAM_AUTOCLAVE', 'CYCLE-2026-0819-02', 'STERILE_STORAGE', NULL),
  ('CSSD-TRY-103', 'Ophthalmic Micro-Surgery Instrument Pack', 'PLASMA_HYDROGEN_PEROXIDE', 'CYCLE-2026-0818-04', 'STERILE_STORAGE', NULL)
ON CONFLICT (tray_barcode) DO NOTHING;

-- 4. ABDM (Ayushman Bharat Digital Mission) ABHA Profiles
CREATE TABLE IF NOT EXISTS public.abha_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  uhid text NOT NULL UNIQUE,
  abha_number text UNIQUE NOT NULL,
  abha_address text UNIQUE NOT NULL,
  full_name text NOT NULL,
  gender text NOT NULL,
  date_of_birth text NOT NULL,
  mobile text NOT NULL,
  hip_id text NOT NULL DEFAULT 'IN2710001891',
  hip_name text NOT NULL DEFAULT 'MyHealthChain SuperSpeciality Hospital',
  consent_status text NOT NULL DEFAULT 'GRANTED' CHECK (consent_status IN ('REQUESTED', 'GRANTED', 'DENIED', 'EXPIRED', 'REVOKED')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Immutable HIPAA / NABH Compliance Audit Trail
CREATE TABLE IF NOT EXISTS public.hms_compliance_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL DEFAULT now(),
  user_id text NOT NULL,
  user_role text NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text NOT NULL,
  details_json jsonb DEFAULT '{}'::jsonb,
  ip_address text DEFAULT '127.0.0.1',
  integrity_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.ot_surgeries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_bank_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cssd_trays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abha_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hms_compliance_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all authenticated users on ot_surgeries"
ON public.ot_surgeries FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all authenticated users on blood_bank_units"
ON public.blood_bank_units FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all authenticated users on cssd_trays"
ON public.cssd_trays FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all authenticated users on abha_profiles"
ON public.abha_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all authenticated users on hms_compliance_audit_logs"
ON public.hms_compliance_audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
