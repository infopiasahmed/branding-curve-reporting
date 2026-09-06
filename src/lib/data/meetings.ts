import type { SupabaseClient } from "@supabase/supabase-js"
import { explainSupabaseError, mapMeeting } from "@/lib/data/mappers"
import type { Meeting, MeetingActionItem } from "@/types/domain"

const MEETING_SELECT =
  "*, meeting_participants(user_id), meeting_action_items(id, meeting_id, content, completed, sort_order)"

const INVALID_PARTICIPANTS =
  "One or more selected participants do not have access to this client."

const SESSION_EXPIRED = "Not signed in. Your session may have expired. Sign in again and retry."

const MEETING_INSERT_RLS =
  "You do not have permission to do that. The current signed-in user was used as the meeting creator, and related rows were not loaded as part of the insert. This remaining failure is a database permission check."

export async function fetchMeetings(client: SupabaseClient) {
  const { data, error } = await client
    .from("meetings")
    .select(MEETING_SELECT)
    .order("meeting_date", { ascending: false })
  if (error) throw new Error(explainSupabaseError(error))
  return (data ?? []).map((row) => mapMeeting(row as never))
}

async function fetchMeetingById(client: SupabaseClient, meetingId: string) {
  const { data, error } = await client
    .from("meetings")
    .select(MEETING_SELECT)
    .eq("id", meetingId)
    .single()
  if (error) throw new Error(explainSupabaseError(error))
  return mapMeeting(data as never)
}

function explainMeetingInsertError(error: { message: string; code?: string }) {
  if (error.code === "42501" || error.message.toLowerCase().includes("row-level security")) {
    return MEETING_INSERT_RLS
  }
  return explainSupabaseError(error)
}

function extraParticipantIds(creatorId: string, participantIds: string[]) {
  return Array.from(new Set(participantIds.filter((id) => id !== creatorId)))
}

async function eligibleExtraParticipants(
  client: SupabaseClient,
  clientId: string,
  creatorId: string,
  participantIds: string[]
) {
  const extraIds = extraParticipantIds(creatorId, participantIds)
  if (extraIds.length === 0) return extraIds

  const [{ data: profiles, error: profileError }, { data: assignments, error: assignmentError }] =
    await Promise.all([
      client.from("profiles").select("id, role, is_active").in("id", extraIds),
      client
        .from("client_assignments")
        .select("user_id")
        .eq("client_id", clientId)
        .in("user_id", extraIds),
    ])

  if (profileError) throw new Error(explainSupabaseError(profileError))
  if (assignmentError) throw new Error(explainSupabaseError(assignmentError))

  const assigned = new Set((assignments ?? []).map((row) => row.user_id as string))
  const profileById = new Map(
    (profiles ?? []).map((row) => [
      row.id as string,
      { role: row.role as string, isActive: row.is_active === true },
    ])
  )

  const allowed = extraIds.every((id) => {
    const profile = profileById.get(id)
    if (!profile?.isActive) return false
    if (profile.role === "admin") return true
    return assigned.has(id)
  })

  if (!allowed) throw new Error(INVALID_PARTICIPANTS)
  return extraIds
}

async function replaceExtraParticipants(
  client: SupabaseClient,
  meetingId: string,
  extraIds: string[]
) {
  const { error: clearParticipants } = await client
    .from("meeting_participants")
    .delete()
    .eq("meeting_id", meetingId)
  if (clearParticipants) throw new Error(explainSupabaseError(clearParticipants))

  if (extraIds.length === 0) return

  const { error: participantError } = await client.from("meeting_participants").insert(
    extraIds.map((userId) => ({ meeting_id: meetingId, user_id: userId }))
  )
  if (participantError) throw new Error(explainSupabaseError(participantError))
}

async function cleanupCreatedMeeting(
  client: SupabaseClient,
  meetingId: string,
  createdBy: string
) {
  const { error } = await client
    .from("meetings")
    .delete()
    .eq("id", meetingId)
    .eq("created_by", createdBy)
  if (!error) return
  if (process.env.NODE_ENV === "development") {
    console.info("[meeting-create]", {
      orphanCleanupAttempted: true,
      orphanCleanupSucceeded: false,
    })
  }
}

export async function saveMeetingRecord(
  client: SupabaseClient,
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
  const isNew = !input.id
  let creatorId: string

  if (isNew) {
    const { data: authData, error: authError } = await client.auth.getUser()
    if (authError || !authData.user) {
      throw new Error(SESSION_EXPIRED)
    }
    creatorId = authData.user.id
  } else {
    const { data: existing, error: existingError } = await client
      .from("meetings")
      .select("created_by")
      .eq("id", input.id)
      .single()
    if (existingError) throw new Error(explainSupabaseError(existingError))
    creatorId = existing.created_by as string
  }

  const extraIds = await eligibleExtraParticipants(
    client,
    input.clientId,
    creatorId,
    input.participantIds
  )

  let meetingId: string

  if (isNew) {
    const payload = {
      client_id: input.clientId,
      created_by: creatorId,
      title: input.title,
      meeting_date: input.meetingDate,
      meeting_time: input.meetingTime,
      meeting_type: input.meetingType,
      notes: input.notes ?? null,
    }

    const { data, error } = await client.from("meetings").insert(payload).select("*").single()
    if (error) throw new Error(explainMeetingInsertError(error))
    meetingId = data.id as string
  } else {
    const { error } = await client
      .from("meetings")
      .update({
        title: input.title,
        meeting_date: input.meetingDate,
        meeting_time: input.meetingTime,
        meeting_type: input.meetingType,
        notes: input.notes ?? null,
      })
      .eq("id", input.id)
    if (error) throw new Error(explainSupabaseError(error))
    meetingId = input.id as string
  }

  const extrasForInsert = extraParticipantIds(creatorId, extraIds)

  try {
    if (isNew) {
      if (extrasForInsert.length > 0) {
        const { error: participantError } = await client.from("meeting_participants").insert(
          extrasForInsert.map((userId) => ({ meeting_id: meetingId, user_id: userId }))
        )
        if (participantError) throw new Error(explainSupabaseError(participantError))
      }
    } else {
      await replaceExtraParticipants(client, meetingId, extrasForInsert)
    }
  } catch (participantError) {
    if (isNew) {
      await cleanupCreatedMeeting(client, meetingId, creatorId)
    }
    throw participantError
  }

  return fetchMeetingById(client, meetingId)
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
