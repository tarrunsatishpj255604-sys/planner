/*
# Social Features Module — Database Schema

1. Extended `profiles` table with social columns
2. New Tables: friends, friend_requests, study_rooms, room_members, shared_notes, note_comments, note_likes, notifications
3. Security: RLS on all tables, owner-scoped CRUD, friend-scoped SELECT for shared content
*/

-- ============ EXTEND PROFILES ============
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS school text DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country text DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_subject text DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'offline';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_visibility text DEFAULT 'public';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_stats boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_on_leaderboard boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS allow_friend_requests boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active timestamptz DEFAULT now();

-- ============ FRIENDS ============
CREATE TABLE IF NOT EXISTS friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, friend_id)
);
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_friends" ON friends;
CREATE POLICY "select_own_friends" ON friends FOR SELECT TO authenticated USING (auth.uid() = user_id OR auth.uid() = friend_id);
DROP POLICY IF EXISTS "insert_own_friends" ON friends;
CREATE POLICY "insert_own_friends" ON friends FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_friends" ON friends;
CREATE POLICY "delete_own_friends" ON friends FOR DELETE TO authenticated USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- ============ FRIEND REQUESTS ============
CREATE TABLE IF NOT EXISTS friend_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_fr" ON friend_requests;
CREATE POLICY "select_own_fr" ON friend_requests FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
DROP POLICY IF EXISTS "insert_own_fr" ON friend_requests;
CREATE POLICY "insert_own_fr" ON friend_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
DROP POLICY IF EXISTS "update_own_fr" ON friend_requests;
CREATE POLICY "update_own_fr" ON friend_requests FOR UPDATE TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id) WITH CHECK (auth.uid() = sender_id OR auth.uid() = receiver_id);
DROP POLICY IF EXISTS "delete_own_fr" ON friend_requests;
CREATE POLICY "delete_own_fr" ON friend_requests FOR DELETE TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- ============ STUDY ROOMS ============
CREATE TABLE IF NOT EXISTS study_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  subject text DEFAULT '',
  timer_duration integer DEFAULT 25,
  max_participants integer DEFAULT 10,
  is_public boolean DEFAULT true,
  status text DEFAULT 'waiting',
  current_phase text DEFAULT 'idle',
  phase_ends_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE study_rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_all_rooms" ON study_rooms;
CREATE POLICY "select_all_rooms" ON study_rooms FOR SELECT TO authenticated USING (is_public = true OR auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_rooms" ON study_rooms;
CREATE POLICY "insert_own_rooms" ON study_rooms FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_rooms" ON study_rooms;
CREATE POLICY "update_own_rooms" ON study_rooms FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_rooms" ON study_rooms;
CREATE POLICY "delete_own_rooms" ON study_rooms FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ ROOM MEMBERS ============
CREATE TABLE IF NOT EXISTS room_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES study_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  is_ready boolean DEFAULT false,
  role text DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(room_id, user_id)
);
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_room_members" ON room_members;
CREATE POLICY "select_room_members" ON room_members FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_membership" ON room_members;
CREATE POLICY "insert_own_membership" ON room_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_membership" ON room_members;
CREATE POLICY "update_own_membership" ON room_members FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_membership" ON room_members;
CREATE POLICY "delete_own_membership" ON room_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ SHARED NOTES ============
CREATE TABLE IF NOT EXISTS shared_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  subject text DEFAULT '',
  content text DEFAULT '',
  tags text[] DEFAULT '{}',
  visibility text DEFAULT 'friends',
  like_count integer DEFAULT 0,
  bookmark_count integer DEFAULT 0,
  download_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE shared_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_shared_notes" ON shared_notes;
CREATE POLICY "select_shared_notes" ON shared_notes FOR SELECT TO authenticated USING (
  visibility = 'public' OR auth.uid() = user_id OR
  (visibility = 'friends' AND EXISTS (SELECT 1 FROM friends WHERE (friends.user_id = auth.uid() AND friends.friend_id = shared_notes.user_id) OR (friends.friend_id = auth.uid() AND friends.user_id = shared_notes.user_id)))
);
DROP POLICY IF EXISTS "insert_own_shared_notes" ON shared_notes;
CREATE POLICY "insert_own_shared_notes" ON shared_notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_shared_notes" ON shared_notes;
CREATE POLICY "update_own_shared_notes" ON shared_notes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_shared_notes" ON shared_notes;
CREATE POLICY "delete_own_shared_notes" ON shared_notes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ NOTE COMMENTS ============
CREATE TABLE IF NOT EXISTS note_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL REFERENCES shared_notes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE note_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_note_comments" ON note_comments;
CREATE POLICY "select_note_comments" ON note_comments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_note_comments" ON note_comments;
CREATE POLICY "insert_own_note_comments" ON note_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_note_comments" ON note_comments;
CREATE POLICY "delete_own_note_comments" ON note_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ NOTE LIKES ============
CREATE TABLE IF NOT EXISTS note_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL REFERENCES shared_notes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(note_id, user_id)
);
ALTER TABLE note_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_note_likes" ON note_likes;
CREATE POLICY "select_note_likes" ON note_likes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_note_likes" ON note_likes;
CREATE POLICY "insert_own_note_likes" ON note_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_note_likes" ON note_likes;
CREATE POLICY "delete_own_note_likes" ON note_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ NOTIFICATIONS ============
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text DEFAULT '',
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resource_id uuid,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR auth.uid() = actor_id);
DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_notifications" ON notifications;
CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_fr_receiver ON friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_fr_sender ON friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_rooms_public ON study_rooms(is_public);
CREATE INDEX IF NOT EXISTS idx_room_members_room ON room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_shared_notes_visibility ON shared_notes(visibility);
CREATE INDEX IF NOT EXISTS idx_note_comments_note ON note_comments(note_id);
CREATE INDEX IF NOT EXISTS idx_note_likes_note ON note_likes(note_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
