import { todayISO } from "@/lib/dates"
import type { AgencyState, Client, DailyReport, Meeting, Profile } from "@/types/domain"

export function clientsForUser(state: AgencyState, user: Profile) {
  if (user.role === "admin") {
    return state.clients.filter((client) => client.status === "active")
  }
  const ids = new Set(
    state.assignments.filter((item) => item.userId === user.id).map((item) => item.clientId)
  )
  return state.clients.filter((client) => ids.has(client.id) && client.status === "active")
}

export function assignmentsForClient(state: AgencyState, clientId: string) {
  return state.assignments
    .filter((item) => item.clientId === clientId)
    .map((item) => state.profiles.find((profile) => profile.id === item.userId))
    .filter(Boolean) as Profile[]
}

export function assignmentsForUser(state: AgencyState, userId: string) {
  return state.assignments
    .filter((item) => item.userId === userId)
    .map((item) => state.clients.find((client) => client.id === item.clientId))
    .filter(Boolean) as Client[]
}

export function todayReport(state: AgencyState, userId: string, clientId: string, date = todayISO()) {
  return state.reports.find(
    (report) =>
      report.userId === userId && report.clientId === clientId && report.reportDate === date
  )
}

export function reportingProgress(
  state: AgencyState,
  user: Profile,
  date = todayISO()
) {
  const required =
    user.role === "admin"
      ? state.assignments.filter((item) => {
          const client = state.clients.find((entry) => entry.id === item.clientId)
          return client?.status === "active"
        })
      : state.assignments.filter((item) => {
          const client = state.clients.find((entry) => entry.id === item.clientId)
          return item.userId === user.id && client?.status === "active"
        })

  const completed = required.filter((item) =>
    state.reports.some(
      (report) =>
        report.userId === item.userId &&
        report.clientId === item.clientId &&
        report.reportDate === date
    )
  )

  return {
    completed: completed.length,
    total: required.length,
    pending: required
      .filter(
        (item) =>
          !state.reports.some(
            (report) =>
              report.userId === item.userId &&
              report.clientId === item.clientId &&
              report.reportDate === date
          )
      )
      .map((item) => ({
        client: state.clients.find((client) => client.id === item.clientId)!,
        marketer: state.profiles.find((profile) => profile.id === item.userId)!,
      })),
  }
}

export function meetingsForScope(
  state: AgencyState,
  user: Profile
) {
  const clientIds = new Set(clientsForUser(state, user).map((client) => client.id))
  return state.meetings.filter(
    (meeting) =>
      clientIds.has(meeting.clientId) ||
      meeting.createdBy === user.id ||
      meeting.participantIds.includes(user.id)
  )
}

export type TimelineItem =
  | { kind: "report"; at: string; report: DailyReport }
  | { kind: "meeting"; at: string; meeting: Meeting }

export function clientTimeline(state: AgencyState, clientId: string): TimelineItem[] {
  const reports = state.reports
    .filter((report) => report.clientId === clientId)
    .map((report) => ({
      kind: "report" as const,
      at: report.createdAt,
      report,
    }))
  const meetings = state.meetings
    .filter((meeting) => meeting.clientId === clientId)
    .map((meeting) => ({
      kind: "meeting" as const,
      at: meeting.createdAt,
      meeting,
    }))
  return [...reports, ...meetings].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
  )
}

export function visibleActivities(state: AgencyState, user: Profile) {
  if (user.role === "admin") return state.activities
  const clientIds = new Set(clientsForUser(state, user).map((client) => client.id))
  return state.activities.filter(
    (activity) => activity.userId === user.id || (activity.clientId && clientIds.has(activity.clientId))
  )
}
