"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { MeetingCard } from "@/components/meeting-card"
import { PageHeader } from "@/components/page-header"
import { ScreenSkeleton } from "@/components/screen-skeleton"
import { buttonVariants } from "@/components/ui/button"
import { useAgency } from "@/components/providers/agency-provider"
import { meetingsForScope } from "@/lib/data/selectors"
import { todayISO } from "@/lib/dates"
import type { Meeting } from "@/types/domain"

export default function MeetingsPage() {
  const { user, state } = useAgency()
  if (!user) return <ScreenSkeleton />

  const meetings = meetingsForScope(state, user)
  const today = todayISO()
  const groups = {
    Today: meetings.filter((meeting) => meeting.meetingDate === today),
    Upcoming: meetings.filter((meeting) => meeting.meetingDate > today),
    Past: meetings.filter((meeting) => meeting.meetingDate < today),
  }

  return (
    <div>
      <PageHeader
        title="Meetings"
        action={
          <Link href="/meetings/new" className={buttonVariants({ size: "icon-lg" })} aria-label="Add meeting">
            <Plus className="size-5" />
          </Link>
        }
      />
      <div className="space-y-6 px-4 pb-8">
        {(Object.entries(groups) as [string, Meeting[]][]).map(([label, items]) => (
          <section key={label}>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {label}
            </h2>
            {items.length === 0 ? (
              <EmptyState title={`No ${label.toLowerCase()} meetings`} />
            ) : (
              <div className="space-y-2">
                {items.map((meeting) => (
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
        ))}
      </div>
    </div>
  )
}
