"use client"

import { useState } from "react"
import Link from "next/link"
import { EllipsisVertical } from "lucide-react"
import { toast } from "sonner"
import {
  cancelMarketerInvitation,
  deactivateMarketer,
  type TeamRosterMember,
} from "@/app/actions/team-admin"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserAvatar } from "@/components/user-avatar"
import { formatTeamDate } from "@/lib/dates"
import type { Profile } from "@/types/domain"
import { displayName } from "@/types/domain"

function statusLabel(status: TeamRosterMember["status"]) {
  if (status === "pending") return "Pending Invite"
  if (status === "inactive") return "Inactive"
  return "Active"
}

function statusVariant(status: TeamRosterMember["status"]) {
  if (status === "pending") return "outline" as const
  if (status === "inactive") return "secondary" as const
  return "default" as const
}

function statusDetail(member: TeamRosterMember) {
  if (member.status === "pending") {
    return member.invitedAt ? `Invited ${formatTeamDate(member.invitedAt)}` : "Invited"
  }
  if (member.status === "active") {
    return member.acceptedAt ? `Joined ${formatTeamDate(member.acceptedAt)}` : "Joined"
  }
  return "Inactive"
}

export function TeamMarketerCard({
  profile,
  member,
  completed,
  total,
  assignedCount,
  onChanged,
}: {
  profile: Profile
  member: TeamRosterMember | null
  completed: number
  total: number
  assignedCount: number
  onChanged: () => Promise<void>
}) {
  const status = member?.status
  const name = displayName(profile)
  const [dialog, setDialog] = useState<"cancel" | "remove" | null>(null)
  const [busy, setBusy] = useState(false)

  async function onCancelInvitation() {
    if (busy) return
    setBusy(true)
    try {
      const result = await cancelMarketerInvitation(profile.id)
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      setDialog(null)
      toast.success("Invitation cancelled")
      await onChanged()
    } catch {
      toast.error("Could not cancel the invitation.")
    } finally {
      setBusy(false)
    }
  }

  async function onRemoveMarketer() {
    if (busy) return
    setBusy(true)
    try {
      const result = await deactivateMarketer(profile.id)
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      setDialog(null)
      toast.success("Marketer removed")
      await onChanged()
    } catch {
      toast.error("Could not remove the marketer.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative rounded-2xl border border-border bg-white">
      <Link href={`/team/${profile.id}`} className="flex items-center gap-3 p-4 pr-12">
        <UserAvatar profile={profile} className="size-12" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{name}</p>
            {member ? (
              <Badge variant={statusVariant(member.status)}>{statusLabel(member.status)}</Badge>
            ) : null}
          </div>
          <p className="text-sm capitalize text-muted-foreground">{profile.role}</p>
          {member ? (
            <p className="text-sm text-muted-foreground">{statusDetail(member)}</p>
          ) : null}
          <p className="mt-1 text-sm">
            Today&apos;s reporting: {completed} / {total} completed
          </p>
          <p className="text-sm text-muted-foreground">Assigned clients: {assignedCount}</p>
        </div>
      </Link>

      <div className="absolute top-2 right-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9"
                aria-label={`${name} actions`}
              />
            }
          >
            <EllipsisVertical />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            {status === "pending" ? (
              <DropdownMenuItem variant="destructive" onClick={() => setDialog("cancel")}>
                Cancel invitation
              </DropdownMenuItem>
            ) : null}
            {status === "active" ? (
              <DropdownMenuItem variant="destructive" onClick={() => setDialog("remove")}>
                Remove marketer
              </DropdownMenuItem>
            ) : null}
            {status === "inactive" || !status ? (
              <DropdownMenuItem render={<Link href={`/team/${profile.id}`} />}>
                View details
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={dialog === "cancel"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Cancel invitation?</DialogTitle>
            <DialogDescription>
              {name} has not accepted the invitation yet. Cancelling it will remove the pending
              account and allow this email to be invited again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={busy} onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={busy} onClick={() => void onCancelInvitation()}>
              {busy ? "Cancelling..." : "Cancel invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "remove"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Remove marketer?</DialogTitle>
            <DialogDescription>
              {name} will lose access and all client assignments. Their reports, meetings, and
              activity history will remain in Branding Curve.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={busy} onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={busy} onClick={() => void onRemoveMarketer()}>
              {busy ? "Removing..." : "Remove marketer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
