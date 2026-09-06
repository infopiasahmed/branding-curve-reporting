import type { Activity, ActivityType, Client, DailyReport, Meeting, MeetingActionItem, Profile, ReportTag } from "@/types/domain"

export type ProfileRow = {
  id: string
  first_name: string
  last_name: string
  email: string
  role: Profile["role"]
  is_active: boolean
  avatar_url: string | null
}

export type ClientRow = {
  id: string
  name: string
  logo_url: string | null
  category: string | null
  contact_person: string | null
  status: Client["status"]
  created_at: string
  updated_at: string
}

export function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    role: row.role,
    isActive: row.is_active,
    avatarUrl: row.avatar_url ?? undefined,
  }
}

export function mapClient(row: ClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    logoUrl: row.logo_url ?? undefined,
    category: row.category ?? undefined,
    contactPerson: row.contact_person ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapReport(
  row: {
    id: string
    client_id: string
    user_id: string
    report_date: string
    content: string
    tomorrow_plan: string | null
    created_at: string
    updated_at: string
    report_tags?: { tag: ReportTag }[] | null
  }
): DailyReport {
  return {
    id: row.id,
    clientId: row.client_id,
    userId: row.user_id,
    reportDate: row.report_date,
    content: row.content,
    tomorrowPlan: row.tomorrow_plan ?? undefined,
    tags: (row.report_tags ?? []).map((item) => item.tag),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapMeeting(
  row: {
    id: string
    client_id: string
    created_by: string
    title: string
    meeting_date: string
    meeting_time: string
    meeting_type: Meeting["meetingType"]
    notes: string | null
    created_at: string
    updated_at: string
    meeting_participants?: { user_id: string }[] | null
    meeting_action_items?: {
      id: string
      meeting_id: string
      content: string
      completed: boolean
      sort_order: number
    }[] | null
  }
): Meeting {
  const actionItems: MeetingActionItem[] = (row.meeting_action_items ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => ({
      id: item.id,
      meetingId: item.meeting_id,
      content: item.content,
      completed: item.completed,
      sortOrder: item.sort_order,
    }))
  return {
    id: row.id,
    clientId: row.client_id,
    createdBy: row.created_by,
    title: row.title,
    meetingDate: row.meeting_date,
    meetingTime: String(row.meeting_time).slice(0, 5),
    meetingType: row.meeting_type,
    notes: row.notes ?? undefined,
    participantIds: (row.meeting_participants ?? []).map((item) => item.user_id),
    actionItems,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapActivity(row: {
  id: string
  type: string
  user_id: string
  client_id: string | null
  entity_id: string | null
  summary: string
  created_at: string
}): Activity {
  return {
    id: row.id,
    type: row.type as ActivityType,
    userId: row.user_id,
    clientId: row.client_id ?? undefined,
    entityId: row.entity_id ?? undefined,
    summary: row.summary,
    createdAt: row.created_at,
  }
}

export function explainSupabaseError(error: { message: string; code?: string }) {
  if (error.code === "23505") {
    return "A report for this client already exists today. Open it to edit instead."
  }
  if (error.code === "42501" || error.message.toLowerCase().includes("row-level security")) {
    return "You do not have permission to do that."
  }
  return error.message
}
