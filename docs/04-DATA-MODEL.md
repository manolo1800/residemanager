
---

## 🗂️ `docs/04-DATA-MODEL.md`

```markdown
---
id: 04-DATA-MODEL
title: Modelo de datos
version: 1.1
audience: human+agent
last_updated: 2026-10-12
---

# 04 — Modelo de Datos

> **Fuente de verdad del esquema.** Cualquier cambio aquí requiere actualizar `packages/database` y generar migración.

---

## 📏 Convenciones generales

- **PK:** `id uuid` (UUID v7 recomendado).
- **Timestamps:** `created_at`, `updated_at`, `deleted_at` (soft delete).
- **Auditoría:** `created_by`, `updated_by` (uuid de users).
- **Tenant:** toda tabla de dominio tiene `tenant_id uuid NOT NULL`.
- **Condominio:** tablas dependientes de un condominio tienen `condominium_id uuid NOT NULL`.
- **Soft delete:** nunca DELETE físico.
- **Índices:** compuestos `(tenant_id, condominium_id, ...)` cuando aplique.
- **Fechas:** `timestamptz` en UTC.
- **Dinero:** `numeric(14,2)` + `currency char(3)`.
- **Enums:** PostgreSQL native enums.
- **Nombres:** `snake_case` plural en tablas y columnas.

---

## 🧩 Dominio: Núcleo SaaS

### `tenants`
```sql
CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  status tenant_status NOT NULL DEFAULT 'active',
  plan text NOT NULL DEFAULT 'mvp',
  primary_locale locale NOT NULL DEFAULT 'es',
  primary_timezone text NOT NULL DEFAULT 'America/Caracas',
  date_format text NOT NULL DEFAULT 'DD/MM/YYYY',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TYPE tenant_status AS ENUM ('active','suspended','cancelled');
CREATE TYPE locale AS ENUM ('es','en','fr','pt');

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext NOT NULL UNIQUE,
  phone text,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  locale locale NOT NULL DEFAULT 'es',
  timezone text NOT NULL DEFAULT 'America/Caracas',
  is_super_admin boolean NOT NULL DEFAULT false,
  status user_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TYPE user_status AS ENUM ('active','inactive');

CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id),
  name text NOT NULL,
  code text NOT NULL,
  description text,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (tenant_id, code)
);

CREATE TABLE permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module text NOT NULL,
  action text NOT NULL,
  description text,
  UNIQUE (module, action)
);

CREATE TABLE role_permissions (
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_tenant_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  role_id uuid NOT NULL REFERENCES roles(id),
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE user_condominium_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  condominium_id uuid NOT NULL,
  role_id uuid NOT NULL REFERENCES roles(id),
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  active_condominium_id uuid,
  refresh_token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

## 🏢 Dominio: Condominios y estructura física

CREATE TYPE condo_type AS ENUM ('buildings','houses');
CREATE TYPE fee_mode AS ENUM ('fixed','variable');
CREATE TYPE mora_type AS ENUM ('fixed','percentage');

CREATE TABLE condominiums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  code text NOT NULL,
  name text NOT NULL,
  type condo_type NOT NULL,
  address text NOT NULL,
  country char(2) NOT NULL,
  timezone text NOT NULL,
  date_format text NOT NULL DEFAULT 'DD/MM/YYYY',
  base_currency char(3) NOT NULL,
  foreign_currency char(3),
  foreign_currency_enabled boolean NOT NULL DEFAULT false,
  tax_exempt boolean NOT NULL DEFAULT false,
  tax_rate numeric(5,2),
  tax_included_in_fee boolean NOT NULL DEFAULT true,
  ordinary_fee_mode fee_mode NOT NULL DEFAULT 'fixed',
  extraordinary_requires_meeting boolean NOT NULL DEFAULT true,
  mora_type mora_type NOT NULL DEFAULT 'percentage',
  mora_value numeric(12,2) NOT NULL DEFAULT 0,
  partial_payments_enabled boolean NOT NULL DEFAULT false,
  partial_payment_interest_enabled boolean NOT NULL DEFAULT false,
  primary_color text,
  sidebar_color text,
  logo_url text,
  favicon_url text,
  terms_own_enabled boolean NOT NULL DEFAULT false,
  terms_own_content text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  created_by uuid, updated_by uuid,
  UNIQUE (tenant_id, code)
);

