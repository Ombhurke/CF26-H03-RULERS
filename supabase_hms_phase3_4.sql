-- ============================================================================
-- MyHealthChain Enterprise HMS - Phase 3 & Phase 4 Database Schema
-- Modules: LIS Specimen Tracking & Delta Checks, PACS DICOM Studies,
--          Charge Master, Inpatient Billing Ledger, Insurance TPA, and Cashier POS
-- ============================================================================

-- 1. Laboratory Information System (LIS)
CREATE TABLE IF NOT EXISTS public.lis_specimens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cpoe_order_id uuid REFERENCES public.cpoe_orders(id) ON DELETE SET NULL,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  uhid text NOT NULL,
  patient_name text NOT NULL,
  test_name text NOT NULL,
  specimen_type text NOT NULL DEFAULT 'Whole Blood' CHECK (specimen_type IN ('Whole Blood', 'Serum', 'Plasma', 'Urine', 'Sputum', 'CSF', 'Biopsy')),
  barcode text UNIQUE NOT NULL,
  collection_status text NOT NULL DEFAULT 'ordered' CHECK (collection_status IN ('ordered', 'collected', 'in_analyzer', 'reviewed', 'released')),
  collected_by text,
  collected_at timestamptz,
  results_json jsonb DEFAULT '{}'::jsonb,
  delta_check_flag text NOT NULL DEFAULT 'NORMAL' CHECK (delta_check_flag IN ('NORMAL', 'DELTA_WARNING', 'CRITICAL_PANIC')),
  delta_details text,
  pathologist_name text,
  pathologist_signature text,
  released_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Radiology Information System (RIS) & PACS Studies
CREATE TABLE IF NOT EXISTS public.pacs_studies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cpoe_order_id uuid REFERENCES public.cpoe_orders(id) ON DELETE SET NULL,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  uhid text NOT NULL,
  patient_name text NOT NULL,
  modality text NOT NULL CHECK (modality IN ('CR', 'DX', 'CT', 'MR', 'US', 'DERM')),
  study_description text NOT NULL,
  image_url text,
  dicom_url text,
  ipfs_cid text,
  window_preset text DEFAULT 'LUNG' CHECK (window_preset IN ('LUNG', 'BONE', 'SOFT_TISSUE', 'BRAIN', 'MEDIASTINUM')),
  radiologist_impression text,
  radiologist_name text,
  status text NOT NULL DEFAULT 'acquired' CHECK (status IN ('scheduled', 'acquired', 'reported', 'verified')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Central Hospital Charge Master
CREATE TABLE IF NOT EXISTS public.charge_master (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_code text UNIQUE NOT NULL,
  service_category text NOT NULL CHECK (service_category IN ('BED_RENT', 'CONSULTATION', 'LAB', 'RADIOLOGY', 'SURGERY', 'PHARMACY', 'NURSING')),
  service_name text NOT NULL,
  standard_price numeric NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed Standard Hospital Charge Master Items
INSERT INTO public.charge_master (service_code, service_category, service_name, standard_price)
VALUES
  ('BED-ICU-01', 'BED_RENT', 'Intensive Care Unit (ICU) Daily Bed Tariff', 6500.00),
  ('BED-GEN-01', 'BED_RENT', 'General Inpatient Ward Daily Bed Tariff', 1500.00),
  ('BED-EMG-01', 'BED_RENT', 'Emergency Observation Daily Bed Tariff', 2500.00),
  ('DOC-OPD-01', 'CONSULTATION', 'Senior Consultant OPD Specialist Fee', 800.00),
  ('DOC-IPD-01', 'CONSULTATION', 'Daily Inpatient Attending Rounds Fee', 1000.00),
  ('LAB-CBC-01', 'LAB', 'Complete Blood Count (CBC) with Differential', 450.00),
  ('LAB-CMP-01', 'LAB', 'Comprehensive Metabolic Panel (CMP)', 850.00),
  ('LAB-ABG-01', 'LAB', 'Arterial Blood Gas (ABG) Analysis', 600.00),
  ('LAB-INR-01', 'LAB', 'Prothrombin Time / INR Coagulation Panel', 400.00),
  ('RAD-CXR-01', 'RADIOLOGY', 'Digital Radiography (Chest X-Ray PA & Lateral)', 750.00),
  ('RAD-CT-01', 'RADIOLOGY', 'High-Resolution CT Chest (HRCT)', 3800.00),
  ('NUR-CARE-01', 'NURSING', 'Daily Bedside Nursing Care & Vital Monitoring', 500.00)
ON CONFLICT (service_code) DO NOTHING;

-- 4. Inpatient Running Billing Ledger
CREATE TABLE IF NOT EXISTS public.patient_billing_ledgers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  uhid text NOT NULL,
  admission_id uuid REFERENCES public.ipd_admissions(id) ON DELETE SET NULL,
  entry_type text NOT NULL CHECK (entry_type IN ('BED', 'LAB', 'RADIOLOGY', 'PHARMACY', 'CONSULTATION', 'NURSING', 'SURGERY')),
  description text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  total_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'unbilled' CHECK (status IN ('unbilled', 'invoiced', 'settled')),
  posted_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Insurance & TPA Claims Processing
CREATE TABLE IF NOT EXISTS public.insurance_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  uhid text NOT NULL,
  patient_name text NOT NULL,
  admission_id uuid REFERENCES public.ipd_admissions(id) ON DELETE SET NULL,
  payer_name text NOT NULL,
  tpa_name text,
  policy_number text NOT NULL,
  preauth_amount numeric NOT NULL DEFAULT 0.0,
  claimed_amount numeric NOT NULL DEFAULT 0.0,
  approved_amount numeric NOT NULL DEFAULT 0.0,
  claim_status text NOT NULL DEFAULT 'preauth_submitted' CHECK (claim_status IN ('draft', 'preauth_submitted', 'preauth_approved', 'claim_submitted', 'settled', 'rejected', 'query_raised')),
  claim_bundle jsonb DEFAULT '{}'::jsonb,
  query_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Front-Desk Cashier POS & Deposits
CREATE TABLE IF NOT EXISTS public.cashier_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  uhid text NOT NULL,
  patient_name text NOT NULL,
  amount numeric NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('CASH', 'CARD', 'UPI', 'INSURANCE_SETTLEMENT', 'BANK_TRANSFER')),
  payment_type text NOT NULL CHECK (payment_type IN ('ADVANCE_DEPOSIT', 'FINAL_BILL_PAYMENT', 'OPD_FEE', 'LAB_FEE')),
  transaction_ref text,
  receipt_number text UNIQUE NOT NULL,
  cashier_name text NOT NULL DEFAULT 'Front-Desk Cashier',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.lis_specimens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacs_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charge_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_billing_ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashier_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all authenticated users on lis_specimens"
ON public.lis_specimens FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all authenticated users on pacs_studies"
ON public.pacs_studies FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all authenticated users on charge_master"
ON public.charge_master FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all authenticated users on patient_billing_ledgers"
ON public.patient_billing_ledgers FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all authenticated users on insurance_claims"
ON public.insurance_claims FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all authenticated users on cashier_payments"
ON public.cashier_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
