"use client"

import { use, useMemo, useState } from "react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { EmptyState } from "@/components/empty-state"
import { MeetingCard } from "@/components/meeting-card"
import { PageHeader } from "@/components/page-header"
import { ScreenSkeleton } from "@/components/screen-skeleton"
import { buttonVariants } from "@/components/ui/button"
import { ClientMark, UserAvatar } from "@/components/user-avatar"
import { useAgency } from "@/components/providers/agency-provider"
import { clientTimeline, meetingsForScope } from "@/lib/data/selectors"
import { formatTime, groupLabel } from "@/lib/dates"
import { displayName, TAG_LABELS } from "@/types/domain"

export default function ClientDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { user, state } = useAgency()
  const [tab, setTab] = useState<"timeline" | "reports" | "meetings">("timeline")
  const client = state.clients.find((item) => item.id === id)
  const timeline = useMemo(
    () => (client ? clientTimeline(state, client.id) : []),
    [client, state]
  )
  if (!user) return <ScreenSkeleton />
  const reports = state.reports.filter((report) => report.clientId === id)
  const meetings = meetingsForScope(state, user).filter((meeting) => meeting.clientId === id)

  if (!client) {
    return (
      <div>
        <PageHeader title="Client" backHref="/clients" />
        <div className="px-4">
          <EmptyState title="Client not found" />
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={client.name}
        subtitle={client.category}
        backHref="/clients"
        action={
          user.role === "admin" ? (
            <Link href={`/clients/${client.id}/edit`} className="text-sm font-medium">
              Edit
            </Link>
          ) : null
        }
      />
      <div className="px-4 pb-8">
        <div className="mb-4 flex items-center gap-3">
          <ClientMark name={client.name} className="size-14 text-base" />
          <div>
            <p className="text-xl font-semibold">{client.name}</p>
            <p className="text-sm text-muted-foreground">
              {client.contactPerson ? `Contact: ${client.contactPerson}` : client.category}
            </p>
          </div>
        </div>
        <div className="mb-5 grid grid-cols-2 gap-2">
          <Link href={`/report?client=${client.id}`} className={buttonVariants({ size: "xl" })}>
            Add Report
          </Link>
          <Link
            href={`/meetings/new?client=${client.id}`}
            className={buttonVariants({ size: "xl", variant: "outline" })}
          >
            Add Meeting
          </Link>
        </div>
        <div className="mb-4 grid grid-cols-3 rounded-full bg-secondary p-1">
          {(["timeline", "reports", "meetings"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`h-9 rounded-full text-sm capitalize ${
                tab === item ? "bg-white font-medium shadow-sm" : "text-muted-foreground"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {tab === "timeline" ? (
          timeline.length === 0 ? (
            <EmptyState title="No activity yet" description="Reports and meetings will appear here." />
          ) : (
            <Timeline items={timeline} state={state} />
          )
        ) : null}

        {tab === "reports" ? (
          reports.length === 0 ? (
            <EmptyState title="No reports yet" />
          ) : (
            <div className="space-y-3">
              {reports.map((report) => {
                const author = state.profiles.find((profile) => profile.id === report.userId)
                return (
                  <article key={report.id} className="rounded-2xl border border-border bg-white p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-medium">{groupLabel(report.reportDate)}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(report.createdAt), "h:mm a")}
                      </p>
                    </div>
                    <div className="mb-2 flex items-center gap-2">
                      <UserAvatar profile={author} className="size-7" />
                      <p className="text-sm">{displayName(author)}</p>
                    </div>
                    <p className="text-[15px] leading-6">{report.content}</p>
                  </article>
                )
              })}
            </div>
          )
        ) : null}

        {tab === "meetings" ? (
          meetings.length === 0 ? (
            <EmptyState title="No meetings yet" />
          ) : (
            <div className="space-y-2">
              {meetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  client={client}
                  participants={meeting.participantIds
                    .map((pid) => state.profiles.find((profile) => profile.id === pid))
                    .filter(Boolean) as never}
                />
              ))}
            </div>
          )
        ) : null}
      </div>
    </div>
  )
}

function Timeline({
  items,
  state,
}: {
  items: ReturnType<typeof clientTimeline>
  state: ReturnType<typeof useAgency>["state"]
}) {
  const groups = items.reduce<Record<string, typeof items>>((acc, item) => {
    const key = item.at.slice(0, 10)
    acc[key] ??= []
    acc[key].push(item)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([date, grouped]) => (
        <section key={date}>
          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {groupLabel(date)}
          </h3>
          <div className="space-y-3">
            {grouped.map((item) => {
              if (item.kind === "report") {
                const author = state.profiles.find((profile) => profile.id === item.report.userId)
                return (
                  <article key={item.report.id} className="rounded-2xl border border-border bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Daily Report
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatTime(format(parseISO(item.report.createdAt), "HH:mm"))} · {displayName(author)}
                    </p>
                    <p className="mt-3 text-[15px] leading-6">{item.report.content}</p>
                    {item.report.tags.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {item.report.tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-secondary px-2.5 py-1 text-xs">
                            {TAG_LABELS[tag]}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </article>
                )
              }
              return (
                <article key={item.meeting.id} className="rounded-2xl border border-border bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Meeting
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatTime(item.meeting.meetingTime)} · {item.meeting.title}
                  </p>
                  {item.meeting.notes ? (
                    <p className="mt-3 text-[15px] leading-6">“{item.meeting.notes}”</p>
                  ) : null}
                  {item.meeting.actionItems.length > 0 ? (
                    <div className="mt-3">
                      <p className="text-sm font-medium">Action Items</p>
                      <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                        {item.meeting.actionItems.map((action) => (
                          <li key={action.id}>• {action.content}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </article>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
