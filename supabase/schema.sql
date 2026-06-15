create type user_role as enum (
  'Employee',
  'Mona',
  'Rashid',
  'Dr. Masjid',
  'Edlyn',
  'Aileen',
  'Admin'
);

create type workflow_stage as enum (
  'mona',
  'rashid',
  'dr-masjid',
  'edlyn',
  'aileen'
);

create type request_status as enum (
  'Draft',
  'Submitted',
  'Mona Review',
  'Rashid Review',
  'Rashid Auto Approved',
  'Rashid Declined',
  'Dr. Masjid Review',
  'Dr. Masjid Declined',
  'Edlyn Confirmation',
  'Purchase in Progress',
  'Invoice Uploaded',
  'Aileen Finance Review',
  'Invoice Cleared',
  'Order Confirmed',
  'Item Received',
  'Completed',
  'Sent Back for Clarification'
);

create type payment_term as enum (
  'COD',
  '15 days credit',
  '30 days credit',
  '60 days credit',
  '90 days credit',
  'Bank transfer',
  'LC'
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role user_role not null default 'Employee',
  department text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table procurement_requests (
  id text primary key,
  employee_name text not null,
  department text not null,
  item_name text not null,
  item_description text not null,
  quantity integer not null check (quantity > 0),
  estimated_amount numeric(12, 2) not null check (estimated_amount >= 0),
  currency text not null default 'AED',
  vendor_name text,
  reason_for_purchase text not null,
  priority text not null,
  required_by_date date not null,
  status request_status not null,
  stage workflow_stage not null,
  assignee_id uuid not null references profiles(id),
  submitted_by_id uuid not null references profiles(id),
  previous_responsible_id uuid references profiles(id),
  order_confirmed_at timestamptz,
  item_received_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table vendors (
  id uuid primary key default gen_random_uuid(),
  request_id text not null references procurement_requests(id) on delete cascade,
  contact_person text,
  company_name text,
  trn_number text,
  trade_license text,
  bank_details text,
  vat_registration text,
  owner_document text,
  website_link text,
  e_brochure_link text,
  business_location text,
  created_at timestamptz not null default now()
);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  request_id text not null references procurement_requests(id) on delete cascade,
  invoice_number text not null,
  invoice_amount numeric(12, 2) not null,
  invoice_date date not null,
  vendor text not null,
  uploaded_invoice_file text not null,
  payment_terms payment_term not null,
  finance_notes text,
  cleared_at timestamptz,
  created_at timestamptz not null default now()
);

create table attachments (
  id uuid primary key default gen_random_uuid(),
  request_id text references procurement_requests(id) on delete cascade,
  invoice_id uuid references invoices(id) on delete cascade,
  vendor_id uuid references vendors(id) on delete cascade,
  file_name text not null,
  file_type text not null,
  storage_path text not null,
  uploaded_by uuid not null references profiles(id),
  uploaded_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  request_id text references procurement_requests(id) on delete cascade,
  title text not null,
  body text not null,
  type text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  request_id text not null references procurement_requests(id) on delete cascade,
  user_id uuid not null references profiles(id),
  user_name text not null,
  action text not null,
  previous_status request_status not null,
  new_status request_status not null,
  comment text,
  decline_reason text,
  uploaded_invoice_reference text,
  assigned_person text,
  created_at timestamptz not null default now()
);

create table chatbot_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index procurement_requests_status_idx on procurement_requests(status);
create index procurement_requests_stage_idx on procurement_requests(stage);
create index procurement_requests_assignee_idx on procurement_requests(assignee_id);
create index procurement_requests_department_idx on procurement_requests(department);
create index notifications_user_unread_idx on notifications(user_id, read);
create index audit_logs_request_idx on audit_logs(request_id, created_at desc);

insert into storage.buckets (id, name, public)
values ('procurement-files', 'procurement-files', false)
on conflict (id) do nothing;
