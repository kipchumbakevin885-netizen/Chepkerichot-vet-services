-- Storage bucket for animal photos, scoped so a farmer can only manage
-- files under their own farm_id/ prefix. Upload paths must be structured as:
--   {farm_id}/{animal_id}/{filename}

insert into storage.buckets (id, name, public)
values ('animal-photos', 'animal-photos', true)
on conflict (id) do nothing;

create policy "animal_photos_read_public" on storage.objects
  for select using (bucket_id = 'animal-photos');

create policy "animal_photos_insert_own_farm" on storage.objects
  for insert with check (
    bucket_id = 'animal-photos'
    and exists (
      select 1 from farms f
      where f.id::text = (storage.foldername(name))[1]
      and f.owner_id = auth.uid()
    )
  );

create policy "animal_photos_update_own_farm" on storage.objects
  for update using (
    bucket_id = 'animal-photos'
    and exists (
      select 1 from farms f
      where f.id::text = (storage.foldername(name))[1]
      and f.owner_id = auth.uid()
    )
  );

create policy "animal_photos_delete_own_farm" on storage.objects
  for delete using (
    bucket_id = 'animal-photos'
    and exists (
      select 1 from farms f
      where f.id::text = (storage.foldername(name))[1]
      and f.owner_id = auth.uid()
    )
  );
