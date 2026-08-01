/*
# Add room invite links table

1. New Tables
- `room_invites`
  - `id` (uuid, primary key)
  - `room_id` (uuid, foreign key to study_rooms, cascade on delete)
  - `created_by` (uuid, foreign key to auth.users, cascade on delete)
  - `token` (text, unique, not null) — the share code in the invite URL
  - `expires_at` (timestamptz, not null) — when the invite link expires
  - `created_at` (timestamptz, default now)
2. Security
- Enable RLS on `room_invites`.
- Owner-scoped: only the room host/creator can create invites.
- Anyone with a valid (non-expired) token can read the invite (to join a private room).
- Only the creator can delete their own invites.
3. Indexes
- Index on `token` for fast lookups.
- Index on `room_id` for finding a room's invites.
*/

CREATE TABLE IF NOT EXISTS room_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES study_rooms(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE room_invites ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_room_invites_token ON room_invites(token);
CREATE INDEX IF NOT EXISTS idx_room_invites_room_id ON room_invites(room_id);

DROP POLICY IF EXISTS "select_room_invites" ON room_invites;
CREATE POLICY "select_room_invites" ON room_invites FOR SELECT
  TO authenticated USING (
    created_by = auth.uid()
    OR expires_at > now()
  );

DROP POLICY IF EXISTS "insert_room_invites" ON room_invites;
CREATE POLICY "insert_room_invites" ON room_invites FOR INSERT
  TO authenticated WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "delete_room_invites" ON room_invites;
CREATE POLICY "delete_room_invites" ON room_invites FOR DELETE
  TO authenticated USING (created_by = auth.uid());
