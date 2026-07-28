/*
# Add user_files table for file storage

1. New Tables
- `user_files`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to auth.uid())
  - `subject_id` (uuid, nullable, references subjects)
  - `file_name` (text, original file name)
  - `file_path` (text, storage path in Supabase Storage)
  - `file_size` (bigint, size in bytes)
  - `file_type` (text, MIME type)
  - `created_at` (timestamp)

2. Security
- Enable RLS on `user_files`.
- Owner-scoped CRUD: each authenticated user can only access their own files.
- Storage bucket `user_files` set to public for read access.
*/

CREATE TABLE IF NOT EXISTS user_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint DEFAULT 0,
  file_type text DEFAULT 'application/octet-stream',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_files" ON user_files;
CREATE POLICY "select_own_files" ON user_files FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_files" ON user_files;
CREATE POLICY "insert_own_files" ON user_files FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_files" ON user_files;
CREATE POLICY "update_own_files" ON user_files FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_files" ON user_files;
CREATE POLICY "delete_own_files" ON user_files FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

INSERT INTO storage.buckets (id, name, public)
VALUES ('user_files', 'user_files', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "select_own_storage_files" ON storage.objects;
CREATE POLICY "select_own_storage_files" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'user_files' AND auth.uid() = owner);

DROP POLICY IF EXISTS "insert_own_storage_files" ON storage.objects;
CREATE POLICY "insert_own_storage_files" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'user_files' AND auth.uid() = owner);

DROP POLICY IF EXISTS "update_own_storage_files" ON storage.objects;
CREATE POLICY "update_own_storage_files" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'user_files' AND auth.uid() = owner) WITH CHECK (bucket_id = 'user_files' AND auth.uid() = owner);

DROP POLICY IF EXISTS "delete_own_storage_files" ON storage.objects;
CREATE POLICY "delete_own_storage_files" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'user_files' AND auth.uid() = owner);
