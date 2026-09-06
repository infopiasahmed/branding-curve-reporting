export type UserRole = "admin" | "marketer"
export type ClientStatus = "active" | "archived"
export type MeetingType = "client" | "internal"

export const REPORT_TAGS = [
  "campaign",
  "creative",
  "performance",
  "client_feedback",
  "issue",
  "follow_up",
  "other",
] as const

export type ReportTag = (typeof REPORT_TAGS)[number]

export type ActivityType =
  | "report_created"
  | "report_updated"
  | "meeting_created"
  | "meeting_notes_added"
  | "meeting_notes_updated"
  | "action_item_completed"

export type Profile = {
  id: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
  isActive: boolean
  avatarUrl?: string
}

export type Client = {
  id: string
  name: string
  logoUrl?: string
  category?: string
  contactPerson?: string
  status: ClientStatus
  createdAt: string
  updatedAt: string
}

export type ClientAssignment = {
  clientId: string
  userId: string
}

export type DailyReport = {
  id: string
  clientId: string
  userId: string
  reportDate: string
  content: string
  tomorrowPlan?: string
  tags: ReportTag[]
  createdAt: string
  updatedAt: string
}

export type Meeting = {
  id: string
  clientId: string
  createdBy: string
  title: string
  meetingDate: string
  meetingTime: string
  meetingType: MeetingType
  notes?: string
  participantIds: string[]
  actionItems: MeetingActionItem[]
  createdAt: string
  updatedAt: string
}

export type MeetingActionItem = {
  id: string
  meetingId: string
  content: string
  completed: boolean
  sortOrder: number
}

export type Activity = {
  id: string
  type: ActivityType
  userId: string
  clientId?: string
  entityId?: string
  summary: string
  createdAt: string
}

export type AgencyState = {
  profiles: Profile[]
  clients: Client[]
  assignments: ClientAssignment[]
  reports: DailyReport[]
  meetings: Meeting[]
  activities: Activity[]
}

export function displayName(profile?: Profile | null) {
  if (!profile) return "Unknown"
  return [profile.firstName, profile.lastName].filter(Boolean).join(" ")
}

export function initials(profile?: Profile | null) {
  if (!profile) return "?"
  return `${profile.firstName[0] ?? ""}${profile.lastName[0] ?? ""}`.toUpperCase() || "?"
}

export const TAG_LABELS: Record<ReportTag, string> = {
  campaign: "Campaign",
  creative: "Creative",
  performance: "Performance",
  client_feedback: "Client Feedback",
  issue: "Issue",
  follow_up: "Follow-up",
  other: "Other",
}