CREATE TYPE structure_kind AS ENUM ('building','block','stage');

CREATE TABLE condo_structures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  condominium_id uuid NOT NULL REFERENCES condominiums(id),
  name text NOT NULL,
  kind structure_kind NOT NULL,
  floors int,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TYPE unit_type AS ENUM ('apartment','house');

CREATE TABLE units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  condominium_id uuid NOT NULL REFERENCES condominiums(id),
  structure_id uuid REFERENCES condo_structures(id),
  code text NOT NULL,
  floor int,
  type unit_type NOT NULL,
  area_m2 numeric(10,2),
  aliquot_pct numeric(6,3),
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (condominium_id, code)
);

CREATE TYPE common_area_type AS ENUM ('park','pool','party_room','gym','other');

CREATE TABLE common_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  condominium_id uuid NOT NULL REFERENCES condominiums(id),
  name text NOT NULL,
  type common_area_type NOT NULL,
  capacity int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TYPE parking_type AS ENUM ('resident','visitor');

CREATE TABLE parking_spots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  condominium_id uuid NOT NULL REFERENCES condominiums(id),
  code text NOT NULL,
  type parking_type NOT NULL,
  assigned_unit_id uuid REFERENCES units(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

## 👥 Dominio: Residentes y propiedades
persons
sql
CREATE TABLE persons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  document_type text NOT NULL,
  document_number text NOT NULL,
  full_name text NOT NULL,
  email citext,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (tenant_id, document_type, document_number)
);
unit_ownerships
sql
CREATE TYPE ownership_status AS ENUM ('active','transferred','inactive');

CREATE TABLE unit_ownerships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  condominium_id uuid NOT NULL REFERENCES condominiums(id),
  unit_id uuid NOT NULL REFERENCES units(id),
  person_id uuid NOT NULL REFERENCES persons(id),
  start_date date NOT NULL,
  end_date date,
  status ownership_status NOT NULL DEFAULT 'active',
  is_primary_residence boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
ownership_transfers
sql
CREATE TABLE ownership_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  condominium_id uuid NOT NULL REFERENCES condominiums(id),
  unit_id uuid NOT NULL REFERENCES units(id),
  from_person_id uuid NOT NULL REFERENCES persons(id),
  to_person_id uuid NOT NULL REFERENCES persons(id),
  contract_file_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
resident_link_requests
sql
CREATE TABLE resident_link_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  user_id uuid NOT NULL REFERENCES users(id),
  condominium_id uuid NOT NULL REFERENCES condominiums(id),
  unit_code text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  requested_at timestamptz NOT NULL DEFAULT now(),
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
resident_profiles
sql
CREATE TABLE resident_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  person_id uuid NOT NULL REFERENCES persons(id),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (user_id, person_id)
);

## 👷 Dominio: Personal, contratos, nómina, asistencia
staff
sql
CREATE TYPE contract_type AS ENUM ('company','cooperative','individual');
CREATE TYPE pay_frequency AS ENUM ('weekly','biweekly','monthly');
CREATE TYPE staff_status AS ENUM ('active','inactive','terminated');

CREATE TABLE staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  condominium_id uuid NOT NULL REFERENCES condominiums(id),
  person_id uuid NOT NULL REFERENCES persons(id),
  position text NOT NULL,
  contract_type contract_type NOT NULL,
  hire_date date NOT NULL,
  salary numeric(14,2) NOT NULL,
  salary_currency char(3) NOT NULL,
  pay_frequency pay_frequency NOT NULL,
  bank_name text,
  bank_account text,
  status staff_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  created_by uuid, updated_by uuid
);
contract_templates y staff_contracts
sql
CREATE TABLE contract_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name text NOT NULL,
  contract_type contract_type NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE staff_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  staff_id uuid NOT NULL REFERENCES staff(id),
  template_id uuid REFERENCES contract_templates(id),
  generated_pdf_url text NOT NULL,
  signed_at timestamptz,
  valid_from date NOT NULL,
  valid_to date,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
