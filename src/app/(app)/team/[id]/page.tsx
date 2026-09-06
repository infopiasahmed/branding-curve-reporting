"use client"

import { use, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { ActivityRow } from "@/components/activity-row"
import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { ScreenSkeleton } from "@/components/screen-skeleton"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/user-avatar"
import { useAgency } from "@/components/providers/agency-provider"
import { assignmentsForUser, reportingProgress } from "@/lib/data/selectors"
import { displayName } from "@/types/domain"

export default function MarketerDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { user, state, setAssignments } = useAgency()
  const marketer = state.profiles.find((profile) => profile.id === id)
  const assigned = marketer ? assignmentsForUser(state, marketer.id) : []
  const assignedKey = assigned.map((client) => client.id).sort().join(",")
  const [selected, setSelected] = useState<string[]>([])
  const [syncedKey, setSyncedKey] = useState("")
  if (assignedKey !== syncedKey) {
    setSyncedKey(assignedKey)
    setSelected(assigned.map((client) => client.id))
  }

  if (!user) return <ScreenSkeleton />
  if (user.role !== "admin" || !marketer) {
    return (
      <div>
        <PageHeader title="Marketer" backHref="/team" />
        <div className="px-4">
          <EmptyState title="Not available" />
        </div>
      </div>
    )
  }

  const progress = reportingProgress(state, marketer)
  const reports = state.reports.filter((report) => report.userId === marketer.id).slice(0, 5)
  const meetings = state.meetings.filter(
    (meeting) => meeting.createdBy === marketer.id || meeting.participantIds.includes(marketer.id)
  ).slice(0, 5)
  const activities = state.activities.filter((activity) => activity.userId === marketer.id).slice(0, 6)

  return (
    <div>
      <PageHeader title={displayName(marketer)} backHref="/team" />
      <div className="space-y-6 px-4 pb-8">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4">
          <UserAvatar profile={marketer} className="size-14" />
          <div>
            <p className="font-semibold">{displayName(marketer)}</p>
            <p className="text-sm text-muted-foreground">{marketer.email}</p>
            <p className="mt-1 text-sm">
              Today: {progress.completed} / {progress.total} completed
            </p>
          </div>
        </div>

        <section>
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Assigned clients
          </h2>
          <div className="space-y-2 rounded-2xl border border-border bg-white p-3">
            {state.clients
              .filter((client) => client.status === "active")
              .map((client) => (
                <label key={client.id} className="flex min-h-11 items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(client.id)}
                    onChange={(event) => {
                      setSelected((current) =>
                        event.target.checked
                          ? [...current, client.id]
                          : current.filter((id) => id !== client.id)
                      )
                    }}
                  />
                  <span>{client.name}</span>
                </label>
              ))}
          </div>
          <Button
            className="mt-3 w-full"
            size="xl"
            onClick={async () => {
              await setAssignments(marketer.id, selected)
              toast.success("Assignments updated")
            }}
          >
            Save assignments
          </Button>
        </section>

        <section>
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Recent reports
          </h2>
          {reports.length === 0 ? (
            <EmptyState title="No reports yet" />
          ) : (
            <div className="space-y-2">
              {reports.map((report) => {
                const client = state.clients.find((item) => item.id === report.clientId)
                return (
                  <Link
                    key={report.id}
                    href={`/clients/${report.clientId}`}
                    className="block rounded-2xl border border-border bg-white p-4"
                  >
                    <p className="font-medium">{client?.name}</p>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{report.content}</p>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Recent meetings
          </h2>
          {meetings.length === 0 ? (
            <EmptyState title="No meetings yet" />
          ) : (
            <div className="space-y-2">
              {meetings.map((meeting) => (
                <Link
                  key={meeting.id}
                  href={`/meetings/${meeting.id}`}
                  className="block rounded-2xl border border-border bg-white p-4"
                >
                  <p className="font-medium">{meeting.title}</p>
                  <p className="text-sm text-muted-foreground">{meeting.meetingDate}</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Recent activity
          </h2>
          <div className="divide-y divide-border rounded-2xl border border-border bg-white px-4">
            {activities.map((activity) => (
              <ActivityRow
                key={activity.id}
                activity={activity}
                actor={marketer}
                client={state.clients.find((client) => client.id === activity.clientId)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
