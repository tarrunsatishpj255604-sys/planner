-- Allow room hosts to delete room_members and room_invites for rooms they own
-- (needed when a host deletes their room and needs to clean up members/invites)

DROP POLICY IF EXISTS "delete_room_members_by_host" ON room_members;
CREATE POLICY "delete_room_members_by_host" ON room_members FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM study_rooms
      WHERE study_rooms.id = room_members.room_id
      AND study_rooms.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_room_invites_by_host" ON room_invites;
CREATE POLICY "delete_room_invites_by_host" ON room_invites FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM study_rooms
      WHERE study_rooms.id = room_invites.room_id
      AND study_rooms.user_id = auth.uid()
    )
  );