staff_attendance
sql
CREATE TYPE attendance_status AS ENUM ('present','absent','late','justified');

CREATE TABLE staff_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  staff_id uuid NOT NULL REFERENCES staff(id),
  date date NOT NULL,
  check_in timestamptz,
  check_out timestamptz,
  status attendance_status NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (staff_id, date)
);
payroll_periods, payroll_items, staff_advances
sql
CREATE TYPE payroll_status AS ENUM ('draft','closed','paid');

CREATE TABLE payroll_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  condominium_id uuid NOT NULL REFERENCES condominiums(id),
  start_date date NOT NULL,
  end_date date NOT NULL,
  status payroll_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE payroll_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  payroll_period_id uuid NOT NULL REFERENCES payroll_periods(id),
  staff_id uuid NOT NULL REFERENCES staff(id),
  base_salary numeric(14,2) NOT NULL,
  deductions numeric(14,2) NOT NULL DEFAULT 0,
  advances_discount numeric(14,2) NOT NULL DEFAULT 0,
  net_amount numeric(14,2) NOT NULL,
  currency char(3) NOT NULL,
  receipt_pdf_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE staff_advances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  staff_id uuid NOT NULL REFERENCES staff(id),
  amount numeric(14,2) NOT NULL,
  currency char(3) NOT NULL,
  reason text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  approved_by uuid,
  installments int NOT NULL DEFAULT 1,
  remaining numeric(14,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

## 💰 Dominio: Cobranza
fee_plans
sql
CREATE TYPE fee_type AS ENUM ('ordinary','extraordinary');
CREATE TYPE fee_scope AS ENUM ('all','structure','unit');

CREATE TABLE fee_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  condominium_id uuid NOT NULL REFERENCES condominiums(id),
  name text NOT NULL,
  type fee_type NOT NULL,
  mode fee_mode NOT NULL DEFAULT 'fixed',
  amount numeric(14,2) NOT NULL,
  currency char(3) NOT NULL,
  applies_to fee_scope NOT NULL DEFAULT 'all',
  structure_id uuid REFERENCES condo_structures(id),
  unit_id uuid REFERENCES units(id),
  tax_applies boolean NOT NULL DEFAULT true,
  start_date date NOT NULL,
  end_date date,
  requires_meeting boolean NOT NULL DEFAULT false,
  minute_id uuid,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  created_by uuid, updated_by uuid
);
unit_charges
sql
CREATE TYPE charge_status AS ENUM ('pending','partially_paid','paid','overdue','cancelled');

CREATE TABLE unit_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  condominium_id uuid NOT NULL REFERENCES condominiums(id),
  unit_id uuid NOT NULL REFERENCES units(id),
  fee_plan_id uuid NOT NULL REFERENCES fee_plans(id),
  period char(7) NOT NULL,
  amount_base numeric(14,2) NOT NULL,
  tax_amount numeric(14,2) NOT NULL DEFAULT 0,
  mora_amount numeric(14,2) NOT NULL DEFAULT 0,
  total_amount numeric(14,2) NOT NULL,
  currency char(3) NOT NULL,
  status charge_status NOT NULL DEFAULT 'pending',
  due_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (unit_id, fee_plan_id, period)
);
mora_rules y currency_rates
sql
CREATE TABLE mora_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  condominium_id uuid NOT NULL REFERENCES condominiums(id),
  type mora_type NOT NULL,
  value numeric(12,2) NOT NULL,
  applies_after_days int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE currency_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  condominium_id uuid NOT NULL REFERENCES condominiums(id),
  from_currency char(3) NOT NULL,
  to_currency char(3) NOT NULL,
  rate numeric(18,6) NOT NULL,
  source text,
  effective_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

## 💳 Dominio: Pagos
payment_methods
sql
CREATE TYPE payment_method_type AS ENUM ('transfer','mobile_payment','cash','check','other');

