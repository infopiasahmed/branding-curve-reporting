-- INSERT ... RETURNING * evaluates meetings_select as a WITH CHECK on the new row.
-- can_read_meeting(id) is STABLE and self-selects public.meetings, so it cannot see
-- the in-statement row and INSERT WITH RETURNING fails with 42501.
-- Evaluate the current row's columns directly. Visibility rules are unchanged.

drop policy if exists "meetings_select" on public.meetings;
create policy "meetings_select" on public.meetings
  for select to authenticated
  using (
    public.is_active_user()
    and (
      public.is_assigned_to_client(client_id)
      or created_by = auth.uid()
      or public.is_meeting_participant(id)
    )
  );
