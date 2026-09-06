import type { SupabaseClient } from "@supabase/supabase-js"
import { explainSupabaseError, mapMeeting } from "@/lib/data/mappers"
import type { Meeting, MeetingActionItem } from "@/types/domain"

const MEETING_SELECT =
  "*, meeting_participants(user_id), meeting_action_items(id, meeting_id, content, completed, sort_order)"

export async function fetchMeetings(client: SupabaseClient) {
  const { data, error } = await client
    .from("meetings")
    .select(MEETING_SELECT)
    .order("meeting_date", { ascending: false })
  if (error) throw new Error(explainSupabaseError(error))
  return (data ?? []).map((row) => mapMeeting(row as never))
}

export async function saveMeetingRecord(
  client: SupabaseClient,
  createdBy: string,
  input: {
    id?: string
    clientId: string
    title: string
    meetingDate: string
    meetingTime: string
    meetingType: Meeting["meetingType"]
    participantIds: string[]
    notes?: string
    actionItems?: MeetingActionItem[]
  }
): Promise<Meeting> {
  const payload = {
    client_id: input.clientId,
    created_by: createdBy,
    title: input.title,
    meeting_date: input.meetingDate,
    meeting_time: input.meetingTime,
    meeting_type: input.meetingType,
    notes: input.notes ?? null,
  }

  const query = input.id
    ? client.from("meetings").update({
        title: payload.title,
        meeting_date: payload.meeting_date,
        meeting_time: payload.meeting_time,
        meeting_type: payload.meeting_type,
        notes: payload.notes,
      }).eq("id", input.id)
    : client.from("meetings").insert(payload)

  const { data, error } = await query.select(MEETING_SELECT).single()
  if (error) throw new Error(explainSupabaseError(error))
  const meetingId = data.id as string

  const { error: clearParticipants } = await client
    .from("meeting_participants")
    .delete()
    .eq("meeting_id", meetingId)
  if (clearParticipants) throw new Error(explainSupabaseError(clearParticipants))

  const participantIds = Array.from(new Set([createdBy, ...input.participantIds]))
  if (participantIds.length > 0) {
    const { error: participantError } = await client.from("meeting_participants").insert(
      participantIds.map((userId) => ({ meeting_id: meetingId, user_id: userId }))
    )
    if (participantError) throw new Error(explainSupabaseError(participantError))
  }

  const { data: fresh, error: reloadError } = await client
    .from("meetings")
    .select(MEETING_SELECT)
    .eq("id", meetingId)
    .single()
  if (reloadError) throw new Error(explainSupabaseError(reloadError))
  return mapMeeting(fresh as never)
}

export async function toggleActionItemRecord(
  client: SupabaseClient,
  meetingId: string,
  itemId: string
) {
  const { data: current, error: readError } = await client
    .from("meeting_action_items")
    .select("completed")
    .eq("id", itemId)
    .eq("meeting_id", meetingId)
    .single()
  if (readError) throw new Error(explainSupabaseError(readError))
  const { error } = await client
    .from("meeting_action_items")
    .update({ completed: !current.completed })
    .eq("id", itemId)
  if (error) throw new Error(explainSupabaseError(error))
}

export async function replaceActionItemsRecord(
  client: SupabaseClient,
  meetingId: string,
  items: MeetingActionItem[]
) {
  const { error: deleteError } = await client
    .from("meeting_action_items")
    .delete()
    .eq("meeting_id", meetingId)
  if (deleteError) throw new Error(explainSupabaseError(deleteError))
  if (items.length === 0) return
  const { error } = await client.from("meeting_action_items").insert(
    items.map((item, index) => ({
      id: item.id,
      meeting_id: meetingId,
      content: item.content,
      completed: item.completed,
      sort_order: item.sortOrder ?? index,
    }))
  )
  if (error) throw new Error(explainSupabaseError(error))
}