CREATE TABLE payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  condominium_id uuid NOT NULL REFERENCES condominiums(id),
  name text NOT NULL,
  type payment_method_type NOT NULL,
  details jsonb,
  requires_reference boolean NOT NULL DEFAULT true,
  requires_phone boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
payments (con estado approved_pending_data y origen)
sql
CREATE TYPE payment_status AS ENUM (
  'pending','in_review','approved','approved_pending_data','rejected','cancelled'
);
CREATE TYPE payment_origin AS ENUM ('resident','admin');

CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  condominium_id uuid NOT NULL REFERENCES condominiums(id),
  unit_id uuid NOT NULL REFERENCES units(id),
  resident_user_id uuid REFERENCES users(id),
  origin payment_origin NOT NULL DEFAULT 'resident',
  registered_by_user_id uuid NOT NULL REFERENCES users(id),
  amount numeric(14,2) NOT NULL,
  currency char(3) NOT NULL,
  exchange_rate numeric(18,6),
  amount_base_currency numeric(14,2),
  method_id uuid REFERENCES payment_methods(id),
  reference_number text,
  payment_date date NOT NULL,
  phone_from text,
  status payment_status NOT NULL DEFAULT 'pending',
  has_receipt boolean NOT NULL DEFAULT false,
  has_reference boolean NOT NULL DEFAULT false,
  pending_data_reason text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_notes text,
  is_partial boolean NOT NULL DEFAULT false,
  remaining_amount numeric(14,2),
  due_date date,
  receipt_pdf_url text,
  data_completed_at timestamptz,
  data_completed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  created_by uuid, updated_by uuid
);

CREATE INDEX idx_payments_status_condo
  ON payments (tenant_id, condominium_id, status)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_payments_pending_data
  ON payments (tenant_id, condominium_id)
  WHERE status = 'approved_pending_data' AND deleted_at IS NULL;

CREATE INDEX idx_payments_origin
  ON payments (tenant_id, condominium_id, origin);
payment_receipts
sql
CREATE TABLE payment_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  payment_id uuid NOT NULL REFERENCES payments(id),
  file_url text NOT NULL,
  file_type text NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  ocr_data jsonb
);
payment_allocations
sql
CREATE TABLE payment_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  payment_id uuid NOT NULL REFERENCES payments(id),
  unit_charge_id uuid NOT NULL REFERENCES unit_charges(id),
  amount_applied numeric(14,2) NOT NULL,
  period char(7) NOT NULL
);
partial_payment_plans
sql
CREATE TABLE partial_payment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  condominium_id uuid NOT NULL REFERENCES condominiums(id),
  unit_id uuid NOT NULL REFERENCES units(id),
  total_amount numeric(14,2) NOT NULL,
  paid_amount numeric(14,2) NOT NULL DEFAULT 0,
  remaining_amount numeric(14,2) NOT NULL,
  due_date date NOT NULL,
  interest_rate numeric(6,3),
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
💸 Dominio: Gastos y proveedores
expense_categories y expenses
sql
CREATE TABLE expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  condominium_id uuid NOT NULL REFERENCES condominiums(id),
  name text NOT NULL,
  description text,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TYPE expense_status AS ENUM ('pending','paid','rejected');

CREATE TABLE expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  condominium_id uuid NOT NULL REFERENCES condominiums(id),
  category_id uuid NOT NULL REFERENCES expense_categories(id),
  supplier_id uuid,
  concept text NOT NULL,
  description text,
  amount numeric(14,2) NOT NULL,
  currency char(3) NOT NULL,
  exchange_rate numeric(18,6),
  expense_date date NOT NULL,
  receipt_url text,
  status expense_status NOT NULL DEFAULT 'pending',
  is_bank_commission boolean NOT NULL DEFAULT false,
  source_bank_movement_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  created_by uuid, updated_by uuid
);
budgets, suppliers, supplier_invoices, supplier_payments
sql
CREATE TABLE budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  condominium_id uuid NOT NULL REFERENCES condominiums(id),
  category_id uuid NOT NULL REFERENCES expense_categories(id),
  period char(7) NOT NULL,
  amount numeric(14,2) NOT NULL,
  currency char(3) NOT NULL,
  alert_threshold_pct numeric(5,2) NOT NULL DEFAULT 80,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  condominium_id uuid NOT NULL REFERENCES condominiums(id),
  name text NOT NULL,
  tax_id text,
  contact text,
  email citext,
  phone text,
  address text,
  credit_days int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TYPE invoice_status AS ENUM ('pending','partially_paid','paid','overdue');

