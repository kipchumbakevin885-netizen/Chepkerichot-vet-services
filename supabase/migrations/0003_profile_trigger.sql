-- Creates a `profiles` row automatically whenever a new user signs up via
-- Supabase Auth, pulling full_name/phone out of the signUp() options.data
-- payload sent from app/register/page.tsx.

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'phone',
    new.email,
    'farmer'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
