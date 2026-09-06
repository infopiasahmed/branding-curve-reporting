import Link from "next/link"
import { ClientMark } from "@/components/user-avatar"
import { formatTime } from "@/lib/dates"
import { displayName, type Client, type Meeting, type Profile } from "@/types/domain"

export function MeetingCard({
  meeting,
  client,
  participants,
}: {
  meeting: Meeting
  client?: Client
  participants: Profile[]
}) {
  return (
    <Link
      href={`/meetings/${meeting.id}`}
      className="block rounded-2xl border border-border bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(20,16,12,0.04)]"
    >
      <div className="flex items-start gap-3">
        <ClientMark name={client?.name ?? "?"} className="size-10 text-xs" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">
            {formatTime(meeting.meetingTime)}
          </p>
          <p className="truncate text-[15px] font-semibold">{client?.name}</p>
          <p className="truncate text-sm text-muted-foreground">{meeting.title}</p>
          {participants.length > 0 ? (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {participants.map(displayName).join(", ")}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  )
}
