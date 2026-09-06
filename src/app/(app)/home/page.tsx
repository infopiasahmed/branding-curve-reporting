"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ActivityRow } from "@/components/activity-row"
import { EmptyState } from "@/components/empty-state"
import { MeetingCard } from "@/components/meeting-card"
import { ProgressBlock } from "@/components/progress-block"
import { ScreenSkeleton } from "@/components/screen-skeleton"
import { buttonVariants } from "@/components/ui/button"
import { UserAvatar } from "@/components/user-avatar"
import { useAgency } from "@/components/providers/agency-provider"
import { formatLongDate, todayISO } from "@/lib/dates"
import {
  assignmentsForClient,
  clientsForUser,
  meetingsForScope,
  reportingProgress,
  todayReport,
  visibleActivities,
} from "@/lib/data/selectors"
import { displayName } from "@/types/domain"

export default function HomePage() {
  const { user, state } = useAgency()
  const router = useRouter()
  if (!user) return <ScreenSkeleton />

  const progress = reportingProgress(state, user)
  const clients = clientsForUser(state, user)
  const pending =
    user.role === "admin"
      ? progress.pending
      : progress.pending.filter((item) => item.marketer.id === user.id)
  const completedClients = clients.filter((client) =>
    user.role === "admin"
      ? assignmentsForClient(state, client.id).every((marketer) =>
          todayReport(state, marketer.id, client.id)
        )
      : todayReport(state, user.id, client.id)
  )
  const meetings = meetingsForScope(state, user).filter(
    (meeting) => meeting.meetingDate === todayISO()
  )
  const activities = visibleActivities(state, user).slice(0, 6)

  return (
    <div>
      <header className="flex items-start justify-between px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div>
          <p className="text-sm text-muted-foreground">{formatLongDate()}</p>
          <h1 className="mt-1 text-[28px] font-semibold leading-tight tracking-tight">
            Good morning, {user.firstName}
          </h1>
        </div>
        <Link href="/profile">
          <UserAvatar profile={user} className="size-11" />
        </Link>
      </header>

      <div className="space-y-7 px-4 pb-6">
        {user.role === "admin" ? (
          <>
            <ProgressBlock
              label="Today's Reporting"
              completed={progress.completed}
              total={progress.total}
            />
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Completed" value={progress.completed} />
              <Stat label="Pending" value={progress.pending.length} attention={progress.pending.length > 0} />
              <Stat label="Meetings today" value={meetings.length} />
            </div>
            <section>
              <SectionTitle>Needs Attention</SectionTitle>
              {pending.length === 0 ? (
                <EmptyState title="All reports are in" description="Nothing needs attention right now." />
              ) : (
                <div className="space-y-2">
                  {pending.map((item) => (
                    <button
                      key={`${item.client.id}-${item.marketer.id}`}
                      type="button"
                      onClick={() => router.push(`/clients/${item.client.id}`)}
                      className="flex w-full items-center justify-between rounded-2xl border border-border bg-white px-4 py-3.5 text-left"
                    >
                      <div>
                        <p className="font-semibold">{item.client.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Assigned to {displayName(item.marketer)}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-[oklch(0.55_0.14_55)]">
                        Report pending
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : (
          <>
            <ProgressBlock
              label="Today's Reports"
              completed={progress.completed}
              total={progress.total}
            />
            <section>
              <SectionTitle>Pending Reports</SectionTitle>
              {pending.length === 0 ? (
                <EmptyState title="You're all caught up" description="Every assigned client has a report today." />
              ) : (
                <div className="space-y-2">
                  {pending.map((item) => (
                    <div
                      key={item.client.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-white px-4 py-3.5"
                    >
                      <div>
                        <p className="font-semibold">{item.client.name}</p>
                        <p className="text-sm text-[oklch(0.55_0.14_55)]">Report pending</p>
                      </div>
                      <Link href={`/report?client=${item.client.id}`} className={buttonVariants()}>
                        Add Report
                      </Link>
                    </div>
                  ))}
                </div>
              )}
              {completedClients.length > 0 ? (
                <div className="mt-3 space-y-1.5 opacity-70">
                  {completedClients.map((client) => (
                    <Link
                      key={client.id}
                      href={`/clients/${client.id}`}
                      className="flex items-center justify-between rounded-xl px-2 py-2 text-sm"
                    >
                      <span>{client.name}</span>
                      <span className="text-[var(--success)]">Reported today</span>
                    </Link>
                  ))}
                </div>
              ) : null}
            </section>
          </>
        )}

        <section>
          <SectionTitle>Today&apos;s Meetings</SectionTitle>
          {meetings.length === 0 ? (
            <EmptyState
              title="No meetings today"
              action={
                <Link href="/meetings/new" className={buttonVariants({ variant: "outline" })}>
                  Add Meeting
                </Link>
              }
            />
          ) : (
            <div className="space-y-2">
              {meetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  client={state.clients.find((client) => client.id === meeting.clientId)}
                  participants={meeting.participantIds
                    .map((id) => state.profiles.find((profile) => profile.id === id))
                    .filter(Boolean) as never}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionTitle>Recent Activity</SectionTitle>
          {activities.length === 0 ? (
            <EmptyState title="No activity yet" />
          ) : (
            <div className="divide-y divide-border rounded-2xl border border-border bg-white px-4">
              {activities.map((activity) => (
                <ActivityRow
                  key={activity.id}
                  activity={activity}
                  actor={state.profiles.find((profile) => profile.id === activity.userId)}
                  client={state.clients.find((client) => client.id === activity.clientId)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{children}</h2>
}

function Stat({
  label,
  value,
  attention,
}: {
  label: string
  value: number
  attention?: boolean
}) {
  return (
    <div className="rounded-2xl border border-border bg-white px-3 py-3">
      <p className="text-xl font-semibold">{value}</p>
      <p className={`text-xs ${attention ? "text-[oklch(0.55_0.14_55)]" : "text-muted-foreground"}`}>
        {label}
      </p>
    </div>
  )
}
