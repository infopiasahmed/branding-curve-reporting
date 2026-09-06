import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { initials, type Profile } from "@/types/domain"

export function UserAvatar({
  profile,
  className,
}: {
  profile?: Profile | null
  className?: string
}) {
  return (
    <Avatar className={cn("size-10", className)}>
      {profile?.avatarUrl ? <AvatarImage src={profile.avatarUrl} alt="" /> : null}
      <AvatarFallback className="bg-secondary text-xs font-medium">
        {initials(profile)}
      </AvatarFallback>
    </Avatar>
  )
}

export function ClientMark({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-sm font-semibold text-foreground",
        className
      )}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  )
}
