"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { ScreenSkeleton } from "@/components/screen-skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UserAvatar } from "@/components/user-avatar"
import { useAgency } from "@/components/providers/agency-provider"
import { assignmentsForUser, reportingProgress } from "@/lib/data/selectors"
import { displayName } from "@/types/domain"

export default function TeamPage() {
  const { user, state, inviteMarketer } = useAgency()
  const [open, setOpen] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  if (!user) return <ScreenSkeleton />
  if (user.role !== "admin") {
    return (
      <div>
        <PageHeader title="Team" backHref="/profile" />
        <div className="px-4">
          <EmptyState title="Admin only" description="Only admins can view the team." />
        </div>
      </div>
    )
  }

  const marketers = state.profiles.filter((profile) => profile.role === "marketer")

  async function onInvite(event: FormEvent) {
    event.preventDefault()
    try {
      await inviteMarketer({ firstName, lastName, email })
      setFirstName("")
      setLastName("")
      setEmail("")
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not invite marketer")
    }
  }

  return (
    <div>
      <PageHeader
        title="Team"
        backHref="/profile"
        action={
          <Button onClick={() => setOpen((value) => !value)}>Invite</Button>
        }
      />
      <div className="space-y-3 px-4 pb-8">
        {open ? (
          <form onSubmit={onInvite} className="space-y-3 rounded-2xl border border-border bg-white p-4">
            <Input className="h-12 rounded-xl" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            <Input className="h-12 rounded-xl" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            <Input className="h-12 rounded-xl" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Button type="submit" size="xl" className="w-full">Add marketer</Button>
          </form>
        ) : null}
        {marketers.map((marketer) => {
          const progress = reportingProgress(state, marketer)
          const assigned = assignmentsForUser(state, marketer.id)
          return (
            <Link
              key={marketer.id}
              href={`/team/${marketer.id}`}
              className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4"
            >
              <UserAvatar profile={marketer} className="size-12" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{displayName(marketer)}</p>
                <p className="text-sm capitalize text-muted-foreground">{marketer.role}</p>
                <p className="mt-1 text-sm">
                  Today&apos;s reporting: {progress.completed} / {progress.total} completed
                </p>
                <p className="text-sm text-muted-foreground">Assigned clients: {assigned.length}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
