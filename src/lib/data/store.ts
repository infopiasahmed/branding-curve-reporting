import { createSeedState, DEMO_USERS } from "@/lib/data/seed"
import type {
  Activity,
  AgencyState,
  Client,
  DailyReport,
  Meeting,
  MeetingActionItem,
  Profile,
  ReportTag,
} from "@/types/domain"

const STORAGE_KEY = "bc-agency-store-v1"

function nowISO() {
  return new Date().toISOString()
}

function loadState(): AgencyState {
  if (typeof window === "undefined") return createSeedState()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return createSeedState()
    return JSON.parse(raw) as AgencyState
  } catch {
    return createSeedState()
  }
}

export class AgencyStore {
  private state: AgencyState
  private listeners = new Set<() => void>()

  constructor() {
    this.state = createSeedState()
  }

  hydrate() {
    if (typeof window === "undefined") return
    this.state = loadState()
    this.listeners.forEach((listener) => listener())
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getState = () => this.state

  private commit(next: AgencyState) {
    this.state = next
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    }
    this.listeners.forEach((listener) => listener())
  }

  signIn(email: string, password: string) {
    const match = DEMO_USERS.find(
      (user) => user.email.toLowerCase() === email.toLowerCase() && user.password === password
    )
    if (!match) throw new Error("Invalid email or password")
    return this.state.profiles.find((profile) => profile.id === match.id)!
  }

  assignedClientIds(userId: string, role: Profile["role"]) {
    if (role === "admin") return this.state.clients.map((client) => client.id)
    return this.state.assignments
      .filter((assignment) => assignment.userId === userId)
      .map((assignment) => assignment.clientId)
  }

  visibleClients(user: Profile) {
    const ids = new Set(this.assignedClientIds(user.id, user.role))
    return this.state.clients.filter(
      (client) => ids.has(client.id) && (user.role === "admin" || client.status === "active")
    )
  }

  saveReport(input: {
    id?: string
    clientId: string
    userId: string
    reportDate: string
    content: string
    tomorrowPlan?: string
    tags: ReportTag[]
  }) {
    const existing =
      this.state.reports.find(
        (report) =>
          report.id === input.id ||
          (report.clientId === input.clientId &&
            report.userId === input.userId &&
            report.reportDate === input.reportDate)
      ) ?? null

    const report: DailyReport = existing
      ? {
          ...existing,
          content: input.content,
          tomorrowPlan: input.tomorrowPlan,
          tags: input.tags,
          updatedAt: nowISO(),
        }
      : {
          id: crypto.randomUUID(),
          clientId: input.clientId,
          userId: input.userId,
          reportDate: input.reportDate,
          content: input.content,
          tomorrowPlan: input.tomorrowPlan,
          tags: input.tags,
          createdAt: nowISO(),
          updatedAt: nowISO(),
        }

    const reports = existing
      ? this.state.reports.map((item) => (item.id === existing.id ? report : item))
      : [report, ...this.state.reports]

    const activity: Activity = {
      id: crypto.randomUUID(),
      type: existing ? "report_updated" : "report_created",
      userId: input.userId,
      clientId: input.clientId,
      entityId: report.id,
      summary: existing ? "Updated daily report" : "Added daily report",
      createdAt: nowISO(),
    }

    this.commit({
      ...this.state,
      reports,
      activities: [activity, ...this.state.activities],
    })
    return report
  }

  saveClient(input: Omit<Client, "createdAt" | "updatedAt"> & { createdAt?: string }) {
    const existing = this.state.clients.find((client) => client.id === input.id)
    const client: Client = {
      ...input,
      createdAt: existing?.createdAt ?? nowISO(),
      updatedAt: nowISO(),
    }
    const clients = existing
      ? this.state.clients.map((item) => (item.id === client.id ? client : item))
      : [client, ...this.state.clients]
    this.commit({ ...this.state, clients })
    return client
  }

  setAssignments(userId: string, clientIds: string[]) {
    const others = this.state.assignments.filter((assignment) => assignment.userId !== userId)
    this.commit({
      ...this.state,
      assignments: [
        ...others,
        ...clientIds.map((clientId) => ({ clientId, userId })),
      ],
    })
  }

  inviteMarketer(input: { firstName: string; lastName: string; email: string }) {
    if (this.state.profiles.some((profile) => profile.email === input.email)) {
      throw new Error("A user with this email already exists")
    }
    const profile: Profile = {
      id: crypto.randomUUID(),
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      role: "marketer",
      isActive: true,
    }
    this.commit({ ...this.state, profiles: [...this.state.profiles, profile] })
    return profile
  }

  saveMeeting(input: {
    id?: string
    clientId: string
    createdBy: string
    title: string
    meetingDate: string
    meetingTime: string
    meetingType: Meeting["meetingType"]
    participantIds: string[]
    notes?: string
    actionItems?: MeetingActionItem[]
  }) {
    const existing = input.id
      ? this.state.meetings.find((meeting) => meeting.id === input.id)
      : undefined
    const meeting: Meeting = existing
      ? {
          ...existing,
          ...input,
          id: existing.id,
          actionItems: input.actionItems ?? existing.actionItems,
          updatedAt: nowISO(),
        }
      : {
          id: crypto.randomUUID(),
          clientId: input.clientId,
          createdBy: input.createdBy,
          title: input.title,
          meetingDate: input.meetingDate,
          meetingTime: input.meetingTime,
          meetingType: input.meetingType,
          notes: input.notes,
          participantIds: input.participantIds,
          actionItems: input.actionItems ?? [],
          createdAt: nowISO(),
          updatedAt: nowISO(),
        }

    const meetings = existing
      ? this.state.meetings.map((item) => (item.id === existing.id ? meeting : item))
      : [meeting, ...this.state.meetings]

    const notesJustAdded =
      existing && !existing.notes && input.notes
        ? "meeting_notes_added"
        : existing
          ? null
          : "meeting_created"

    const activities = notesJustAdded
      ? [
          {
            id: crypto.randomUUID(),
            type: notesJustAdded,
            userId: input.createdBy,
            clientId: input.clientId,
            entityId: meeting.id,
            summary:
              notesJustAdded === "meeting_notes_added"
                ? "Added meeting notes"
                : "Added meeting",
            createdAt: nowISO(),
          } satisfies Activity,
          ...this.state.activities,
        ]
      : this.state.activities

    this.commit({ ...this.state, meetings, activities })
    return meeting
  }

  toggleActionItem(meetingId: string, itemId: string, userId: string) {
    const meeting = this.state.meetings.find((item) => item.id === meetingId)
    if (!meeting) return
    const items = meeting.actionItems.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    )
    const toggled = items.find((item) => item.id === itemId)
    const meetings = this.state.meetings.map((item) =>
      item.id === meetingId ? { ...item, actionItems: items, updatedAt: nowISO() } : item
    )
    const activities =
      toggled?.completed
        ? [
            {
              id: crypto.randomUUID(),
              type: "action_item_completed" as const,
              userId,
              clientId: meeting.clientId,
              entityId: itemId,
              summary: "Completed action item",
              createdAt: nowISO(),
            },
            ...this.state.activities,
          ]
        : this.state.activities
    this.commit({ ...this.state, meetings, activities })
  }

  replaceActionItems(meetingId: string, items: MeetingActionItem[]) {
    this.commit({
      ...this.state,
      meetings: this.state.meetings.map((meeting) =>
        meeting.id === meetingId
          ? { ...meeting, actionItems: items, updatedAt: nowISO() }
          : meeting
      ),
    })
  }
}

export const agencyStore = new AgencyStore()
