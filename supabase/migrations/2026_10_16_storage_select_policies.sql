-- FIX-RG-44 step 1 (additive): let signed-in users create signed URLs.
-- createSignedUrl/createSignedUrls need a SELECT policy on storage.objects.
-- Public buckets serve /object/public/ without RLS, so this changes nothing
-- for builds that still use public URLs. Applied live 2026-10-16.

-- images: any signed-in user (profiles, posts, library, training)
create policy "Authenticated users can read images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'images');

-- chat-files: path is <chat_id>/<file>; only current members of that chat
create policy "Chat members can read chat files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'chat-files'
    and case when (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
             then public.user_is_chat_member(((storage.foldername(name))[1])::uuid)
             else false end
  );
