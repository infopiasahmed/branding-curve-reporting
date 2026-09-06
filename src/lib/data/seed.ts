import type {
  Activity,
  AgencyState,
  Client,
  ClientAssignment,
  DailyReport,
  Meeting,
  Profile,
} from "@/types/domain"
import { todayISO } from "@/lib/dates"

export const DEMO_PASSWORD = "demo1234"

const today = todayISO()
const yesterday = todayISO(new Date(Date.now() - 86400000))
const tomorrow = todayISO(new Date(Date.now() + 86400000))

export const DEMO_ADMIN_ID = "11111111-1111-1111-1111-111111111111"
export const DEMO_RAHIM_ID = "22222222-2222-2222-2222-222222222222"
export const DEMO_NADIA_ID = "33333333-3333-3333-3333-333333333333"

export const CLOUDY_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
export const VIOR_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
export const BLOOM_ID = "cccccccc-cccc-cccc-cccc-cccccccccccc"
export const ATLAS_ID = "dddddddd-dddd-dddd-dddd-dddddddddddd"
export const PEAK_ID = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"

export const profiles: Profile[] = [
  {
    id: DEMO_ADMIN_ID,
    firstName: "Farhan",
    lastName: "Khan",
    email: "farhan@brandingcurve.com",
    role: "admin",
    isActive: true,
  },
  {
    id: DEMO_RAHIM_ID,
    firstName: "Rahim",
    lastName: "Ahmed",
    email: "rahim@brandingcurve.com",
    role: "marketer",
    isActive: true,
  },
  {
    id: DEMO_NADIA_ID,
    firstName: "Nadia",
    lastName: "Rahman",
    email: "nadia@brandingcurve.com",
    role: "marketer",
    isActive: true,
  },
]

const clients: Client[] = [
  {
    id: CLOUDY_ID,
    name: "Cloudy BD",
    category: "Fashion & Accessories",
    contactPerson: "Ayesha Karim",
    status: "active",
    createdAt: "2026-07-27T10:00:00.000Z",
    updatedAt: "2026-09-03T10:00:00.000Z",
  },
  {
    id: VIOR_ID,
    name: "VIOR",
    category: "Menswear",
    contactPerson: "Imran Chowdhury",
    status: "active",
    createdAt: "2026-08-06T10:00:00.000Z",
    updatedAt: "2026-09-04T10:00:00.000Z",
  },
  {
    id: BLOOM_ID,
    name: "Bloom Studio",
    category: "Beauty",
    contactPerson: "Sara Ali",
    status: "active",
    createdAt: "2026-08-16T10:00:00.000Z",
    updatedAt: "2026-09-04T22:00:00.000Z",
  },
  {
    id: ATLAS_ID,
    name: "Atlas Foods",
    category: "FMCG",
    contactPerson: "Rafiul Hasan",
    status: "active",
    createdAt: "2026-08-18T10:00:00.000Z",
    updatedAt: "2026-09-05T02:00:00.000Z",
  },
  {
    id: PEAK_ID,
    name: "Peak Fitness",
    category: "Health",
    contactPerson: "Maya Rahman",
    status: "active",
    createdAt: "2026-08-24T10:00:00.000Z",
    updatedAt: "2026-09-05T04:00:00.000Z",
  },
]

const assignments: ClientAssignment[] = [
  { clientId: CLOUDY_ID, userId: DEMO_RAHIM_ID },
  { clientId: VIOR_ID, userId: DEMO_RAHIM_ID },
  { clientId: PEAK_ID, userId: DEMO_RAHIM_ID },
  { clientId: BLOOM_ID, userId: DEMO_NADIA_ID },
  { clientId: ATLAS_ID, userId: DEMO_NADIA_ID },
  { clientId: PEAK_ID, userId: DEMO_NADIA_ID },
]

const reports: DailyReport[] = [
  {
    id: "r1",
    clientId: CLOUDY_ID,
    userId: DEMO_RAHIM_ID,
    reportDate: today,
    content:
      "New creative campaign was launched today. Existing campaign CPA increased slightly. Tomorrow we will monitor the new creative.",
    tomorrowPlan: "Watch CPA on the new set and pause underperforming ads if needed.",
    tags: ["campaign", "creative"],
    createdAt: "2026-09-05T12:18:00.000Z",
    updatedAt: "2026-09-05T12:18:00.000Z",
  },
  {
    id: "r2",
    clientId: BLOOM_ID,
    userId: DEMO_NADIA_ID,
    reportDate: today,
    content:
      "Collected client feedback on the landing page. Conversion is stable. Need new UGC assets by Monday.",
    tags: ["client_feedback", "creative"],
    createdAt: "2026-09-05T11:32:00.000Z",
    updatedAt: "2026-09-05T11:32:00.000Z",
  },
  {
    id: "r3",
    clientId: ATLAS_ID,
    userId: DEMO_NADIA_ID,
    reportDate: today,
    content:
      "Retargeting ads are performing well. Catalog feed had 4 missing SKUs which have been flagged.",
    tags: ["performance", "issue"],
    createdAt: "2026-09-05T11:00:00.000Z",
    updatedAt: "2026-09-05T11:00:00.000Z",
  },
  {
    id: "r4",
    clientId: CLOUDY_ID,
    userId: DEMO_RAHIM_ID,
    reportDate: yesterday,
    content:
      "Spent the day preparing launch assets and aligning the media plan with the client.",
    tags: ["campaign"],
    createdAt: "2026-09-04T10:00:00.000Z",
    updatedAt: "2026-09-04T10:00:00.000Z",
  },
]

