-- ============================================================================
-- MyHealthChain Enterprise HMS - Phase 1 & Phase 2 Database Schema
-- Modules: OPD Appointments, Fuzzy Patient Matching, ADT Bed Clearance, 
--          CPOE Orders, CDSS Alerts, and Bedside Nursing eMAR
-- ============================================================================

-- 1. OPD Appointments & Doctor Schedules
CREATE TABLE IF NOT EXISTS public.doctor_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
  start_time time NOT NULL,
  end_time time NOT NULL,
  slot_duration_minutes integer NOT NULL DEFAULT 15,
  max_patients integer NOT NULL DEFAULT 20,
  room_number text NOT NULL DEFAULT 'Room 101',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.opd_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uhid text NOT NULL,
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  patient_name text NOT NULL,
  patient_phone text,
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  doctor_name text NOT NULL,
  department text NOT NULL DEFAULT 'General Medicine',
  appointment_date date NOT NULL,
  slot_time time NOT NULL,
  token_number integer NOT NULL,
  status text NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'checked_in', 'in_consultation', 'completed', 'cancelled', 'no_show')),
  triage_priority text DEFAULT 'GREEN' CHECK (triage_priority IN ('RED', 'ORANGE', 'YELLOW', 'GREEN', 'BLUE')),
  chief_complaint text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Inpatient ADT Multi-Department Discharge Clearance
CREATE TABLE IF NOT EXISTS public.ipd_admissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uhid text NOT NULL,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  hospital_id uuid NOT NULL,
  bed_id uuid REFERENCES public.hospital_beds(id),
  ward_type text NOT NULL,
  bed_number text NOT NULL,
  daily_tariff numeric NOT NULL DEFAULT 1500.00,
  admitted_at timestamptz NOT NULL DEFAULT now(),
  attending_doctor_id uuid REFERENCES public.doctors(id),
  admission_diagnosis text,
  status text NOT NULL DEFAULT 'admitted' CHECK (status IN ('admitted', 'discharge_initiated', 'discharged', 'transferred')),
  
  -- 4-Point Digital Discharge Clearance Sign-offs
  pharmacy_cleared boolean NOT NULL DEFAULT false,
  pharmacy_cleared_by text,
  pharmacy_cleared_at timestamptz,
  
  lab_cleared boolean NOT NULL DEFAULT false,
  lab_cleared_by text,
  lab_cleared_at timestamptz,
  
  nursing_cleared boolean NOT NULL DEFAULT false,
  nursing_cleared_by text,
  nursing_cleared_at timestamptz,
  
  billing_cleared boolean NOT NULL DEFAULT false,
  billing_cleared_by text,
  billing_cleared_at timestamptz,
  
  discharged_at timestamptz,
  discharge_summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. CPOE (Computerized Physician Order Entry) & CDSS
CREATE TABLE IF NOT EXISTS public.clinical_encounters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uhid text NOT NULL,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES public.doctors(id),
  encounter_type text NOT NULL CHECK (encounter_type IN ('OPD', 'IPD', 'EMERGENCY')),
  chief_complaint text NOT NULL,
  hpi text,
  physical_examination text,
  icd10_code text,
  icd10_diagnosis text,
  clinical_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cpoe_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id uuid REFERENCES public.clinical_encounters(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES public.doctors(id),
  order_type text NOT NULL CHECK (order_type IN ('MEDICATION', 'LAB', 'RADIOLOGY', 'NURSING_CARE')),
  item_name text NOT NULL,
  item_code text,
  dosage text,
  frequency text,
  route text,
  duration_days integer,
  instructions text,
  urgency text NOT NULL DEFAULT 'ROUTINE' CHECK (urgency IN ('STAT', 'URGENT', 'ROUTINE')),
  status text NOT NULL DEFAULT 'ordered' CHECK (status IN ('ordered', 'verified', 'in_progress', 'completed', 'cancelled')),
  
  -- CDSS Drug Interaction & Allergy Flags
  cdss_alert_triggered boolean NOT NULL DEFAULT false,
  cdss_alert_severity text CHECK (cdss_alert_severity IN ('HIGH', 'MODERATE', 'LOW', 'NONE')),
  cdss_alert_details text,
  physician_override_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Bedside Nursing eMAR (5-Rights Verification)
CREATE TABLE IF NOT EXISTS public.emar_administrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cpoe_order_id uuid NOT NULL REFERENCES public.cpoe_orders(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  admission_id uuid REFERENCES public.ipd_admissions(id),
  nurse_id uuid NOT NULL,
  nurse_name text NOT NULL,
  medication_name text NOT NULL,
  dosage text NOT NULL,
  route text NOT NULL,
  scheduled_time timestamptz NOT NULL,
  administered_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL CHECK (status IN ('GIVEN', 'HELD', 'REFUSED', 'MISSED')),
  
  -- 5-Rights Barcode Cross-Verification Proof
  patient_barcode_verified boolean NOT NULL DEFAULT true,
  medication_barcode_verified boolean NOT NULL DEFAULT true,
  five_rights_confirmed boolean NOT NULL DEFAULT true,
  
  systolic_bp integer,
  diastolic_bp integer,
  pulse_bpm integer,
  respiratory_rate integer,
  spo2_percent integer,
  temperature_f numeric,
  
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opd_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipd_admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cpoe_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emar_administrations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to interact with HMS tables
CREATE POLICY "Allow all authenticated users to read and manage HMS records"
ON public.doctor_schedules FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to manage opd_appointments"
ON public.opd_appointments FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to manage ipd_admissions"
ON public.ipd_admissions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to manage clinical_encounters"
ON public.clinical_encounters FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to manage cpoe_orders"
ON public.cpoe_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to manage emar_administrations"
ON public.emar_administrations FOR ALL TO authenticated USING (true) WITH CHECK (true);
