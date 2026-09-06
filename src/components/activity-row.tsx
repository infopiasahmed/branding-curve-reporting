import Link from "next/link"
import { UserAvatar } from "@/components/user-avatar"
import { formatRelative } from "@/lib/dates"
import { displayName, type Activity, type Client, type Profile } from "@/types/domain"

export function ActivityRow({
  activity,
  actor,
  client,
}: {
  activity: Activity
  actor?: Profile
  client?: Client
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <UserAvatar profile={actor} className="size-9" />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] leading-5">
          <span className="font-medium">{displayName(actor)}</span>
          {client ? (
            <>
              {" "}
              <Link href={`/clients/${client.id}`} className="font-medium">
                {client.name}
              </Link>
            </>
          ) : null}
        </p>
        <p className="text-sm text-muted-foreground">{activity.summary}</p>
      </div>
      <p className="shrink-0 text-xs text-muted-foreground">
        {formatRelative(activity.createdAt)}
      </p>
    </div>
  )
}