const meetings: Meeting[] = [
  {
    id: "m1",
    clientId: CLOUDY_ID,
    createdBy: DEMO_RAHIM_ID,
    title: "Campaign Review",
    meetingDate: today,
    meetingTime: "16:00",
    meetingType: "client",
    notes: "Discussed the upcoming product launch with the client.",
    participantIds: [DEMO_RAHIM_ID],
    actionItems: [
      {
        id: "ai1",
        meetingId: "m1",
        content: "Collect new creatives",
        completed: false,
        sortOrder: 0,
      },
      {
        id: "ai2",
        meetingId: "m1",
        content: "Launch campaign Monday",
        completed: false,
        sortOrder: 1,
      },
    ],
    createdAt: "2026-09-05T09:20:00.000Z",
    updatedAt: "2026-09-05T10:50:00.000Z",
  },
  {
    id: "m2",
    clientId: VIOR_ID,
    createdBy: DEMO_RAHIM_ID,
    title: "Weekly performance check",
    meetingDate: today,
    meetingTime: "11:30",
    meetingType: "internal",
    participantIds: [DEMO_RAHIM_ID, DEMO_ADMIN_ID],
    actionItems: [],
    createdAt: "2026-09-05T08:20:00.000Z",
    updatedAt: "2026-09-05T08:20:00.000Z",
  },
  {
    id: "m3",
    clientId: BLOOM_ID,
    createdBy: DEMO_NADIA_ID,
    title: "Asset review",
    meetingDate: tomorrow,
    meetingTime: "15:00",
    meetingType: "client",
    participantIds: [DEMO_NADIA_ID],
    actionItems: [],
    createdAt: "2026-09-05T11:50:00.000Z",
    updatedAt: "2026-09-05T11:50:00.000Z",
  },
  {
    id: "m4",
    clientId: ATLAS_ID,
    createdBy: DEMO_NADIA_ID,
    title: "Catalog cleanup",
    meetingDate: yesterday,
    meetingTime: "10:00",
    meetingType: "internal",
    notes: "Reviewed missing SKUs and assigned feed fixes.",
    participantIds: [DEMO_NADIA_ID],
    actionItems: [
      {
        id: "ai3",
        meetingId: "m4",
        content: "Update landing page",
        completed: true,
        sortOrder: 0,
      },
    ],
    createdAt: "2026-09-03T08:00:00.000Z",
    updatedAt: "2026-09-03T10:00:00.000Z",
  },
]

const activities: Activity[] = [
  {
    id: "a1",
    type: "report_created",
    userId: DEMO_RAHIM_ID,
    clientId: CLOUDY_ID,
    entityId: "r1",
    summary: "Added daily report",
    createdAt: "2026-09-05T12:18:00.000Z",
  },
  {
    id: "a2",
    type: "meeting_notes_added",
    userId: DEMO_NADIA_ID,
    clientId: BLOOM_ID,
    entityId: "m3",
    summary: "Added meeting notes",
    createdAt: "2026-09-05T12:02:00.000Z",
  },
  {
    id: "a3",
    type: "report_created",
    userId: DEMO_NADIA_ID,
    clientId: BLOOM_ID,
    entityId: "r2",
    summary: "Added daily report",
    createdAt: "2026-09-05T11:32:00.000Z",
  },
  {
    id: "a4",
    type: "report_created",
    userId: DEMO_NADIA_ID,
    clientId: ATLAS_ID,
    entityId: "r3",
    summary: "Added daily report",
    createdAt: "2026-09-05T11:00:00.000Z",
  },
  {
    id: "a5",
    type: "meeting_created",
    userId: DEMO_RAHIM_ID,
    clientId: CLOUDY_ID,
    entityId: "m1",
    summary: "Added meeting",
    createdAt: "2026-09-05T09:20:00.000Z",
  },
]

export const DEMO_USERS = [
  { email: "farhan@brandingcurve.com", password: DEMO_PASSWORD, id: DEMO_ADMIN_ID },
  { email: "rahim@brandingcurve.com", password: DEMO_PASSWORD, id: DEMO_RAHIM_ID },
  { email: "nadia@brandingcurve.com", password: DEMO_PASSWORD, id: DEMO_NADIA_ID },
]

export function createSeedState(): AgencyState {
  return {
    profiles: structuredClone(profiles),
    clients: structuredClone(clients),
    assignments: structuredClone(assignments),
    reports: structuredClone(reports),
    meetings: structuredClone(meetings),
    activities: structuredClone(activities),
  }
}