CREATE TABLE supplier_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  condominium_id uuid NOT NULL REFERENCES condominiums(id),
  supplier_id uuid NOT NULL REFERENCES suppliers(id),
  invoice_number text NOT NULL,
  amount numeric(14,2) NOT NULL,
  currency char(3) NOT NULL,
  issue_date date NOT NULL,
  due_date date,
  status invoice_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE supplier_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  supplier_invoice_id uuid NOT NULL REFERENCES supplier_invoices(id),
  amount numeric(14,2) NOT NULL,
  currency char(3) NOT NULL,
  payment_date date NOT NULL,
  method text,
  reference text,
  receipt_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

## 🏦 Dominio: Conciliación bancaria
bank_accounts
sql
CREATE TABLE bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  condominium_id uuid NOT NULL REFERENCES condominiums(id),
  bank_code text NOT NULL,
  bank_name text NOT NULL,
  account_number text NOT NULL,
  account_type text,
  currency char(3) NOT NULL,
  holder_name text NOT NULL,
  holder_tax_id text,
  is_active boolean NOT NULL DEFAULT true,
  parser_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
bank_imports y bank_movements
sql
CREATE TABLE bank_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  condominium_id uuid NOT NULL REFERENCES condominiums(id),
  bank_account_id uuid NOT NULL REFERENCES bank_accounts(id),
  file_url text NOT NULL,
  imported_by uuid NOT NULL REFERENCES users(id),
  imported_at timestamptz NOT NULL DEFAULT now(),
  total_movements int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'processing',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TYPE movement_direction AS ENUM ('credit','debit');
CREATE TYPE movement_category AS ENUM (
  'mobile_payment','transfer','commission','service_charge','other'
);

CREATE TABLE bank_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  condominium_id uuid NOT NULL REFERENCES condominiums(id),
  bank_account_id uuid NOT NULL REFERENCES bank_accounts(id),
  import_id uuid NOT NULL REFERENCES bank_imports(id),
  date date NOT NULL,
  reference text,
  description text,
  amount numeric(14,2) NOT NULL,
  balance numeric(14,2),
  direction movement_direction NOT NULL,
  category movement_category NOT NULL DEFAULT 'other',
  is_matched boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
reconciliation_matches, reconciliation_issues, bank_parsers
sql
CREATE TYPE match_type AS ENUM ('auto','manual');
CREATE TYPE match_status AS ENUM ('suggested','approved','rejected');

CREATE TABLE reconciliation_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  bank_movement_id uuid NOT NULL REFERENCES bank_movements(id),
  payment_id uuid REFERENCES payments(id),
  expense_id uuid REFERENCES expenses(id),
  match_type match_type NOT NULL,
  confidence_score numeric(5,2),
  status match_status NOT NULL DEFAULT 'suggested',
  reviewed_by uuid,
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE reconciliation_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  condominium_id uuid NOT NULL REFERENCES condominiums(id),
  import_id uuid NOT NULL REFERENCES bank_imports(id),
  issue_type text NOT NULL,
  details jsonb,
  resolved boolean NOT NULL DEFAULT false,
  resolved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE bank_parsers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_code text NOT NULL UNIQUE,
  name text NOT NULL,
  delimiter char(1) NOT NULL DEFAULT ';',
  encoding text NOT NULL DEFAULT 'utf-8',
  column_map jsonb NOT NULL,
  decimal_separator char(1) NOT NULL DEFAULT ',',
  thousand_separator char(1) NOT NULL DEFAULT '.',
  sign_handling text NOT NULL DEFAULT 'explicit',
  version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

