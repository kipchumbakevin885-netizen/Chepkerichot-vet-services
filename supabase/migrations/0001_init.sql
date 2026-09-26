-- Vet Sambai Services — initial schema
-- Run with: supabase db push  (or paste into the Supabase SQL editor)

create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
create type user_role as enum ('farmer', 'veterinarian', 'admin');
create type animal_species as enum ('cattle', 'sheep', 'goat', 'pig', 'poultry', 'other');
create type animal_sex as enum ('male', 'female');
create type health_status as enum ('healthy', 'under_treatment', 'sick', 'deceased', 'sold');
create type pregnancy_status as enum ('unknown', 'not_confirmed', 'confirmed', 'aborted', 'delivered');
create type reminder_type as enum (
  'heat', 'breeding', 'pregnancy_check', 'expected_birth', 'vaccination',
  'deworming', 'treatment_followup', 'feeding', 'veterinary_appointment', 'custom'
);
create type reminder_priority as enum ('low', 'medium', 'high');
create type reminder_status as enum ('upcoming', 'completed', 'overdue', 'dismissed');
create type request_status as enum ('pending', 'accepted', 'completed', 'cancelled');

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'farmer',
  full_name text not null,
  phone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- FARMS
-- ============================================================
create table farms (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references profiles(id) on delete cascade,
  farm_name text not null,
  county text,
  sub_county text,
  location text,
  livestock_kept text[], -- e.g. {'cattle','sheep'}
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- ANIMALS
-- ============================================================
create table animals (
  id uuid primary key default uuid_generate_v4(),
  farm_id uuid not null references farms(id) on delete cascade,
  tag_number text not null,
  name text,
  species animal_species not null,
  breed text,
  sex animal_sex not null,
  date_of_birth date,
  estimated_age_months integer,
  color_markings text,
  weight_kg numeric(6,2),
  body_condition_score numeric(3,1),
  identification_notes text,
  photo_url text,
  health_status health_status not null default 'healthy',
  existing_conditions text,
  allergies text,
  special_notes text,
  -- breeding cycle assumption, configurable per-animal; falls back to species default
  heat_cycle_days integer,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (farm_id, tag_number)
);
create index animals_farm_id_idx on animals(farm_id);

-- Species-level default cycle length assumptions (adjustable by vets/admins)
create table species_breeding_defaults (
  species animal_species primary key,
  default_heat_cycle_days integer,
  gestation_days integer,
  notes text
);
insert into species_breeding_defaults (species, default_heat_cycle_days, gestation_days, notes) values
  ('cattle', 21, 283, 'Approximate values — vary by breed and individual animal.'),
  ('sheep', 17, 152, 'Approximate values — vary by breed and individual animal.'),
  ('goat', 21, 150, 'Approximate values — vary by breed and individual animal.'),
  ('pig', 21, 114, 'Approximate values — vary by breed and individual animal.'),
  ('poultry', null, null, 'Not applicable — poultry breeding tracked differently.'),
  ('other', null, null, 'No default; set per animal.');

-- ============================================================
-- HEALTH RECORDS (general log, distinct from vaccination/deworming/treatment specifics)
-- ============================================================
create table health_records (
  id uuid primary key default uuid_generate_v4(),
  animal_id uuid not null references animals(id) on delete cascade,
  recorded_by uuid references profiles(id),
  record_date date not null default current_date,
  status health_status not null,
  notes text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- VACCINATIONS
-- ============================================================
create table vaccinations (
  id uuid primary key default uuid_generate_v4(),
  animal_id uuid not null references animals(id) on delete cascade,
  vaccine_name text not null,
  date_administered date not null,
  next_due_date date,
  administered_by text,
  notes text,
  created_at timestamptz not null default now()
);
create index vaccinations_animal_id_idx on vaccinations(animal_id);

-- ============================================================
-- DEWORMING
-- ============================================================
create table deworming_records (
  id uuid primary key default uuid_generate_v4(),
  animal_id uuid not null references animals(id) on delete cascade,
  date_administered date not null,
  product text,
  next_due_date date,
  notes text,
  created_at timestamptz not null default now()
);
create index deworming_animal_id_idx on deworming_records(animal_id);

-- ============================================================
-- TREATMENTS
-- ============================================================
create table treatment_records (
  id uuid primary key default uuid_generate_v4(),
  animal_id uuid not null references animals(id) on delete cascade,
  treatment_date date not null default current_date,
  symptoms text,
  diagnosis text,
  treatment text,
  medication text,
  dosage text,
  duration text,
  veterinarian text,
  follow_up_date date,
  notes text,
  created_at timestamptz not null default now()
);
create index treatments_animal_id_idx on treatment_records(animal_id);

-- ============================================================
-- BREEDING RECORDS
-- ============================================================
create table breeding_records (
  id uuid primary key default uuid_generate_v4(),
  animal_id uuid not null references animals(id) on delete cascade,
  heat_date date,
  service_date date,
  breeding_method text, -- natural / AI
  sire_id text,
  notes text,
  created_at timestamptz not null default now()
);
create index breeding_animal_id_idx on breeding_records(animal_id);

-- ============================================================
-- PREGNANCY RECORDS
-- ============================================================
create table pregnancy_records (
  id uuid primary key default uuid_generate_v4(),
  animal_id uuid not null references animals(id) on delete cascade,
  breeding_record_id uuid references breeding_records(id) on delete set null,
  status pregnancy_status not null default 'unknown',
  service_date date,
  confirmation_date date,
  expected_birth_date date, -- calculated, but stored so it can be manually overridden
  actual_birth_date date,
  outcome text, -- e.g. 'live birth', 'miscarriage'
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index pregnancy_animal_id_idx on pregnancy_records(animal_id);

-- ============================================================
-- FEEDING RECORDS
-- ============================================================
create table feeding_records (
  id uuid primary key default uuid_generate_v4(),
  animal_id uuid not null references animals(id) on delete cascade,
  feed_type text not null,
  quantity text,
  feed_date date not null default current_date,
  feed_time time,
  notes text,
  created_at timestamptz not null default now()
);
create index feeding_animal_id_idx on feeding_records(animal_id);

-- ============================================================
-- MILK RECORDS
-- ============================================================
create table milk_records (
  id uuid primary key default uuid_generate_v4(),
  animal_id uuid not null references animals(id) on delete cascade,
  record_date date not null default current_date,
  morning_liters numeric(5,2) default 0,
  evening_liters numeric(5,2) default 0,
  notes text,
  created_at timestamptz not null default now(),
  unique (animal_id, record_date)
);
create index milk_animal_id_idx on milk_records(animal_id);

-- ============================================================
-- REMINDERS
-- ============================================================
create table reminders (
  id uuid primary key default uuid_generate_v4(),
  farm_id uuid not null references farms(id) on delete cascade,
  animal_id uuid references animals(id) on delete cascade,
  type reminder_type not null,
  title text not null,
  due_date date not null,
  due_time time,
  priority reminder_priority not null default 'medium',
  status reminder_status not null default 'upcoming',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index reminders_farm_id_idx on reminders(farm_id);
create index reminders_due_date_idx on reminders(due_date);

-- ============================================================
-- NOTIFICATIONS (in-app; channel-agnostic so SMS/WhatsApp/email/push can hook in later)
-- ============================================================
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references profiles(id) on delete cascade,
  reminder_id uuid references reminders(id) on delete cascade,
  title text not null,
  body text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_profile_id_idx on notifications(profile_id);

-- ============================================================
-- VETERINARIANS
-- ============================================================
create table veterinarians (
  id uuid primary key references profiles(id) on delete cascade,
  license_number text,
  specialties text[],
  service_area text,
  phone text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- VETERINARY REQUESTS
-- ============================================================
create table veterinary_requests (
  id uuid primary key default uuid_generate_v4(),
  farm_id uuid not null references farms(id) on delete cascade,
  animal_id uuid references animals(id) on delete set null,
  requested_by uuid not null references profiles(id),
  service_type text not null,
  description text,
  preferred_date date,
  preferred_contact_method text,
  status request_status not null default 'pending',
  assigned_veterinarian_id uuid references veterinarians(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index vet_requests_farm_id_idx on veterinary_requests(farm_id);

-- ============================================================
-- APPOINTMENTS
-- ============================================================
create table appointments (
  id uuid primary key default uuid_generate_v4(),
  veterinary_request_id uuid references veterinary_requests(id) on delete cascade,
  farm_id uuid not null references farms(id) on delete cascade,
  veterinarian_id uuid references veterinarians(id),
  scheduled_at timestamptz not null,
  status text not null default 'scheduled',
  notes text,
  created_at timestamptz not null default now()
);
create index appointments_farm_id_idx on appointments(farm_id);

-- ============================================================
-- updated_at trigger helper
-- ============================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at before update on profiles for each row execute function set_updated_at();
create trigger trg_farms_updated_at before update on farms for each row execute function set_updated_at();
create trigger trg_animals_updated_at before update on animals for each row execute function set_updated_at();
create trigger trg_pregnancy_updated_at before update on pregnancy_records for each row execute function set_updated_at();
create trigger trg_reminders_updated_at before update on reminders for each row execute function set_updated_at();
create trigger trg_vetrequests_updated_at before update on veterinary_requests for each row execute function set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- A farmer may only read/write rows that trace back to a farm they own.
-- Veterinarians/admins get broader read access via role checks against `profiles`.
-- ============================================================

alter table profiles enable row level security;
alter table farms enable row level security;
alter table animals enable row level security;
alter table health_records enable row level security;
alter table vaccinations enable row level security;
alter table deworming_records enable row level security;
alter table treatment_records enable row level security;
alter table breeding_records enable row level security;
alter table pregnancy_records enable row level security;
alter table feeding_records enable row level security;
alter table milk_records enable row level security;
alter table reminders enable row level security;
alter table notifications enable row level security;
alter table veterinarians enable row level security;
alter table veterinary_requests enable row level security;
alter table appointments enable row level security;

-- Helper: is the current user an admin?
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql stable security definer;

-- profiles: users can read/update their own profile; admins can read all
create policy "profiles_select_own_or_admin" on profiles
  for select using (id = auth.uid() or is_admin());
create policy "profiles_update_own" on profiles
  for update using (id = auth.uid());
create policy "profiles_insert_own" on profiles
  for insert with check (id = auth.uid());

-- farms: owner-only, plus admin
create policy "farms_owner_all" on farms
  for all using (owner_id = auth.uid() or is_admin())
  with check (owner_id = auth.uid() or is_admin());

-- animals: farmer must own the parent farm
create policy "animals_via_farm_ownership" on animals
  for all using (
    exists (select 1 from farms f where f.id = farm_id and (f.owner_id = auth.uid() or is_admin()))
  )
  with check (
    exists (select 1 from farms f where f.id = farm_id and (f.owner_id = auth.uid() or is_admin()))
  );

-- generic pattern for animal-scoped tables: reachable only through an owned animal
create policy "health_records_via_animal" on health_records for all using (
  exists (select 1 from animals a join farms f on f.id = a.farm_id where a.id = animal_id and (f.owner_id = auth.uid() or is_admin()))
) with check (
  exists (select 1 from animals a join farms f on f.id = a.farm_id where a.id = animal_id and (f.owner_id = auth.uid() or is_admin()))
);

create policy "vaccinations_via_animal" on vaccinations for all using (
  exists (select 1 from animals a join farms f on f.id = a.farm_id where a.id = animal_id and (f.owner_id = auth.uid() or is_admin()))
) with check (
  exists (select 1 from animals a join farms f on f.id = a.farm_id where a.id = animal_id and (f.owner_id = auth.uid() or is_admin()))
);

create policy "deworming_via_animal" on deworming_records for all using (
  exists (select 1 from animals a join farms f on f.id = a.farm_id where a.id = animal_id and (f.owner_id = auth.uid() or is_admin()))
) with check (
  exists (select 1 from animals a join farms f on f.id = a.farm_id where a.id = animal_id and (f.owner_id = auth.uid() or is_admin()))
);

create policy "treatments_via_animal" on treatment_records for all using (
  exists (select 1 from animals a join farms f on f.id = a.farm_id where a.id = animal_id and (f.owner_id = auth.uid() or is_admin()))
) with check (
  exists (select 1 from animals a join farms f on f.id = a.farm_id where a.id = animal_id and (f.owner_id = auth.uid() or is_admin()))
);

create policy "breeding_via_animal" on breeding_records for all using (
  exists (select 1 from animals a join farms f on f.id = a.farm_id where a.id = animal_id and (f.owner_id = auth.uid() or is_admin()))
) with check (
  exists (select 1 from animals a join farms f on f.id = a.farm_id where a.id = animal_id and (f.owner_id = auth.uid() or is_admin()))
);

create policy "pregnancy_via_animal" on pregnancy_records for all using (
  exists (select 1 from animals a join farms f on f.id = a.farm_id where a.id = animal_id and (f.owner_id = auth.uid() or is_admin()))
) with check (
  exists (select 1 from animals a join farms f on f.id = a.farm_id where a.id = animal_id and (f.owner_id = auth.uid() or is_admin()))
);

create policy "feeding_via_animal" on feeding_records for all using (
  exists (select 1 from animals a join farms f on f.id = a.farm_id where a.id = animal_id and (f.owner_id = auth.uid() or is_admin()))
) with check (
  exists (select 1 from animals a join farms f on f.id = a.farm_id where a.id = animal_id and (f.owner_id = auth.uid() or is_admin()))
);

create policy "milk_via_animal" on milk_records for all using (
  exists (select 1 from animals a join farms f on f.id = a.farm_id where a.id = animal_id and (f.owner_id = auth.uid() or is_admin()))
) with check (
  exists (select 1 from animals a join farms f on f.id = a.farm_id where a.id = animal_id and (f.owner_id = auth.uid() or is_admin()))
);

-- reminders/notifications/vet requests/appointments: farm-scoped
create policy "reminders_via_farm" on reminders for all using (
  exists (select 1 from farms f where f.id = farm_id and (f.owner_id = auth.uid() or is_admin()))
) with check (
  exists (select 1 from farms f where f.id = farm_id and (f.owner_id = auth.uid() or is_admin()))
);

create policy "notifications_own" on notifications for all using (
  profile_id = auth.uid() or is_admin()
) with check (
  profile_id = auth.uid() or is_admin()
);

create policy "vet_requests_via_farm" on veterinary_requests for all using (
  exists (select 1 from farms f where f.id = farm_id and (f.owner_id = auth.uid() or is_admin()))
  or assigned_veterinarian_id = auth.uid()
) with check (
  exists (select 1 from farms f where f.id = farm_id and (f.owner_id = auth.uid() or is_admin()))
);

create policy "appointments_via_farm" on appointments for all using (
  exists (select 1 from farms f where f.id = farm_id and (f.owner_id = auth.uid() or is_admin()))
  or veterinarian_id = auth.uid()
) with check (
  exists (select 1 from farms f where f.id = farm_id and (f.owner_id = auth.uid() or is_admin()))
);

-- veterinarians directory: readable by any authenticated user (to request services), writable by self/admin
create policy "veterinarians_select_authenticated" on veterinarians
  for select using (auth.role() = 'authenticated');
create policy "veterinarians_write_self_or_admin" on veterinarians
  for all using (id = auth.uid() or is_admin())
  with check (id = auth.uid() or is_admin());

-- species_breeding_defaults: readable by all authenticated users, writable by admin only
alter table species_breeding_defaults enable row level security;
create policy "breeding_defaults_select" on species_breeding_defaults
  for select using (auth.role() = 'authenticated');
create policy "breeding_defaults_admin_write" on species_breeding_defaults
  for all using (is_admin()) with check (is_admin());