## 📄 Dominio: Actas, incidencias, quejas

minutes
sql

CREATE TYPE minute_status AS ENUM ('draft','issued','notified','closed');
CREATE TYPE minute_type AS ENUM ('violation','assembly','sanction');

CREATE TABLE minutes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  condominium_id uuid NOT NULL REFERENCES condominiums(id),
  sequential_number int NOT NULL,
  unit_id uuid REFERENCES units(id),
  person_id uuid REFERENCES persons(id),
  type minute_type NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  attachments jsonb,
  status minute_status NOT NULL DEFAULT 'draft',
  issued_at timestamptz,
  integrity_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (condominium_id, sequential_number)
);
incidents y complaints
sql
CREATE TYPE incident_priority AS ENUM ('low','medium','high');
CREATE TYPE incident_status AS ENUM ('open','in_progress','resolved','closed');

CREATE TABLE incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  condominium_id uuid NOT NULL REFERENCES condominiums(id),
  reporter_user_id uuid NOT NULL REFERENCES users(id),
  area text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  attachments jsonb,
  priority incident_priority NOT NULL DEFAULT 'medium',
  status incident_status NOT NULL DEFAULT 'open',
  assigned_staff_id uuid REFERENCES staff(id),
  supplier_id uuid REFERENCES suppliers(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TYPE complaint_status AS ENUM ('open','in_review','resolved','dismissed');
CREATE TYPE complaint_target AS ENUM ('resident','condominium');

CREATE TABLE complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  condominium_id uuid NOT NULL REFERENCES condominiums(id),
  reporter_user_id uuid REFERENCES users(id),
  target_type complaint_target NOT NULL,
  target_person_id uuid REFERENCES persons(id),
  target_unit_id uuid REFERENCES units(id),
  subject text NOT NULL,
  description text NOT NULL,
  status complaint_status NOT NULL DEFAULT 'open',
  responses jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

## ⚙️ Dominio: Configuración y sistema

condominium_settings, terms_and_conditions, user_terms_acceptance

sql

CREATE TABLE condominium_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  condominium_id uuid NOT NULL REFERENCES condominiums(id),
  key text NOT NULL,
  value jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (condominium_id, key)
);

CREATE TYPE terms_scope AS ENUM ('system','condominium');

CREATE TABLE terms_and_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  scope terms_scope NOT NULL,
  condominium_id uuid REFERENCES condominiums(id),
  version int NOT NULL,
  content text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_terms_acceptance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  terms_id uuid NOT NULL REFERENCES terms_and_conditions(id),
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip text
);
audit_logs
sql
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  condominium_id uuid,
  user_id uuid NOT NULL,
  module text NOT NULL,
  entity text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  before jsonb,
  after jsonb,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_tenant_created
  ON audit_logs (tenant_id, created_at DESC);
CREATE INDEX idx_audit_entity
  ON audit_logs (entity, entity_id);
notifications, notification_templates, files
sql
CREATE TYPE notification_channel AS ENUM ('push','whatsapp','email');
CREATE TYPE notification_status AS ENUM ('pending','sent','failed');

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  user_id uuid NOT NULL REFERENCES users(id),
  channel notification_channel NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  payload jsonb,
  status notification_status NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id),
  code text NOT NULL,
  channel notification_channel NOT NULL,
  locale locale NOT NULL,
  subject text,
  body text NOT NULL,
  variables jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code, channel, locale)
);

CREATE TABLE files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  condominium_id uuid,
  owner_user_id uuid REFERENCES users(id),
  bucket text NOT NULL,
  key text NOT NULL,
  mime_type text NOT NULL,
  size bigint NOT NULL,
  checksum text,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

## 🔐 Políticas RLS (esqueleto)

Todas las tablas de dominio requieren:

sql
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON <table>
  USING (tenant_id = current_setting('app.tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
Para tablas dependientes de condominio, agregar política adicional:

sql
CREATE POLICY condominium_isolation ON <table>
  USING (
    condominium_id IS NULL
    OR condominium_id = current_setting('app.condominium_id', true)::uuid
  );

